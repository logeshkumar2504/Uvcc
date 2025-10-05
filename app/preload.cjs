/*
Camera Lister Desktop Application - Preload Script (CommonJS version)
Secure bridge between main and renderer processes
*/

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Camera listing functionality
  listCameras: () => ipcRenderer.invoke('list-cameras'),
  refreshCameras: () => ipcRenderer.invoke('refresh-cameras'),
  
  // App information
  // getAppInfo removed
  
  // Event listeners
  onCameraUpdate: (callback) => {
    ipcRenderer.on('camera-update', callback);
  },
  onMenuRefresh: (callback) => {
    ipcRenderer.on('menu-refresh', callback);
  },
  // onMenuShowInfo removed
  onMenuSelectCamera: (callback) => {
    ipcRenderer.on('menu-select-camera', (_event, camera) => callback(camera));
  },
  // Send merged camera list to main to rebuild native menu
  updateCameras: (cameras) => ipcRenderer.send('update-cameras', cameras),
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
