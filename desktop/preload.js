// Pont sécurisé entre l'interface et le processus principal.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('remote', {
  getState: () => ipcRenderer.invoke('get-state'),
  onState: (cb) => ipcRenderer.on('state', (_e, s) => cb(s)),
  newPin: () => ipcRenderer.invoke('new-pin'),
  setIp: (ip) => ipcRenderer.invoke('set-ip', ip),
  setAutostart: (on) => ipcRenderer.invoke('set-autostart', on),
  copy: (text) => ipcRenderer.invoke('copy', text),
  openRemote: () => ipcRenderer.invoke('open-remote'),
  quit: () => ipcRenderer.invoke('quit'),
});
