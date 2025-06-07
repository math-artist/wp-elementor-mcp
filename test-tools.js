#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function testTools() {
  console.log('🔧 Testing all Elementor MCP tools...\n');
  
  try {
    // Start the server
    const serverProcess = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'inherit']
    });

    const transport = new StdioClientTransport({
      command: 'node',
      args: ['dist/index.js']
    });

    const client = new Client({
      name: 'test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    await client.connect(transport);

    // List all available tools
    const { tools } = await client.listTools();
    
    console.log(`📝 Found ${tools.length} tools:`);
    console.log('=' .repeat(80));
    
    // Group tools by category
    const categories = {
      'WordPress Core': [],
      'Section & Container Creation': [],
      'Widget Addition': [],
      'Element Management': [],
      'Template Management': [],
      'Global Settings': [],
      'Page Structure': [],
      'Performance & Optimization': [],
      'Advanced Element Operations': [],
      'Custom Fields Integration': [],
      'Revision and History': [],
      'Elementor Core': []
    };

    tools.forEach(tool => {
      if (tool.name.includes('section') || tool.name.includes('container') || tool.name.includes('column') || tool.name === 'duplicate_section') {
        categories['Section & Container Creation'].push(tool);
      } else if (tool.name.includes('widget') && (tool.name.includes('add') || tool.name.includes('insert') || tool.name.includes('clone') || tool.name.includes('move'))) {
        categories['Widget Addition'].push(tool);
      } else if (tool.name.includes('delete') || tool.name.includes('reorder') || tool.name.includes('copy_element')) {
        categories['Element Management'].push(tool);
      } else if (tool.name.includes('template')) {
        categories['Template Management'].push(tool);
      } else if (tool.name.includes('global')) {
        categories['Global Settings'].push(tool);
      } else if (tool.name.includes('structure') || tool.name.includes('validate')) {
        categories['Page Structure'].push(tool);
      } else if (tool.name.includes('cache') || tool.name.includes('regenerate') || tool.name.includes('optimize')) {
        categories['Performance & Optimization'].push(tool);
      } else if (tool.name.includes('find') || tool.name.includes('bulk') || tool.name.includes('replace')) {
        categories['Advanced Element Operations'].push(tool);
      } else if (tool.name.includes('custom') || tool.name.includes('dynamic')) {
        categories['Custom Fields Integration'].push(tool);
      } else if (tool.name.includes('revision')) {
        categories['Revision and History'].push(tool);
      } else if (tool.name.includes('elementor') || tool.name.includes('backup')) {
        categories['Elementor Core'].push(tool);
      } else {
        categories['WordPress Core'].push(tool);
      }
    });

    // Display tools by category
    for (const [categoryName, categoryTools] of Object.entries(categories)) {
      if (categoryTools.length > 0) {
        console.log(`\n🏷️  ${categoryName} (${categoryTools.length} tools):`);
        console.log('-'.repeat(40));
        categoryTools.forEach(tool => {
          console.log(`  ✓ ${tool.name}`);
          console.log(`    └─ ${tool.description}`);
        });
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total tools: ${tools.length}`);
    Object.entries(categories).forEach(([name, tools]) => {
      if (tools.length > 0) {
        console.log(`   ${name}: ${tools.length}`);
      }
    });

    await client.close();
    console.log('\n✅ Tool listing completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing tools:', error.message);
    process.exit(1);
  }
}

testTools(); 