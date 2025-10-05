#!/usr/bin/env node
/*
Simple test script for the camera lister wrapper
*/

import { CameraListerWrapper, listConnectedCameras, getFormattedCameraList } from './camera-lister-wrapper.js';

async function testWrapper() {
  console.log('Testing Camera Lister Wrapper...\n');

  try {
    // Test 1: Basic functionality
    console.log('Test 1: Basic camera listing');
    const cameras = await listConnectedCameras();
    console.log(`✓ Found ${cameras.length} cameras`);
    
    if (cameras.length > 0 && cameras[0]) {
      const camera = cameras[0];
      console.log(`✓ First camera: ${camera.name}`);
      console.log(`✓ Vendor ID: ${camera.vendorHex} (${camera.vendor})`);
      console.log(`✓ Product ID: ${camera.productHex} (${camera.product})`);
    }

    // Test 2: Wrapper class functionality
    console.log('\nTest 2: Wrapper class methods');
    const lister = new CameraListerWrapper();
    const count = await lister.getCameraCount();
    console.log(`✓ Camera count: ${count}`);
    
    // Test 3: Formatted output
    console.log('\nTest 3: Formatted output');
    const formatted = await getFormattedCameraList();
    console.log('✓ Formatted output generated');
    console.log('Sample output:');
    console.log(formatted.substring(0, 200) + (formatted.length > 200 ? '...' : ''));

    // Test 4: Find specific camera (will likely return null)
    console.log('\nTest 4: Find specific camera');
    const found = await lister.findCamera(0x46d, 0x82d);
    if (found) {
      console.log(`✓ Found Logitech C920: ${found.name}`);
    } else {
      console.log('✓ Logitech C920 not found (expected)');
    }

    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

testWrapper();
