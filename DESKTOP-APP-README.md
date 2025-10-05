# Camera Lister Desktop Application

A modern, cross-platform desktop application built with Electron that provides a beautiful user interface for listing and discovering UVC (USB Video Class) cameras on your system.

## 🎯 Features

- **🎨 Modern UI**: Beautiful, responsive interface with dark theme
- **📱 Cross-Platform**: Works on Windows, macOS, and Linux
- **🔍 Real-time Discovery**: Automatically detects connected UVC cameras
- **📊 Detailed Information**: Shows vendor ID, product ID, device address, and more
- **📋 Export & Copy**: Export camera data to JSON or copy to clipboard
- **⌨️ Keyboard Shortcuts**: F5 to refresh, Escape to close modals
- **🔔 Notifications**: Toast notifications for user feedback
- **📱 Responsive Design**: Adapts to different screen sizes

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- UVC-compatible camera (optional, for testing)

### Installation & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Run the desktop application:**
   ```bash
   npm run app
   ```

### Alternative Commands

```bash
# Run in development mode with DevTools
npm run electron:dev

# Build distributable packages
npm run electron:dist
```

## 🖥️ User Interface

### Main Window

The application features a clean, modern interface with:

- **Header**: Application title, subtitle, and action buttons
- **Main Content**: Dynamic content area showing camera information
- **Footer**: App information and last updated timestamp

### States

The application handles different states gracefully:

1. **Loading State**: Shows spinner while discovering cameras
2. **Empty State**: Helpful message when no cameras are found
3. **Error State**: Clear error messages with retry options
4. **Camera List**: Beautiful grid of camera cards

### Camera Cards

Each camera is displayed as an attractive card showing:

- Camera name and type
- Vendor ID (hex and decimal)
- Product ID (hex and decimal)
- Device address
- Connection status with animated indicator

## 🎮 User Interactions

### Buttons & Actions

- **🔄 Refresh**: Manually refresh the camera list
- **ℹ️ Info**: Show application information and supported cameras
- **📥 Export**: Download camera data as JSON file
- **📋 Copy**: Copy camera information to clipboard

### Keyboard Shortcuts

- **F5** or **Ctrl+R**: Refresh camera list
- **Escape**: Close modal dialogs

### Modal Dialogs

- **Info Modal**: Application details, supported cameras, and system information
- **Responsive Design**: Adapts to different screen sizes

## 🎨 Design Features

### Visual Elements

- **Dark Theme**: Modern dark color scheme
- **Gradients**: Subtle gradients for depth and visual appeal
- **Animations**: Smooth transitions and hover effects
- **Icons**: Font Awesome icons for consistent UI
- **Typography**: Inter font family for modern look

### Responsive Layout

- **Desktop**: Multi-column camera grid
- **Tablet**: Single column layout with adjusted spacing
- **Mobile**: Compact layout with touch-friendly buttons

## 🔧 Technical Details

### Architecture

- **Main Process**: Electron main process handling camera discovery
- **Renderer Process**: Modern web UI with vanilla JavaScript
- **IPC Communication**: Secure communication between processes
- **Camera Wrapper**: Integration with the uvcc camera lister wrapper

### Technologies Used

- **Electron**: Cross-platform desktop app framework
- **HTML5/CSS3**: Modern web technologies
- **JavaScript (ES6+)**: Vanilla JavaScript with modern features
- **Font Awesome**: Icon library
- **Google Fonts**: Inter font family

### File Structure

```
app/
├── main.js              # Electron main process
├── preload.js           # Secure IPC bridge
├── renderer/            # UI files
│   ├── index.html       # Main HTML file
│   ├── styles.css       # CSS styles
│   └── renderer.js      # UI JavaScript
└── assets/              # App assets (icons, etc.)
```

## 🐛 Troubleshooting

### Common Issues

1. **No Cameras Found**
   - Ensure your camera is connected via USB
   - Verify camera supports UVC (USB Video Class)
   - Check if other applications can see the camera
   - Try running with elevated permissions

2. **Permission Errors (Linux)**
   ```bash
   # Run with sudo to test
   sudo npm run app
   
   # Or configure udev rules (see USAGE.md)
   ```

3. **Application Won't Start**
   - Ensure all dependencies are installed: `npm install`
   - Build the project: `npm run build`
   - Check Node.js version (requires v16+)

### Debug Mode

Run the application in development mode to see detailed logs:

```bash
npm run electron:dev
```

This will open DevTools for debugging.

## 📦 Building Distributables

### Create Installers

```bash
# Build for current platform
npm run electron:dist

# The built files will be in the 'release' directory
```

### Platform-Specific Builds

The application automatically builds for:
- **Windows**: NSIS installer (.exe)
- **macOS**: DMG package
- **Linux**: AppImage

## 🔗 Integration

### Camera Wrapper

The desktop app integrates with the camera lister wrapper (`src/camera-lister-wrapper.ts`) to provide:

- Camera discovery functionality
- Error handling with helpful messages
- Data formatting and presentation

### uvcc Library

Built on top of the uvcc library for:
- UVC camera detection
- Device enumeration
- Cross-platform USB access

## 🎯 Use Cases

### For End Users

- **Content Creators**: Quickly check available cameras
- **Streamers**: Verify camera connections before streaming
- **Developers**: Debug camera-related applications
- **System Administrators**: Monitor camera devices

### For Developers

- **Camera Application Development**: Test camera detection
- **USB Device Debugging**: Troubleshoot device connections
- **Cross-Platform Testing**: Verify camera support across platforms

## 🚀 Future Enhancements

Potential features for future versions:

- **Camera Control**: Adjust camera settings directly
- **Real-time Monitoring**: Live camera status updates
- **Configuration Profiles**: Save and load camera settings
- **Plugin System**: Extend functionality with plugins
- **Web Interface**: Browser-based version
- **Camera Preview**: Live camera feed preview

## 📄 License

This desktop application is part of the uvcc project and is released under the GNU General Public License version 3.0 (GPL-3.0).

## 🤝 Contributing

Contributions are welcome! Please see the main uvcc project for contribution guidelines.

---

**Camera Lister Desktop Application** - Making camera discovery beautiful and accessible! 🎥✨
