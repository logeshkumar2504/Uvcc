/*
Camera Lister Desktop Application - Preload Script
Secure bridge between main and renderer processes
*/

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Camera listing functionality
  listCameras: () => ipcRenderer.invoke('list-cameras'),
  refreshCameras: () => ipcRenderer.invoke('refresh-cameras'),
  
  // App information
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // Event listeners
  onCameraUpdate: (callback) => {
    ipcRenderer.on('camera-update', callback);
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
