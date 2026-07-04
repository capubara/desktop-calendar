const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const { spawn } = require('child_process');

let phpProcess = null;
const port = 8080;

function copyDir(source, target) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const src = path.join(source, entry.name);
    const dst = path.join(target, entry.name);
    if (entry.isDirectory()) copyDir(src, dst);
    else if (!fs.existsSync(dst)) fs.copyFileSync(src, dst);
  }
}

function locatePhp() {
  const packagedPhp = path.join(process.resourcesPath, 'php', 'php.exe');
  const devPhp = path.join(__dirname, 'vendor', 'php', 'php.exe');
  if (fs.existsSync(packagedPhp)) return packagedPhp;
  if (fs.existsSync(devPhp)) return devPhp;
  return 'php';
}

function locateAppIcon() {
  const packagedIcon = path.join(process.resourcesPath, 'server', 'public', 'assets', 'icons', 'check.png');
  const devIcon = path.resolve(__dirname, '..', 'public', 'assets', 'icons', 'check.png');
  if (fs.existsSync(packagedIcon)) return packagedIcon;
  if (fs.existsSync(devIcon)) return devIcon;
  return undefined;
}

function prepareServerFiles() {
  if (!app.isPackaged) return path.resolve(__dirname, '..');
  const source = path.join(process.resourcesPath, 'server');
  const target = path.join(app.getPath('userData'), 'server');
  copyDir(path.join(source, 'app'), path.join(target, 'app'));
  copyDir(path.join(source, 'public'), path.join(target, 'public'));
  copyDir(path.join(source, 'storage'), path.join(target, 'storage'));
  return target;
}

function startPhpServer() {
  const serverRoot = prepareServerFiles();
  const publicDir = path.join(serverRoot, 'public');
  const php = locatePhp();
  phpProcess = spawn(php, ['-S', '127.0.0.1:' + port, '-t', publicDir], {
    cwd: serverRoot,
    windowsHide: true,
    stdio: 'ignore'
  });
  phpProcess.on('error', (error) => {
    dialog.showErrorBox('PHP не найден', 'Приложению нужен php.exe. Положите PHP в desktop/vendor/php/php.exe перед сборкой или установите PHP в систему.\n\n' + error.message);
  });
}

function createWindow() {
  Menu.setApplicationMenu(null);
  const win = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 390,
    minHeight: 680,
    backgroundColor: '#f7f5f0',
    title: 'Fantasia Calendar',
    icon: locateAppIcon(),
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  });
  setTimeout(() => win.loadURL('http://127.0.0.1:' + port), 700);
}

app.whenReady().then(() => {
  startPhpServer();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  if (phpProcess) phpProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (phpProcess) phpProcess.kill();
});
