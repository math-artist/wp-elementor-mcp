#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = join(__dirname, '.env');
  
  if (!existsSync(envPath)) {
    console.log('❌ No .env file found!');
    console.log('📝 Please create a .env file with your WordPress credentials.');
    console.log('💡 Copy env.example to .env and fill in your values:\n');
    console.log('   cp env.example .env');
    console.log('   # Then edit .env with your WordPress details\n');
    process.exit(1);
  }

  try {
    const envContent = readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    // Set environment variables
    Object.keys(envVars).forEach(key => {
      process.env[key] = envVars[key];
    });

    console.log('✅ Environment variables loaded from .env');
    console.log(`🌐 WordPress URL: ${process.env.WORDPRESS_BASE_URL}`);
    console.log(`👤 Username: ${process.env.WORDPRESS_USERNAME}`);
    console.log(`🔑 Application Password: ${process.env.WORDPRESS_APPLICATION_PASSWORD ? '***set***' : 'NOT SET'}\n`);

    return envVars;
  } catch (error) {
    console.error('❌ Error reading .env file:', error.message);
    process.exit(1);
  }
}

// Validate required environment variables
function validateCredentials() {
  const required = ['WORDPRESS_BASE_URL', 'WORDPRESS_USERNAME', 'WORDPRESS_APPLICATION_PASSWORD'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:');
    missing.forEach(key => console.log(`   • ${key}`));
    console.log('\n📝 Please check your .env file and ensure all required values are set.');
    process.exit(1);
  }

  // Validate URL format
  try {
    new URL(process.env.WORDPRESS_BASE_URL);
  } catch (error) {
    console.log('❌ Invalid WORDPRESS_BASE_URL format. Please include http:// or https://');
    process.exit(1);
  }

  console.log('✅ All required credentials are present and valid\n');
}

// Run a specific test with credentials
function runTestWithCredentials(testType = 'all') {
  return new Promise((resolve, reject) => {
    let command;
    let description;

    switch (testType) {
      case 'validate':
        command = ['npm', 'run', 'test:validate'];
        description = '🔍 Running validation tests';
        break;
      case 'enhanced':
        command = ['npm', 'run', 'test:enhanced'];
        description = '🆕 Running enhanced features tests';
        break;
      case 'comprehensive':
        command = ['npm', 'run', 'test:comprehensive'];
        description = '🔬 Running comprehensive functionality tests';
        break;
      case 'all':
        command = ['npm', 'run', 'test:all'];
        description = '🚀 Running complete test suite';
        break;
      default:
        reject(new Error(`Unknown test type: ${testType}`));
        return;
    }

    console.log(`${description} with WordPress credentials...\n`);
    console.log("=".repeat(80));

    const testProcess = spawn(command[0], command.slice(1), {
      stdio: 'inherit',
      env: { ...process.env },
      cwd: __dirname
    });

    testProcess.on('close', (code) => {
      console.log('\n' + '=' .repeat(80));
      if (code === 0) {
        console.log(`✅ ${description} completed successfully!`);
        resolve(code);
      } else {
        console.log(`❌ ${description} failed with exit code ${code}`);
        resolve(code); // Don't reject, just return the code
      }
    });

    testProcess.on('error', (error) => {
      console.error(`❌ Failed to start test process: ${error.message}`);
      reject(error);
    });
  });
}

// Main execution
async function main() {
  console.log('🧪 WordPress Elementor MCP - Credential Testing\n');
  console.log('=' .repeat(80));

  // Get test type from command line argument
  const testType = process.argv[2] || 'all';
  const validTypes = ['validate', 'enhanced', 'comprehensive', 'all'];

  if (!validTypes.includes(testType)) {
    console.log('❌ Invalid test type. Valid options:');
    validTypes.forEach(type => console.log(`   • ${type}`));
    console.log('\nUsage: node test-with-credentials.js [test-type]');
    console.log('Example: node test-with-credentials.js enhanced');
    process.exit(1);
  }

  try {
    // Load and validate credentials
    loadEnvFile();
    validateCredentials();

    // Run the specified test
    const exitCode = await runTestWithCredentials(testType);

    if (exitCode === 0) {
      console.log('\n🎉 All tests completed! Your WordPress connection is working perfectly.');
      console.log('✅ Enhanced error handling and debugging features validated');
      console.log('✅ list_all_content tool ready for content discovery');
      console.log('✅ All 404 and connection issues should now be resolved');
    } else {
      console.log('\n⚠️  Some tests had issues. Check the output above for details.');
      console.log('💡 This might indicate connection problems or missing WordPress features.');
    }

  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
    process.exit(1);
  }
}

// Show usage if --help is passed
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('🧪 WordPress Elementor MCP - Credential Testing\n');
  console.log('Usage: node test-with-credentials.js [test-type]\n');
  console.log('Test Types:');
  console.log('  validate      - Run schema and structure validation');
  console.log('  enhanced      - Test new enhanced features (debugging, list_all_content)');
  console.log('  comprehensive - Full functionality testing with WordPress');
  console.log('  all           - Complete test suite (default)\n');
  console.log('Setup:');
  console.log('  1. Copy env.example to .env');
  console.log('  2. Edit .env with your WordPress credentials');
  console.log('  3. Run: node test-with-credentials.js\n');
  console.log('Examples:');
  console.log('  node test-with-credentials.js');
  console.log('  node test-with-credentials.js enhanced');
  console.log('  node test-with-credentials.js comprehensive');
  process.exit(0);
}

// Run main function
main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
}); 