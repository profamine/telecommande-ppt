// Serveur de télécommande PowerPoint : sert l'interface mobile et relaie
// les commandes vers PowerPoint via un processus PowerShell persistant.
//
// Utilisable de deux façons :
//   - en ligne de commande : `node server.js` (affiche l'adresse et un QR code) ;
//   - comme module, depuis l'application de bureau : `createRemoteServer({...}).start()`.

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const { WebSocketServer } = require('ws');

const POLL_MS = 800;
const IDLE_POLL_MS = 2000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

const COMMANDS = new Set(['next', 'prev', 'goto', 'start', 'end', 'black', 'white', 'status']);
const LASER_COMMANDS = new Set(['laserOn', 'laser', 'laserOff']);

const PROBLEM_MESSAGES = {
  admin: 'La télécommande est lancée en administrateur : elle ne voit pas PowerPoint. Relancez-la normalement.',
  pptAdmin: 'PowerPoint est lancé en administrateur : relancez-le normalement.',
  inaccessible: 'PowerPoint ne répond pas : cliquez une fois en dehors de PowerPoint.',
};

function randomPin() {
  return String(crypto.randomInt(1000, 10000));
}

function lanAddresses() {
  const out = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    for (const a of list || []) {
      if (a.family === 'IPv4' && !a.internal && !/vEthernet|VirtualBox|VMware|WSL|Loopback/i.test(name)) {
        out.push({ name, address: a.address });
      }
    }
  }
  return out;
}

/**
 * Options :
 *   port, pin            : port d'écoute et code PIN
 *   publicDir, bridgePath: interface mobile et script PowerShell
 *   apkPath              : APK Android servie sur /apk (facultatif)
 *   alwaysPoll           : interroger PowerPoint même sans téléphone connecté (pour l'appli de bureau)
 * Événements : 'listening', 'status', 'clients', 'problem', 'error', 'log'
 */
