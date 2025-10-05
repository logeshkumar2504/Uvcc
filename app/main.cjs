/*
Camera Lister Desktop Application - Main Process (CommonJS version)
A modern desktop application to list connected UVC cameras
*/

const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, 'assets/icon.png'), // We'll create this later
    titleBarStyle: 'default',
    show: false, // Don't show until ready
    backgroundColor: '#1e1e1e'
  });

  // Load the app
  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus on the window
    if (process.platform === 'darwin') {
      app.dock.show();
    }
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'reload', label: 'Reload Window' },
        { type: 'separator' },
        { role: process.platform === 'darwin' ? 'close' : 'quit', label: process.platform === 'darwin' ? 'Close' : 'Quit' },
      ],
    },
    {
      label: 'Devices',
      submenu: [
        {
          label: 'Refresh Cameras',
          accelerator: 'F5',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-refresh');
            }
          },
        },
      ],
    },
    {
      label: 'Options',
      submenu: [
        { label: 'Settings (Coming soon)', enabled: false },
      ],
    },
    {
      label: 'Capture',
      submenu: [
        { label: 'Start Capture (Coming soon)', enabled: false },
      ],
    },
    {
      label: 'UVC Extension',
      submenu: [
        { label: 'Manage Extensions (Coming soon)', enabled: false },
      ],
    },
    {
      label: 'Recording',
      submenu: [
        { label: 'Start Recording (Coming soon)', enabled: false },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-show-info');
            }
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event listeners
app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for camera listing
ipcMain.handle('list-cameras', async () => {
  try {
    // Prefer importing the wrapper directly to get structured data
    const wrapperModulePath = path.join(__dirname, '../dist/camera-lister-wrapper.js');
    const moduleUrl = pathToFileURL(wrapperModulePath).href;
    const { listConnectedCameras } = await import(moduleUrl);
    const cameras = await listConnectedCameras();
    return {
      success: true,
      cameras,
      count: cameras.length,
    };
  } catch (esmError) {
    // Fallback: spawn as a subprocess and try to parse output gracefully
    try {
      return await new Promise((resolve, reject) => {
        const wrapperPath = path.join(__dirname, '../dist/camera-lister-wrapper.js');
        const child = spawn(process.execPath, [wrapperPath, '--json'], {
          cwd: path.join(__dirname, '..'),
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        let output = '';
        let errorOutput = '';

        child.stdout.on('data', (data) => {
          output += data.toString();
        });

        child.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        child.on('close', () => {
          // Try JSON first
          try {
            const maybe = output.trim();
            const cameras = maybe ? JSON.parse(maybe) : [];
            resolve({ success: true, cameras, count: cameras.length });
            return;
          } catch {}

          // If formatted text indicates none found
          if (output.includes('No UVC-compatible cameras found')) {
            resolve({ success: true, cameras: [], count: 0 });
            return;
          }

          reject(new Error('Camera listing failed: ' + (errorOutput || output)));
        });

        child.on('error', (error) => {
          reject(new Error('Failed to execute camera listing: ' + error.message));
        });
      });
    } catch (spawnError) {
      return { success: false, error: spawnError.message || esmError.message };
    }
  }
});

// Handle refresh request
ipcMain.handle('refresh-cameras', async () => {
  return await ipcMain.invoke('list-cameras');
});

// Handle app info request
ipcMain.handle('get-app-info', () => {
  return {
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch
  };
});
