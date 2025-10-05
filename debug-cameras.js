#!/usr/bin/env node
/*
Enhanced Camera Detection Debug Script
This script helps debug why some cameras might not be detected by uvcc
*/

const { spawn } = require('child_process');
const path = require('path');

console.log('🔍 Enhanced Camera Detection Debug\n');

async function debugCameras() {
  console.log('1. Testing uvcc device detection...\n');
  
  try {
    // Test the camera wrapper
    const wrapperPath = path.join(__dirname, 'dist', 'camera-lister-wrapper.js');
    console.log(`Running: node ${wrapperPath}`);
    
    const result = await runCommand('node', [wrapperPath]);
    console.log('Camera Wrapper Output:');
    console.log(result.output || '(no output)');
    if (result.error) {
      console.log('Error:', result.error);
    }
    console.log('\n');
    
  } catch (error) {
    console.error('Error running camera wrapper:', error.message);
  }

  console.log('2. Testing system camera detection...\n');
  
  // Try to get system camera information
  try {
    if (process.platform === 'win32') {
      console.log('Windows detected - checking USB devices...\n');
      
      // Try PowerShell to list USB devices
      const psResult = await runCommand('powershell', [
        'Get-WmiObject -Class Win32_PnPEntity | Where-Object {$_.Name -like "*camera*" -or $_.Name -like "*webcam*" -or $_.Name -like "*video*"} | Select-Object Name, DeviceID | Format-Table -AutoSize'
      ]);
      
      if (psResult.output) {
        console.log('Windows Camera Devices:');
        console.log(psResult.output);
      }
    }
  } catch (error) {
    console.log('Could not run system detection:', error.message);
  }

  console.log('3. Testing with elevated permissions...\n');
  console.log('Note: Some cameras might require elevated permissions to access.');
  console.log('Try running this script with administrator privileges.\n');
  
  console.log('4. UVC Compatibility Check...\n');
  console.log('The "USB2.0 PC CAMERA" might not be UVC-compatible.');
  console.log('UVC (USB Video Class) is a standard that not all cameras support.');
  console.log('Only UVC-compatible cameras will be detected by uvcc.\n');
  
  console.log('5. Troubleshooting Steps:\n');
  console.log('- Make sure both cameras are properly connected');
  console.log('- Check if other applications can see both cameras');
  console.log('- Try running with elevated permissions (Run as Administrator)');
  console.log('- Verify camera drivers are installed');
  console.log('- Check if cameras are being used by other applications\n');
}

function runCommand(command, args = []) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        code,
        output: output.trim(),
        error: error.trim()
      });
    });

    child.on('error', (err) => {
      resolve({
        code: -1,
        output: '',
        error: err.message
      });
    });
  });
}

// Run the debug
debugCameras().catch(error => {
  console.error('Debug failed:', error);
  process.exit(1);
});
