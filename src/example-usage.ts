#!/usr/bin/env node
/*
This file demonstrates how to use the CameraListerWrapper to list connected UVC cameras.
*/

import {
	CameraListerWrapper,
	listConnectedCameras,
	getFormattedCameraList,
} from './camera-lister-wrapper.js';

async function demonstrateCameraListing() {
  console.log('=== UVC Camera Lister Wrapper Demo ===\n');

  // Method 1: Using the wrapper class directly
  console.log('1. Using CameraListerWrapper class:');
  const lister = new CameraListerWrapper();
  
  try {
    // Get camera count
    const count = await lister.getCameraCount();
    console.log(`   Connected cameras: ${count}\n`);

    // List all cameras with detailed info
    const cameras = await lister.listCameras();
    cameras.forEach((camera, index) => {
      console.log(`   Camera ${index + 1}:`);
      console.log(`     Name: ${camera.name}`);
      console.log(`     Vendor: ${camera.vendorHex} (${camera.vendor})`);
      console.log(`     Product: ${camera.productHex} (${camera.product})`);
      console.log(`     Address: ${camera.address}\n`);
    });

    // Find a specific camera (Logitech C920 example)
    console.log('2. Searching for Logitech C920 (vendor: 0x46d, product: 0x82d):');
    const logitechCamera = await lister.findCamera(0x46d, 0x82d);
    if (logitechCamera) {
      console.log(`   Found: ${logitechCamera.name}`);
    } else {
      console.log('   Logitech C920 not found');
    }
    console.log();

    // Get formatted list
    console.log('3. Formatted camera list:');
    const formattedList = await lister.getFormattedList();
    console.log(formattedList);

  } catch (error) {
    console.error('Error using wrapper class:', error instanceof Error ? error.message : String(error));
  }

  console.log('\n=== Using convenience functions ===\n');

  // Method 2: Using convenience functions
  try {
    console.log('4. Using convenience functions:');
    const cameras = await listConnectedCameras();
    console.log(`   Found ${cameras.length} cameras using listConnectedCameras()`);
    
    const formatted = await getFormattedCameraList();
    console.log('\n5. Formatted output from getFormattedCameraList():');
    console.log(formatted);

  } catch (error) {
    console.error('Error using convenience functions:', error instanceof Error ? error.message : String(error));
  }

  console.log('\n=== Demo completed ===');
}

// Run the demonstration
demonstrateCameraListing().catch(error => {
  console.error('Demo failed:', error);
  process.exit(1);
});
