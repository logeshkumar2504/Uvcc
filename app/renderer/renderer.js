/*
Camera Lister Desktop Application - Renderer Process
Handles UI interactions and camera data display
*/

class CameraListerApp {
  constructor() {
    this.cameras = [];
    this.isLoading = false;
    this.currentStream = null;
    this.fpsRafId = null;
    this.fpsLastTime = 0;
    this.fpsFrames = 0;
    this.measuredFps = 0;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadCameras();
  }

  setupEventListeners() {
    // No in-page buttons remain

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        this.loadCameras();
      }
    });

    // Native menu hooks
    if (window.electronAPI && window.electronAPI.onMenuRefresh) {
      window.electronAPI.onMenuRefresh(() => this.loadCameras());
    }
    // Menu About removed
    if (window.electronAPI && window.electronAPI.onMenuSelectCamera) {
      window.electronAPI.onMenuSelectCamera((camera) => {
        this.startStreamForCamera(camera).catch((err) => {
          console.error('Failed to start stream:', err);
        });
      });
    }
  }

  async loadCameras() {
    if (this.isLoading) return;

    this.isLoading = true;
    // headless: no loading state

    try {
      const result = await window.electronAPI.listCameras();
      
      if (result.success) {
        this.cameras = result.cameras || [];
        // Merge with mediaDevices (browser API) to catch cameras visible to OS but not libusb
        await this.mergeWithMediaDevices();
        // Notify main to update native Devices menu with merged list
        if (window.electronAPI && window.electronAPI.updateCameras) {
          window.electronAPI.updateCameras(this.cameras);
        }
        // headless: no DOM updates
      } else {
        throw new Error(result.error || 'Failed to load cameras');
      }
    } catch (error) {
      console.error('Error loading cameras:', error);
      // headless: no error UI
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
      const existingIdPairs = new Set(
        (this.cameras || [])
          .filter(c => typeof c.vendor === 'number' && typeof c.product === 'number' && c.vendor !== 0 && c.product !== 0)
          .map(c => `${c.vendor.toString(16)}:${c.product.toString(16)}`)
      );
      for (const v of videoInputs) {
        const label = (v.label || 'Unknown Camera').trim();
        const parsed = this.extractVendorProductFromLabel(label);

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
          deviceId: v.deviceId || '',
          groupId: v.groupId || ''
        });
        if (parsed) existingIdPairs.add(parsed.pairKey);
      }
    } catch (err) {
      // Best-effort only; ignore errors
      console.warn('mediaDevices merge failed:', err);
    }
  }

  async startStreamForCamera(camera) {
    try {
      // Stop previous stream
      if (this.currentStream) {
        try { this.currentStream.getTracks().forEach(t => t.stop()); } catch {}
        this.currentStream = null;
      }

      // Resolve deviceId
      let targetDeviceId = camera && camera.deviceId ? camera.deviceId : '';
      if (!targetDeviceId) {
        try {
          await this.ensureCameraPermission();
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter(d => d.kind === 'videoinput');
          const name = (camera && camera.name ? String(camera.name) : '').toLowerCase();
          const match = videoInputs.find(v => (v.label || '').toLowerCase().includes(name));
          if (match) targetDeviceId = match.deviceId;
        } catch {}
      }

      const constraints = targetDeviceId
        ? { video: { deviceId: { exact: targetDeviceId } }, audio: false }
        : { video: true, audio: false };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.currentStream = stream;
      this.renderVideo(stream);
    } catch (err) {
      // Try fallback without exact constraint
      if (targetDeviceId) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        this.currentStream = stream;
        this.renderVideo(stream);
        return;
      }
      throw err;
    }
  }

  renderVideo(stream) {
    // Ensure body fills the window and is dark
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.body.style.margin = '0';
    document.body.style.backgroundColor = '#0b0f1a';
    document.body.style.overflow = 'hidden';

    let video = document.getElementById('cameraVideo');
    if (!video) {
      video = document.createElement('video');
      video.id = 'cameraVideo';
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true; // avoid feedback on devices exposing audio
      video.style.position = 'fixed';
      video.style.top = '0';
      video.style.left = '0';
      video.style.width = '100vw';
      video.style.height = '100vh';
      video.style.objectFit = 'cover';
      video.style.backgroundColor = '#000';
      video.style.outline = 'none';
      document.body.innerHTML = '';
      document.body.appendChild(video);
      // Create bottom info bar
      const bar = document.createElement('div');
      bar.id = 'bottomInfoBar';
      bar.style.position = 'fixed';
      bar.style.left = '0';
      bar.style.right = '0';
      bar.style.bottom = '0';
      bar.style.height = '40px';
      bar.style.display = 'flex';
      bar.style.alignItems = 'center';
      bar.style.padding = '0 12px';
      bar.style.background = 'linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.55))';
      bar.style.color = '#e5e7eb';
      bar.style.fontFamily = "Inter, -apple-system, 'Segoe UI', Roboto, sans-serif";
      bar.style.fontSize = '12px';
      bar.style.userSelect = 'none';
      const text = document.createElement('span');
      text.id = 'bottomInfoText';
      bar.appendChild(text);
      document.body.appendChild(bar);
    }
    video.srcObject = stream;
    // Update info bar and FPS monitoring
    this.updateBottomBar();
    this.startFpsMonitor();
  }

  updateBottomBar() {
    const video = document.getElementById('cameraVideo');
    const text = document.getElementById('bottomInfoText');
    if (!video || !text) return;
    const track = this.currentStream ? this.currentStream.getVideoTracks()[0] : null;
    const settings = track && track.getSettings ? track.getSettings() : {};
    const width = video.videoWidth || settings.width || 0;
    const height = video.videoHeight || settings.height || 0;
    const fps = this.measuredFps || settings.frameRate || 0;
    const formattedFps = fps ? `${Math.round(fps)} fps` : '';
    const resolution = width && height ? `${width}×${height}` : 'Unknown';
    text.textContent = `${resolution}${formattedFps ? ' @ ' + formattedFps : ''}`;
  }

  startFpsMonitor() {
    if (this.fpsRafId) cancelAnimationFrame(this.fpsRafId);
    this.fpsLastTime = performance.now();
    this.fpsFrames = 0;

    const step = (now) => {
      this.fpsFrames += 1;
      const dt = now - this.fpsLastTime;
      if (dt >= 1000) {
        this.measuredFps = (this.fpsFrames * 1000) / dt;
        this.fpsFrames = 0;
        this.fpsLastTime = now;
        this.updateBottomBar();
      }
      this.fpsRafId = requestAnimationFrame(step);
    };
    this.fpsRafId = requestAnimationFrame(step);
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

  // All UI rendering removed

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

  // Info modal removed

  // Export/Copy functionality removed

  // Footer timestamp removed

  // Toasts removed

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
