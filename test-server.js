#!/usr/bin/env node

// Simple test script to verify the MCP server starts correctly
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing Elementor WordPress MCP Server...');

const serverPath = join(__dirname, 'dist', 'index.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let hasError = false;

server.stdout.on('data', (data) => {
  output += data.toString();
});

server.stderr.on('data', (data) => {
  const message = data.toString();
  output += message;
  
  if (message.includes('Elementor WordPress MCP server running on stdio')) {
    console.log('✅ Server started successfully!');
    console.log('✅ Server is ready to accept MCP connections');
    server.kill();
  }
});

server.on('error', (error) => {
  console.error('❌ Server failed to start:', error.message);
  hasError = true;
});

server.on('close', (code) => {
  if (!hasError) {
    if (output.includes('running on stdio') || code === 0) {
      console.log('✅ Server test completed successfully');
      console.log('\n📋 Next steps:');
      console.log('1. Set up your WordPress application password');
      console.log('2. Add the server to your MCP client configuration');
      console.log('3. Start using the server with: npm start');
    } else {
      console.log('⚠️  Server output:', output);
      console.log('❌ Server test failed');
    }
  }
});

// Kill server after 5 seconds if it doesn't exit
setTimeout(() => {
  if (!server.killed) {
    console.log('✅ Server is running (killing test process)');
    server.kill();
  }
}, 5000); 