function createRemoteServer(options = {}) {
  const events = new EventEmitter();
  const opts = {
    port: 8765,
    pin: randomPin(),
    publicDir: path.join(__dirname, 'public'),
    bridgePath: path.join(__dirname, 'bridge.ps1'),
    apkPath: path.join(__dirname, 'Telecommande-PPT.apk'),
    alwaysPoll: false,
    ...options,
  };
  let pin = String(opts.pin);
  let stopped = false;

  // ---------- Pont PowerShell ----------

  let bridge;
  let nextId = 1;
  const pending = new Map();
  let buffer = '';

  function startBridge() {
    bridge = spawn('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', opts.bridgePath,
    ], { windowsHide: true });

    bridge.stdout.setEncoding('utf8');
    bridge.stdout.on('data', (chunk) => {
      buffer += chunk;
      let nl;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl).trim().replace(/^﻿/, '');
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        let msg;
        try { msg = JSON.parse(line); } catch { continue; }
        const p = pending.get(msg.id);
        if (!p) continue;
        pending.delete(msg.id);
        clearTimeout(p.timer);
        msg.ok ? p.resolve(msg.data) : p.reject(new Error(msg.error));
      }
    });
    bridge.stderr.on('data', (d) => events.emit('log', `[pont] ${d.toString().trim()}`));
    bridge.on('exit', (code) => {
      for (const p of pending.values()) p.reject(new Error('Pont redémarré'));
      pending.clear();
      buffer = '';
      if (stopped) return;
      events.emit('log', `[pont] arrêté (code ${code}), redémarrage…`);
      setTimeout(startBridge, 1000);
    });
  }

  function call(cmd, arg = null, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error('Délai dépassé'));
      }, timeoutMs);
      pending.set(id, { resolve, reject, timer });
      bridge.stdin.write(JSON.stringify({ id, cmd, arg }) + '\n');
    });
  }

  // ---------- État partagé ----------

  let lastStatus = null;
  let lastStatusJson = '';
  const clients = new Map(); // ws -> adresse

  function emitClients() {
    events.emit('clients', [...clients.values()]);
  }

  function broadcast(status) {
    const json = JSON.stringify(status);
    if (json === lastStatusJson) return;
    if (status && status.problem && status.problem !== (lastStatus && lastStatus.problem)) {
      events.emit('problem', PROBLEM_MESSAGES[status.problem] || status.problem);
    }
    lastStatus = status;
    lastStatusJson = json;
    events.emit('status', status);
    const msg = JSON.stringify({ type: 'status', status });
    for (const ws of clients.keys()) if (ws.readyState === ws.OPEN) ws.send(msg);
  }

  let polling = false;
  let lastPoll = 0;
  const poller = setInterval(async () => {
    if (polling || stopped) return;
    if (clients.size === 0 && (!opts.alwaysPoll || Date.now() - lastPoll < IDLE_POLL_MS)) return;
    polling = true;
    lastPoll = Date.now();
    try { broadcast(await call('status')); } catch { /* PowerPoint occupé */ }
    polling = false;
  }, POLL_MS);

  // ---------- HTTP ----------

  const checkPin = (url) => url.searchParams.get('pin') === pin;

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');

    // Application Android à télécharger depuis le téléphone
    if (url.pathname === '/apk') {
      fs.stat(opts.apkPath, (err, st) => {
        if (err) { res.writeHead(404); return res.end('APK introuvable'); }
        res.writeHead(200, {
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Length': st.size,
          'Content-Disposition': 'attachment; filename="Telecommande-PPT.apk"',
        });
        fs.createReadStream(opts.apkPath).pipe(res);
      });
      return;
    }

    // Miniature d'une diapositive : /thumb/3?pin=1234
    const m = url.pathname.match(/^\/thumb\/(\d+)$/);
    if (m) {
      if (!checkPin(url)) { res.writeHead(403); return res.end(); }
      try {
        const { file } = await call('thumb', Number(m[1]), 30000);
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=30' });
        fs.createReadStream(file).pipe(res);
      } catch (e) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(e.message);
      }
      return;
    }

    // Fichiers statiques
    const rel = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const file = path.normalize(path.join(opts.publicDir, rel));
    if (!file.startsWith(opts.publicDir)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end('Introuvable'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  });

  // ---------- WebSocket ----------

  // Déplacements du laser : on n'envoie au pont que la dernière position connue,
  // pour ne pas accumuler de retard quand le doigt bouge plus vite que PowerPoint.
  let laserBusy = false;
  let laserNext = null;
  function moveLaser(point) {
    if (laserBusy) { laserNext = point; return; }
    laserBusy = true;
    call('laser', point).catch(() => {}).finally(() => {
      laserBusy = false;
      if (laserNext) { const p = laserNext; laserNext = null; moveLaser(p); }
    });
  }

  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    if (!checkPin(url)) {
      ws.send(JSON.stringify({ type: 'auth', ok: false }));
      return ws.close(4001, 'PIN invalide');
    }
    ws.send(JSON.stringify({ type: 'auth', ok: true }));
    clients.set(ws, (req.socket.remoteAddress || '').replace(/^::ffff:/, ''));
    emitClients();
    if (lastStatus) ws.send(JSON.stringify({ type: 'status', status: lastStatus }));

    ws.on('message', async (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }
      if (LASER_COMMANDS.has(msg.cmd)) {
        if (msg.cmd === 'laser') return moveLaser(msg.arg);
        laserNext = null;
        call(msg.cmd, msg.arg ?? null).catch((e) => ws.send(JSON.stringify({ type: 'error', message: e.message })));
        return;
      }
      if (!COMMANDS.has(msg.cmd)) return;
      try {
        const status = await call(msg.cmd, msg.arg ?? null);
        lastStatusJson = ''; // force l'envoi
        broadcast(status);
      } catch (e) {
        ws.send(JSON.stringify({ type: 'error', message: e.message }));
      }
    });
    ws.on('close', () => { clients.delete(ws); emitClients(); });
  });

  server.on('error', (e) => events.emit('error', e));

  // ---------- API ----------

  // defineProperties (et non Object.assign) pour garder les accesseurs « vivants »
  return Object.defineProperties(events, Object.getOwnPropertyDescriptors({
    start() {
      startBridge();
      server.listen(opts.port, '0.0.0.0', () => {
        events.emit('listening', { port: opts.port, addresses: lanAddresses() });
      });
      return events;
    },
    stop() {
      stopped = true;
      clearInterval(poller);
      for (const ws of clients.keys()) ws.terminate();
      wss.close();
      server.close();
      if (bridge) bridge.kill();
    },
    /** Change le PIN et déconnecte les appareils, qui devront saisir le nouveau. */
    setPin(newPin) {
      pin = String(newPin);
      for (const ws of clients.keys()) ws.close(4001, 'PIN modifié');
    },
    get pin() { return pin; },
    get port() { return opts.port; },
    get status() { return lastStatus; },
    addresses: lanAddresses,
  }));
}

module.exports = { createRemoteServer, lanAddresses, randomPin, PROBLEM_MESSAGES };

// ---------- Ligne de commande ----------

if (require.main === module) {
  const qrcode = require('qrcode-terminal');
  const remote = createRemoteServer({
    port: Number(process.env.PORT) || 8765,
    pin: process.env.PIN || randomPin(),
  });
  remote.on('log', (m) => console.error(m));
  remote.on('problem', (m) => console.warn(`⚠ ${m}`));
  remote.on('clients', (list) => console.log(`📱 Appareils connectés : ${list.length}`));
  remote.on('error', (e) => { console.error(e.message); process.exit(1); });
  remote.on('listening', ({ port, addresses }) => {
    const { pin } = remote;
    console.log('\n=== Télécommande PowerPoint ===');
    console.log('Réalisé par : AMINE AMAHAN\n');
    console.log(`Code PIN : ${pin}\n`);
    if (addresses.length === 0) {
      console.log(`Aucun réseau détecté. Local : http://localhost:${port}/?pin=${pin}`);
      return;
    }
    for (const a of addresses) console.log(`→ http://${a.address}:${port}/?pin=${pin}`);
    console.log('\nScannez ce QR code avec votre téléphone (même Wi-Fi que ce PC) :\n');
    qrcode.generate(`http://${addresses[0].address}:${port}/?pin=${pin}`, { small: true });
    console.log('Ctrl+C pour arrêter.\n');
  });
  remote.start();
}
