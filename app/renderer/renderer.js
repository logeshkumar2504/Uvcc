/*
Camera Lister Desktop Application - Renderer Process
Handles UI interactions and camera data display
*/

class CameraListerApp {
  constructor() {
    this.cameras = [];
    this.isLoading = false;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadCameras();
  }

  setupEventListeners() {
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.loadCameras();
    });

    // Info button
    document.getElementById('infoBtn').addEventListener('click', () => {
      this.showInfoModal();
    });

    // Retry buttons
    document.getElementById('retryBtn').addEventListener('click', () => {
      this.loadCameras();
    });

    document.getElementById('emptyRetryBtn').addEventListener('click', () => {
      this.loadCameras();
    });

    // Modal controls
    document.getElementById('closeModalBtn').addEventListener('click', () => {
      this.hideInfoModal();
    });

    document.querySelector('.modal-overlay').addEventListener('click', () => {
      this.hideInfoModal();
    });

    // Export and copy buttons
    document.getElementById('exportBtn').addEventListener('click', () => {
      this.exportCameraData();
    });

    document.getElementById('copyBtn').addEventListener('click', () => {
      this.copyCameraData();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideInfoModal();
      } else if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        this.loadCameras();
      }
    });

    // Native menu hooks
    if (window.electronAPI && window.electronAPI.onMenuRefresh) {
      window.electronAPI.onMenuRefresh(() => this.loadCameras());
    }
    if (window.electronAPI && window.electronAPI.onMenuShowInfo) {
      window.electronAPI.onMenuShowInfo(() => this.showInfoModal());
    }
  }

  async loadCameras() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoadingState();

    try {
      const result = await window.electronAPI.listCameras();
      
      if (result.success) {
        this.cameras = result.cameras || [];
        // Merge with mediaDevices (browser API) to catch cameras visible to OS but not libusb
        await this.mergeWithMediaDevices();
        this.updateLastUpdated();
        
        if (this.cameras.length === 0) {
          this.showEmptyState();
        } else {
          this.showCameraList();
          this.renderCameras();
        }
        
        this.showToast('success', 'Cameras refreshed successfully');
      } else {
        throw new Error(result.error || 'Failed to load cameras');
      }
    } catch (error) {
      console.error('Error loading cameras:', error);
      this.showErrorState(error.message);
      this.showToast('error', 'Failed to load cameras');
    } finally {
      this.isLoading = false;
    }
  }

  async mergeWithMediaDevices() {
    try {
      // Ensure labels are available
      await this.ensureCameraPermission();
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      const existingNames = new Set(
        (this.cameras || []).map(c => (c.name || '').toLowerCase())
      );
      const existingIdPairs = new Set(
        (this.cameras || [])
          .filter(c => typeof c.vendor === 'number' && typeof c.product === 'number' && c.vendor !== 0 && c.product !== 0)
          .map(c => `${c.vendor.toString(16)}:${c.product.toString(16)}`)
      );
      for (const v of videoInputs) {
        const label = (v.label || 'Unknown Camera').trim();
        const key = label.toLowerCase();
        const parsed = this.extractVendorProductFromLabel(label);

        // Skip if name already exists
        if (existingNames.has(key)) {
          continue;
        }

        // Skip if vendor:product matches an existing UVC device
        if (parsed && existingIdPairs.has(parsed.pairKey)) {
          continue;
        }

        const vendor = parsed ? parsed.vendor : 0;
        const product = parsed ? parsed.product : 0;
        this.cameras.push({
          name: label,
          vendor,
          product,
          address: 0,
          vendorHex: `0x${vendor.toString(16).padStart(4, '0')}`,
          productHex: `0x${product.toString(16).padStart(4, '0')}`,
        });
        existingNames.add(key);
        if (parsed) existingIdPairs.add(parsed.pairKey);
      }
    } catch (err) {
      // Best-effort only; ignore errors
      console.warn('mediaDevices merge failed:', err);
    }
  }

  extractVendorProductFromLabel(label) {
    // Try to find patterns like "(1908:2311)", "[1908:2311]", or "1908:2311"
    const m = label.match(/(?:\(|\[|\b)([0-9a-fA-F]{3,4})\s*[:x]\s*([0-9a-fA-F]{3,4})(?:\)|\]|\b)/);
    if (!m) return null;
    const v = parseInt(m[1], 16);
    const p = parseInt(m[2], 16);
    if (Number.isNaN(v) || Number.isNaN(p)) return null;
    return { vendor: v, product: p, pairKey: `${v.toString(16)}:${p.toString(16)}` };
  }

  async ensureCameraPermission() {
    try {
      // Request minimal access to reveal device labels, then stop immediately
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach(t => t.stop());
    } catch (_) {
      // Ignore; labels might remain hidden
    }
  }

  showLoadingState() {
    this.hideAllStates();
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('loadingState').classList.add('fade-in');
  }

  showErrorState(message) {
    this.hideAllStates();
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('errorState').classList.add('fade-in');
  }

  showEmptyState() {
    this.hideAllStates();
    document.getElementById('emptyState').classList.remove('hidden');
    document.getElementById('emptyState').classList.add('fade-in');
  }

  showCameraList() {
    this.hideAllStates();
    document.getElementById('cameraList').classList.remove('hidden');
    document.getElementById('cameraList').classList.add('fade-in');
  }

  hideAllStates() {
    const states = ['loadingState', 'errorState', 'emptyState', 'cameraList'];
    states.forEach(stateId => {
      const element = document.getElementById(stateId);
      element.classList.add('hidden');
      element.classList.remove('fade-in');
    });
  }

  renderCameras() {
    const cameraGrid = document.getElementById('cameraGrid');
    const cameraCount = document.getElementById('cameraCount');
    
    // Update count
    cameraCount.textContent = `${this.cameras.length} Camera${this.cameras.length !== 1 ? 's' : ''} Found`;
    
    // Clear existing cameras
    cameraGrid.innerHTML = '';
    
    // Render each camera
    this.cameras.forEach((camera, index) => {
      const cameraCard = this.createCameraCard(camera, index);
      cameraGrid.appendChild(cameraCard);
    });
  }

  createCameraCard(camera, index) {
    const card = document.createElement('div');
    card.className = 'camera-card fade-in';
    card.style.animationDelay = `${index * 100}ms`;
    
    card.innerHTML = `
      <div class="camera-card-header">
        <div class="camera-icon">
          <i class="fas fa-video"></i>
        </div>
        <div class="camera-info">
          <h3>${this.escapeHtml(camera.name || 'Unknown Camera')}</h3>
          <p>UVC Compatible Camera</p>
        </div>
      </div>
      
      <div class="camera-details">
        <div class="camera-detail">
          <span class="camera-detail-label">Vendor ID</span>
          <span class="camera-detail-value">${camera.vendorHex || '0x0000'} (${camera.vendor || 0})</span>
        </div>
        <div class="camera-detail">
          <span class="camera-detail-label">Product ID</span>
          <span class="camera-detail-value">${camera.productHex || '0x0000'} (${camera.product || 0})</span>
        </div>
        <div class="camera-detail">
          <span class="camera-detail-label">Address</span>
          <span class="camera-detail-value">${camera.address || 0}</span>
        </div>
        <div class="camera-detail">
          <span class="camera-detail-label">Status</span>
          <span class="camera-detail-value">Connected</span>
        </div>
      </div>
      
      <div class="camera-status">
        <div class="camera-status-text">
          <div class="status-indicator"></div>
          <span>Camera is ready for use</span>
        </div>
      </div>
    `;
    
    return card;
  }

  async showInfoModal() {
    try {
      const appInfo = await window.electronAPI.getAppInfo();
      this.populateAppInfo(appInfo);
    } catch (error) {
      console.error('Error loading app info:', error);
    }
    
    document.getElementById('infoModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  hideInfoModal() {
    document.getElementById('infoModal').classList.add('hidden');
    document.body.style.overflow = '';
  }

  populateAppInfo(appInfo) {
    const appInfoGrid = document.getElementById('appInfo');
    appInfoGrid.innerHTML = `
      <div class="app-info-item">
        <span class="app-info-label">Application</span>
        <span class="app-info-value">${appInfo.name || 'Camera Lister'}</span>
      </div>
      <div class="app-info-item">
        <span class="app-info-label">Version</span>
        <span class="app-info-value">${appInfo.version || '1.0.0'}</span>
      </div>
      <div class="app-info-item">
        <span class="app-info-label">Platform</span>
        <span class="app-info-value">${appInfo.platform || 'Unknown'}</span>
      </div>
      <div class="app-info-item">
        <span class="app-info-label">Architecture</span>
        <span class="app-info-value">${appInfo.arch || 'Unknown'}</span>
      </div>
    `;
  }

  exportCameraData() {
    if (this.cameras.length === 0) {
      this.showToast('warning', 'No cameras to export');
      return;
    }

    const data = {
      timestamp: new Date().toISOString(),
      cameras: this.cameras,
      count: this.cameras.length
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `cameras-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showToast('success', 'Camera data exported successfully');
  }

  async copyCameraData() {
    if (this.cameras.length === 0) {
      this.showToast('warning', 'No cameras to copy');
      return;
    }

    const text = this.cameras.map((camera, index) => {
      return `${index + 1}. ${camera.name}
   Vendor: ${camera.vendorHex} (${camera.vendor})
   Product: ${camera.productHex} (${camera.product})
   Address: ${camera.address}`;
    }).join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      this.showToast('success', 'Camera data copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this.showToast('error', 'Failed to copy to clipboard');
    }
  }

  updateLastUpdated() {
    const lastUpdated = document.getElementById('lastUpdated');
    const now = new Date();
    lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;
  }

  showToast(type, message) {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMessage');
    
    // Set icon based on type
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle'
    };
    
    toastIcon.className = `toast-icon ${icons[type] || icons.info}`;
    toastMessage.textContent = message;
    
    // Remove existing classes and add new one
    toast.className = `toast ${type} fade-in`;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CameraListerApp();
});

// Handle window focus to refresh cameras
window.addEventListener('focus', () => {
  // Optional: Auto-refresh when window gains focus
  // app.loadCameras();
});
