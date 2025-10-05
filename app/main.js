/*
Camera Lister Desktop Application - Main Process
A modern desktop application to list connected UVC cameras
*/

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      preload: path.join(__dirname, 'preload.js')
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

// App event listeners
app.whenReady().then(() => {
  createWindow();

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
    // Use the compiled TypeScript wrapper
    
    return new Promise((resolve, reject) => {
      const wrapperPath = path.join(__dirname, '../../dist/camera-lister-wrapper.js');
      const child = spawn('node', [wrapperPath], {
        cwd: path.join(__dirname, '../..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          try {
            // Parse the JSON output from the wrapper
            const cameras = output.trim() ? JSON.parse(output.trim()) : [];
            resolve({
              success: true,
              cameras: cameras,
              count: cameras.length
            });
          } catch (parseError) {
            // If no JSON output, try to parse as formatted text
            if (output.includes('No UVC-compatible cameras found')) {
              resolve({
                success: true,
                cameras: [],
                count: 0
              });
            } else {
              reject(new Error('Failed to parse camera data: ' + parseError.message));
            }
          }
        } else {
          reject(new Error('Camera listing failed: ' + errorOutput));
        }
      });

      child.on('error', (error) => {
        reject(new Error('Failed to execute camera listing: ' + error.message));
      });
    });
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
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
