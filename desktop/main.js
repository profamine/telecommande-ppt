// Application de bureau : fenêtre de contrôle + icône dans la zone de notification.
// Elle démarre le serveur de télécommande et affiche le QR code, le PIN et l'état de PowerPoint.

const { app, BrowserWindow, Tray, Menu, ipcMain, clipboard, shell, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const { createRemoteServer, randomPin } = require('../server.js');

const ROOT = path.join(__dirname, '..');
// Les fichiers lus par PowerShell doivent être hors de l'archive asar
const unpacked = (p) => p.replace(`app.asar${path.sep}`, `app.asar.unpacked${path.sep}`);
const APK_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'Telecommande-PPT.apk')
  : path.join(ROOT, 'Telecommande-PPT.apk');
const ICON = path.join(__dirname, 'assets', 'icon.png');
const startHidden = process.argv.includes('--hidden');

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => showWindow());
  app.whenReady().then(init);
}

// ---------- Réglages ----------

const configFile = () => path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  let c = {};
  try { c = JSON.parse(fs.readFileSync(configFile(), 'utf8')); } catch { /* premier lancement */ }
  if (!/^\d{4,6}$/.test(String(c.pin || ''))) c.pin = randomPin();
  c.port = Number(c.port) || 8765;
  return c;
}

function saveConfig() {
  try {
    fs.mkdirSync(path.dirname(configFile()), { recursive: true });
    fs.writeFileSync(configFile(), JSON.stringify(config, null, 2));
  } catch { /* non bloquant */ }
}

// ---------- État ----------

let config;
let remote;
let win;
let tray;
let quitting = false;
let hintShown = false;
const state = {
  version: app.getVersion(),
  pin: '',
  port: 8765,
  addresses: [],
  ip: null,
  url: '',
  qr: '',
  apkUrl: '',
  apkQr: '',
  apkAvailable: false,
  clients: [],
  status: null,
  problem: null,
  listening: false,
  error: null,
  autostart: false,
};

async function refreshUrls() {
  state.pin = remote.pin;
  state.port = remote.port;
  state.addresses = remote.addresses();
  if (!state.addresses.some((a) => a.address === state.ip)) {
    const saved = state.addresses.find((a) => a.address === config.ip);
    state.ip = (saved || state.addresses[0] || { address: null }).address;
  }
  const host = state.ip || 'localhost';
  state.url = `http://${host}:${state.port}/?pin=${state.pin}`;
  state.apkUrl = `http://${host}:${state.port}/apk`;
  state.apkAvailable = fs.existsSync(APK_PATH);
  const qrOpts = { margin: 1, width: 560, errorCorrectionLevel: 'M', color: { dark: '#111318', light: '#ffffff' } };
  state.qr = await QRCode.toDataURL(state.url, qrOpts);
  state.apkQr = state.apkAvailable ? await QRCode.toDataURL(state.apkUrl, qrOpts) : '';
  push();
}

function push() {
  if (win && !win.isDestroyed()) win.webContents.send('state', state);
  updateTray();
}

// ---------- Démarrage ----------

async function init() {
  app.setAppUserModelId('com.pptremote.desktop');
  config = loadConfig();
  saveConfig();
  state.autostart = app.getLoginItemSettings({ args: ['--hidden'] }).openAtLogin;

  remote = createRemoteServer({
    port: config.port,
    pin: config.pin,
    publicDir: path.join(ROOT, 'public'),
    bridgePath: unpacked(path.join(ROOT, 'bridge.ps1')),
    apkPath: APK_PATH,
    alwaysPoll: true,
  });
  remote.on('listening', () => { state.listening = true; state.error = null; refreshUrls(); });
  remote.on('status', (s) => { state.status = s; state.problem = s && s.problem ? s.problem : null; push(); });
  remote.on('clients', (list) => { state.clients = list; push(); });
  remote.on('error', (e) => {
    state.error = e.code === 'EADDRINUSE'
      ? `Le port ${config.port} est déjà utilisé. Fermez l'ancienne version (Demarrer.bat) ou une autre télécommande, puis relancez l'application.`
      : e.message;
    push();
    if (e.code === 'EADDRINUSE') dialog.showErrorBox('Télécommande PPT', state.error);
  });
  remote.start();

  createTray();
  if (!startHidden) createWindow();

  // Les adresses réseau changent (Wi-Fi, partage de connexion…) : on les surveille
  setInterval(() => {
    const now = JSON.stringify(remote.addresses());
    if (now !== JSON.stringify(state.addresses)) refreshUrls();
  }, 5000);
}

function createWindow() {
  win = new BrowserWindow({
    width: 1040,
    height: 700,
    minWidth: 860,
    minHeight: 600,
    show: false,
    backgroundColor: '#111318',
    icon: ICON,
    title: 'Télécommande PPT',
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#111318', symbolColor: '#eef0f5', height: 44 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, 'ui', 'index.html'));
  win.once('ready-to-show', () => win.show());
  win.webContents.on('did-finish-load', push);
  // Liens externes dans le navigateur, jamais dans la fenêtre
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.on('close', (e) => {
    if (quitting) return;
    e.preventDefault();
    win.hide();
    if (!hintShown && tray) {
      hintShown = true;
      tray.displayBalloon({
        iconType: 'info',
        title: 'Télécommande PPT',
        content: 'La télécommande reste active ici. Clic droit sur l\'icône pour quitter.',
      });
    }
  });
}

function showWindow() {
  if (!win || win.isDestroyed()) createWindow();
  else { if (win.isMinimized()) win.restore(); win.show(); win.focus(); }
}

function quit() {
  quitting = true;
  try { remote.stop(); } catch { /* déjà arrêté */ }
  app.quit();
}

// ---------- Zone de notification ----------

function createTray() {
  tray = new Tray(nativeImage.createFromPath(ICON).resize({ width: 16, height: 16 }));
  tray.on('click', showWindow);
  updateTray();
}

function updateTray() {
  if (!tray) return;
  const s = state.status;
  const ppt = s && s.presentation ? `${s.presentation} — ${s.slide}/${s.total}` : 'Aucune présentation';
  tray.setToolTip(`Télécommande PPT\nPIN ${state.pin} · ${state.clients.length} appareil(s)\n${ppt}`);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Ouvrir la télécommande', click: showWindow },
    { label: `Code PIN : ${state.pin}`, enabled: false },
    { label: `${state.clients.length} appareil(s) connecté(s)`, enabled: false },
    { type: 'separator' },
    { label: 'Quitter', click: quit },
  ]));
}

// ---------- Actions de l'interface ----------

ipcMain.handle('get-state', () => state);
ipcMain.handle('new-pin', async () => {
  config.pin = randomPin();
  saveConfig();
  remote.setPin(config.pin);
  await refreshUrls();
});
ipcMain.handle('set-ip', async (_e, ip) => {
  state.ip = ip;
  config.ip = ip;
  saveConfig();
  await refreshUrls();
});
ipcMain.handle('set-autostart', (_e, on) => {
  app.setLoginItemSettings({ openAtLogin: !!on, args: ['--hidden'] });
  state.autostart = app.getLoginItemSettings({ args: ['--hidden'] }).openAtLogin;
  push();
});
ipcMain.handle('copy', (_e, text) => clipboard.writeText(String(text)));
ipcMain.handle('open-remote', () => shell.openExternal(`http://localhost:${state.port}/?pin=${state.pin}`));
ipcMain.handle('quit', quit);

app.on('before-quit', () => { quitting = true; });
app.on('window-all-closed', () => { /* reste dans la zone de notification */ });
