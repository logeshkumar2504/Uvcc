#!/usr/bin/env node
/*
This file is part of uvcc -- USB Video Class (UVC) device configurator.
Copyright (C) 2018, 2019, 2020, 2021, 2022 Joel Purra <https://joelpurra.com/>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

import UvcControl from "uvc-control";
import UvcDeviceLister from "./src/uvc-device-lister.js";

/**
 * Interface representing a connected UVC camera device
 */
export interface CameraDevice {
  /** Human-readable device name */
  name: string;
  /** Vendor ID (decimal format) */
  vendor: number;
  /** Product ID (decimal format) */
  product: number;
  /** USB device address */
  address: number;
  /** Vendor ID in hexadecimal format (e.g., "0x46d") */
  vendorHex: string;
  /** Product ID in hexadecimal format (e.g., "0x82d") */
  productHex: string;
}

/**
 * Camera Lister Wrapper
 * 
 * A simplified wrapper around the uvcc library to list connected UVC cameras.
 * This wrapper provides an easy-to-use interface for discovering and listing
 * USB Video Class (UVC) compatible cameras on the system.
 * 
 * Features:
 * - List all connected UVC cameras
 * - Get detailed information about each camera
 * - Format vendor/product IDs in both decimal and hexadecimal
 * - Error handling for common issues
 */
export class CameraListerWrapper {
  private readonly uvcDeviceLister: UvcDeviceLister;

  constructor() {
    this.uvcDeviceLister = new UvcDeviceLister(UvcControl);
  }

  /**
   * Lists all connected UVC cameras on the system
   * 
   * @returns Promise<CameraDevice[]> Array of connected camera devices
   * @throws Error if unable to discover cameras or access USB devices
   * 
   * @example
   * ```typescript
   * const lister = new CameraListerWrapper();
   * try {
   *   const cameras = await lister.listCameras();
   *   console.log(`Found ${cameras.length} cameras:`);
   *   cameras.forEach(camera => {
   *     console.log(`- ${camera.name} (${camera.vendorHex}:${camera.productHex})`);
   *   });
   * } catch (error) {
   *   console.error('Failed to list cameras:', error.message);
   * }
   * ```
   */
  async listCameras(): Promise<CameraDevice[]> {
    try {
      const devices = await this.uvcDeviceLister.get();
      
      return devices.map(device => ({
        name: device.name,
        vendor: device.vendor,
        product: device.product,
        address: device.address,
        vendorHex: `0x${device.vendor.toString(16).padStart(4, '0')}`,
        productHex: `0x${device.product.toString(16).padStart(4, '0')}`,
      }));
    } catch (error) {
      // Provide more helpful error messages for common issues
      if (error instanceof Error) {
        if (error.message.includes('LIBUSB_ERROR_ACCESS')) {
          throw new Error(
            'Permission denied accessing USB devices. ' +
            'On Linux, you may need to run with sudo or configure udev rules. ' +
            'See USAGE.md for more information.'
          );
        }
        if (error.message.includes('LIBUSB_ERROR_NOT_FOUND')) {
          throw new Error(
            'No UVC-compatible cameras found. ' +
            'Make sure your camera is connected and supports USB Video Class (UVC).'
          );
        }
      }
      throw error;
    }
  }

  /**
   * Gets the number of connected UVC cameras
   * 
   * @returns Promise<number> Number of connected cameras
   * 
   * @example
   * ```typescript
   * const lister = new CameraListerWrapper();
   * const count = await lister.getCameraCount();
   * console.log(`Connected cameras: ${count}`);
   * ```
   */
  async getCameraCount(): Promise<number> {
    const cameras = await this.listCameras();
    return cameras.length;
  }

  /**
   * Finds a camera by vendor and product ID
   * 
   * @param vendor Vendor ID (decimal or hex string)
   * @param product Product ID (decimal or hex string)
   * @returns Promise<CameraDevice | null> The matching camera or null if not found
   * 
   * @example
   * ```typescript
   * const lister = new CameraListerWrapper();
   * // Find Logitech C920 (vendor: 0x46d/1133, product: 0x82d/2093)
   * const camera = await lister.findCamera(0x46d, 0x82d);
   * if (camera) {
   *   console.log(`Found camera: ${camera.name}`);
   * }
   * ```
   */
  async findCamera(vendor: number | string, product: number | string): Promise<CameraDevice | null> {
    const cameras = await this.listCameras();
    
    // Convert hex strings to numbers if needed
    const vendorNum = typeof vendor === 'string' 
      ? parseInt(vendor.replace('0x', ''), 16) 
      : vendor;
    const productNum = typeof product === 'string' 
      ? parseInt(product.replace('0x', ''), 16) 
      : product;
    
    return cameras.find(camera => 
      camera.vendor === vendorNum && camera.product === productNum
    ) || null;
  }

  /**
   * Lists cameras in a formatted string for display
   * 
   * @returns Promise<string> Formatted list of cameras
   * 
   * @example
   * ```typescript
   * const lister = new CameraListerWrapper();
   * const formattedList = await lister.getFormattedList();
   * console.log(formattedList);
   * ```
   */
  async getFormattedList(): Promise<string> {
    const cameras = await this.listCameras();
    
    if (cameras.length === 0) {
      return 'No UVC-compatible cameras found.';
    }
    
    const header = `Found ${cameras.length} UVC-compatible camera(s):\n`;
    const cameraList = cameras.map((camera, index) => 
      `${index + 1}. ${camera.name}\n   Vendor: ${camera.vendorHex} (${camera.vendor})\n   Product: ${camera.productHex} (${camera.product})\n   Address: ${camera.address}`
    ).join('\n\n');
    
    return header + cameraList;
  }
}

/**
 * Convenience function to quickly list all connected cameras
 * 
 * @returns Promise<CameraDevice[]> Array of connected camera devices
 * 
 * @example
 * ```typescript
 * import { listConnectedCameras } from './camera-lister-wrapper.js';
 * 
 * const cameras = await listConnectedCameras();
 * console.log(cameras);
 * ```
 */
export async function listConnectedCameras(): Promise<CameraDevice[]> {
  const lister = new CameraListerWrapper();
  return await lister.listCameras();
}

/**
 * Convenience function to get a formatted list of connected cameras
 * 
 * @returns Promise<string> Formatted list of cameras
 * 
 * @example
 * ```typescript
 * import { getFormattedCameraList } from './camera-lister-wrapper.js';
 * 
 * const formattedList = await getFormattedCameraList();
 * console.log(formattedList);
 * ```
 */
export async function getFormattedCameraList(): Promise<string> {
  const lister = new CameraListerWrapper();
  return await lister.getFormattedList();
}

// CLI interface when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const lister = new CameraListerWrapper();
  
  lister.getFormattedList()
    .then(formattedList => {
      console.log(formattedList);
    })
    .catch(error => {
      console.error('Error listing cameras:', error.message);
      process.exit(1);
    });
}
