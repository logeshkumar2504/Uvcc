# Camera Lister Wrapper

A simplified wrapper around the uvcc library to easily list connected UVC (USB Video Class) cameras on your system.

## What is uvcc?

**uvcc** is a USB Video Class (UVC) device configurator that allows you to:
- Fine-tune camera controls (brightness, contrast, saturation, gain, white balance, zoom, etc.)
- Export/import camera settings for automation
- List and configure UVC-compatible webcams and digital camcorders
- Work with popular cameras like Logitech C920, C922, Elgato Facecam, Microsoft LifeCam Studio

The uvcc library is particularly useful for:
- **Content creators** who need consistent camera settings across sessions
- **Developers** building camera applications
- **Streamers** who want to automate camera configurations
- **Anyone** working with UVC-compatible cameras who needs programmatic control

## Camera Lister Wrapper Features

This wrapper provides a simple interface to discover and list connected UVC cameras without needing to understand the full uvcc CLI interface.

### Features:
- ✅ List all connected UVC cameras
- ✅ Get detailed device information (name, vendor ID, product ID, address)
- ✅ Format vendor/product IDs in both decimal and hexadecimal
- ✅ Find specific cameras by vendor/product ID
- ✅ Get camera count
- ✅ Formatted output for easy reading
- ✅ Comprehensive error handling with helpful messages

## Installation

Make sure you have the uvcc dependencies installed:

```bash
npm install
```

## Usage

### Basic Usage

```typescript
import { CameraListerWrapper } from './camera-lister-wrapper.js';

const lister = new CameraListerWrapper();

// List all connected cameras
const cameras = await lister.listCameras();
console.log(`Found ${cameras.length} cameras:`);
cameras.forEach(camera => {
  console.log(`- ${camera.name} (${camera.vendorHex}:${camera.productHex})`);
});
```

### Convenience Functions

```typescript
import { listConnectedCameras, getFormattedCameraList } from './camera-lister-wrapper.js';

// Quick camera listing
const cameras = await listConnectedCameras();

// Get formatted output
const formattedList = await getFormattedCameraList();
console.log(formattedList);
```

### Find Specific Camera

```typescript
import { CameraListerWrapper } from './camera-lister-wrapper.js';

const lister = new CameraListerWrapper();

// Find Logitech C920 (vendor: 0x46d, product: 0x82d)
const logitechCamera = await lister.findCamera(0x46d, 0x82d);
if (logitechCamera) {
  console.log(`Found: ${logitechCamera.name}`);
} else {
  console.log('Camera not found');
}
```

### Command Line Usage

You can also run the wrapper directly from the command line:

```bash
# Run the wrapper directly
npx ts-node camera-lister-wrapper.ts

# Or run the example
npx ts-node example-usage.ts
```

## API Reference

### CameraDevice Interface

```typescript
interface CameraDevice {
  name: string;        // Human-readable device name
  vendor: number;      // Vendor ID (decimal format)
  product: number;     // Product ID (decimal format)
  address: number;     // USB device address
  vendorHex: string;   // Vendor ID in hex (e.g., "0x46d")
  productHex: string;  // Product ID in hex (e.g., "0x82d")
}
```

### CameraListerWrapper Class

#### `listCameras(): Promise<CameraDevice[]>`
Returns an array of all connected UVC cameras.

#### `getCameraCount(): Promise<number>`
Returns the number of connected cameras.

#### `findCamera(vendor: number | string, product: number | string): Promise<CameraDevice | null>`
Finds a specific camera by vendor and product ID. Returns null if not found.

#### `getFormattedList(): Promise<string>`
Returns a formatted string listing all cameras.

### Convenience Functions

#### `listConnectedCameras(): Promise<CameraDevice[]>`
Quick function to list all connected cameras.

#### `getFormattedCameraList(): Promise<string>`
Quick function to get formatted camera list.

## Example Output

```
Found 2 UVC-compatible camera(s):

1. HD Pro Webcam C920
   Vendor: 0x046d (1133)
   Product: 0x082d (2093)
   Address: 66

2. Elgato Facecam
   Vendor: 0x0fd9 (4057)
   Product: 0x0078 (120)
   Address: 5
```

## Error Handling

The wrapper provides helpful error messages for common issues:

- **Permission denied**: Suggests using sudo on Linux or configuring udev rules
- **No cameras found**: Explains that UVC-compatible cameras are required
- **USB access issues**: Provides guidance on system-specific solutions

## Supported Cameras

This wrapper works with any UVC-compatible camera. Popular supported models include:

- **Logitech**: C920 HD Pro Webcam, C922 Pro Stream Webcam
- **Elgato**: Facecam
- **Microsoft**: LifeCam Studio
- **Many others**: Any camera that supports USB Video Class (UVC)

## Troubleshooting

### Linux Permission Issues

If you get permission errors on Linux:

```bash
# Run with sudo to test
sudo npx ts-node camera-lister-wrapper.ts

# Or configure udev rules for permanent access
# See USAGE.md in the main uvcc directory for details
```

### No Cameras Found

1. Make sure your camera is connected via USB
2. Verify your camera supports UVC (USB Video Class)
3. Check if other applications can see the camera
4. Try running with elevated permissions

### Windows Issues

On Windows, you may need to:
- Install camera drivers
- Ensure the camera is not being used by another application
- Run as Administrator if needed

## Related Files

- `camera-lister-wrapper.ts` - Main wrapper implementation
- `example-usage.ts` - Usage examples and demonstrations
- `src/uvc-device-lister.ts` - Core device listing functionality
- `USAGE.md` - Detailed uvcc usage instructions

## License

This wrapper is part of the uvcc project and is released under the GNU General Public License version 3.0 (GPL-3.0).
