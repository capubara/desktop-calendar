const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');
const { spawn } = require('child_process');

let phpProcess = null;
let port = 0;

function copyDir(source, target, overwrite) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const src = path.join(source, entry.name);
    const dst = path.join(target, entry.name);
    if (entry.isDirectory()) copyDir(src, dst, overwrite);
    else if (overwrite || !fs.existsSync(dst)) fs.copyFileSync(src, dst);
  }
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const selectedPort = address && typeof address === 'object' ? address.port : 8080;
      server.close(() => resolve(selectedPort));
    });
  });
}

function waitForServer(selectedPort, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    function ping() {
      const request = http.get('http://127.0.0.1:' + selectedPort, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode >= 500) {
          if (Date.now() > deadline) {
            reject(new Error('The local app server returns HTTP ' + response.statusCode + '.'));
            return;
          }
          setTimeout(ping, 250);
          return;
        }
        resolve();
      });
      request.on('error', () => {
        if (phpProcess && phpProcess.exitCode !== null) {
          reject(new Error('PHP process exited before the app server became available.'));
          return;
        }
        if (Date.now() > deadline) {
          reject(new Error('The local app server did not start in time.'));
          return;
        }
        setTimeout(ping, 250);
      });
      request.setTimeout(1000, () => {
        request.destroy();
      });
    }
    ping();
  });
}

function phpPlatformName() {
  if (process.platform === 'win32') return 'win';
  if (process.platform === 'darwin') return 'mac';
  return 'linux';
}

function phpExecutableName() {
  return process.platform === 'win32' ? 'php.exe' : path.join('bin', 'php');
}

function locatePhp() {
  const platformDir = phpPlatformName();
  const executable = phpExecutableName();
  const candidates = [
    path.join(process.resourcesPath, 'php', platformDir, executable),
    path.join(__dirname, 'vendor', 'php', platformDir, executable),
    path.join(process.resourcesPath, 'php', executable),
    path.join(__dirname, 'vendor', 'php', executable)
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return { executable: candidate, root: path.dirname(candidate) };
    }
  }

  return { executable: 'php', root: null };
}

function phpEnvironment(phpRoot) {
  const env = { ...process.env };
  if (!phpRoot) return env;

  const runtimeRoot = phpRuntimeRoot(phpRoot);
  const separator = process.platform === 'win32' ? ';' : ':';
  env.PATH = [phpRoot, runtimeRoot, env.PATH].filter(Boolean).join(separator);

  if (process.platform === 'linux') {
    env.LD_LIBRARY_PATH = [runtimeRoot, path.join(runtimeRoot, 'lib'), env.LD_LIBRARY_PATH].filter(Boolean).join(':');
  }
  if (process.platform === 'darwin') {
    env.DYLD_LIBRARY_PATH = [runtimeRoot, path.join(runtimeRoot, 'lib'), env.DYLD_LIBRARY_PATH].filter(Boolean).join(':');
  }

  return env;
}

function phpRuntimeRoot(phpRoot) {
  return process.platform === 'win32' ? phpRoot : path.dirname(phpRoot);
}

function phpExtensionFile(extensionName) {
  if (process.platform === 'win32') return 'php_' + extensionName + '.dll';
  return extensionName + '.so';
}

function createPhpIni(phpRoot, logPath) {
  if (!phpRoot) return null;

  const runtimeRoot = phpRuntimeRoot(phpRoot);
  const extensionDir = path.join(runtimeRoot, 'ext');
  const iniPath = path.join(app.getPath('userData'), 'php-runtime.ini');
  const extensions = ['pdo_sqlite', 'sqlite3', 'mbstring', 'openssl', 'curl']
    .filter((extensionName) => fs.existsSync(path.join(extensionDir, phpExtensionFile(extensionName))));
  const escapeIniPath = (value) => value.replace(/\\/g, '\\\\');
  const lines = [
    'display_errors=1',
    'display_startup_errors=1',
    'log_errors=1',
    'error_log="' + escapeIniPath(logPath) + '"',
    'date.timezone=UTC'
  ];

  if (fs.existsSync(extensionDir)) {
    lines.push('extension_dir="' + escapeIniPath(extensionDir) + '"');
  }
  extensions.forEach((extensionName) => {
    lines.push('extension=' + extensionName);
  });

  fs.writeFileSync(iniPath, lines.join('\n') + '\n');
  return iniPath;
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
  copyDir(path.join(source, 'app'), path.join(target, 'app'), true);
  copyDir(path.join(source, 'public'), path.join(target, 'public'), true);
  copyDir(path.join(source, 'storage'), path.join(target, 'storage'), false);
  return target;
}

function startPhpServer() {
  const serverRoot = prepareServerFiles();
  const publicDir = path.join(serverRoot, 'public');
  const php = locatePhp();
  phpProcess = spawn(php.executable, ['-S', '127.0.0.1:' + port, '-t', publicDir], {
    cwd: serverRoot,
    env: phpEnvironment(php.root),
    windowsHide: true,
    stdio: 'ignore'
  });
  phpProcess.on('error', (error) => {
    dialog.showErrorBox('PHP runtime was not found', 'The app needs a bundled PHP runtime. Put PHP into desktop/vendor/php/' + phpPlatformName() + ' before building, or install php in the system PATH.\n\n' + error.message);
    return;
    dialog.showErrorBox('PHP не найден', 'Приложению нужен php.exe. Положите PHP в desktop/vendor/php/php.exe перед сборкой или установите PHP в систему.\n\n' + error.message);
  });
}

async function startPhpServerSafe() {
  port = await getFreePort();
  const serverRoot = prepareServerFiles();
  const publicDir = path.join(serverRoot, 'public');
  const php = locatePhp();
  const logPath = path.join(app.getPath('userData'), 'php-server.log');
  const phpIni = createPhpIni(php.root, logPath);
  const phpArgs = ['-S', '127.0.0.1:' + port, '-t', publicDir];
  if (phpIni) {
    phpArgs.unshift('-c', phpIni);
  }

  fs.writeFileSync(logPath, 'Starting PHP server\nPHP: ' + php.executable + '\nPHP ini: ' + (phpIni || 'system default') + '\nRoot: ' + serverRoot + '\nPort: ' + port + '\n\n');
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });

  phpProcess = spawn(php.executable, phpArgs, {
    cwd: serverRoot,
    env: phpEnvironment(php.root),
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  phpProcess.stdout.pipe(logStream);
  phpProcess.stderr.pipe(logStream);

  phpProcess.on('error', (error) => {
    fs.appendFileSync(logPath, '\nPHP spawn error: ' + error.message + '\n');
  });

  phpProcess.on('exit', (code, signal) => {
    fs.appendFileSync(logPath, '\nPHP process exited. Code: ' + code + '. Signal: ' + signal + '\n');
  });

  try {
    await waitForServer(port, 10000);
  } catch (error) {
    dialog.showErrorBox(
      'Fantasia Calendar could not start',
      'The local PHP server did not start. Log file:\n' + logPath + '\n\n' + error.message
    );
    throw error;
  }
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
  win.loadURL('http://127.0.0.1:' + port);
}

app.whenReady().then(async () => {
  await startPhpServerSafe();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
}).catch(() => {
  app.quit();
});

app.on('window-all-closed', () => {
  if (phpProcess) phpProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (phpProcess) phpProcess.kill();
});
