#!/usr/bin/env node
/*
Demo script for the Camera Lister Desktop Application
This script demonstrates the camera listing functionality
*/

const { spawn } = require('child_process');
const path = require('path');

console.log('🎥 Camera Lister Desktop Application Demo\n');

async function runDemo() {
  console.log('This demo will show you how the Camera Lister Desktop App works.\n');
  
  console.log('📋 Features:');
  console.log('  ✅ Modern, responsive UI with dark theme');
  console.log('  ✅ Real-time camera discovery');
  console.log('  ✅ Detailed camera information display');
  console.log('  ✅ Export and copy functionality');
  console.log('  ✅ Cross-platform support (Windows, macOS, Linux)');
  console.log('  ✅ Keyboard shortcuts and notifications');
  console.log('  ✅ Error handling with helpful messages\n');

  console.log('🚀 Starting the desktop application...\n');
  
  // Start the Electron app
  const appPath = path.join(__dirname, 'app', 'main.js');
  const child = spawn('electron', [appPath], {
    stdio: 'inherit',
    shell: true
  });

  child.on('close', (code) => {
    console.log(`\n🎉 Demo completed with exit code ${code}`);
    console.log('\nThank you for trying Camera Lister Desktop Application!');
  });

  child.on('error', (error) => {
    console.error('❌ Error starting application:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure you have run: npm install');
    console.log('2. Build the project: npm run build');
    console.log('3. Try running: npm run app');
  });
}

runDemo().catch(error => {
  console.error('Demo failed:', error);
  process.exit(1);
});
