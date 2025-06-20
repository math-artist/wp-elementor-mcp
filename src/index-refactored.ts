#!/usr/bin/env node

// Load environment variables from .env file
import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of this script for .env file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

config({ path: envPath });

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import our modular components
import { WordPressClient } from './wordpress-client.js';
import { ToolHandlers } from './tool-handlers.js';
import { toolSchemas } from './tool-schemas.js';
import { getServerConfig, ServerConfig } from './server-config.js';

class ElementorWordPressMCP {
  private server: Server;
  private wordPressClient: WordPressClient;
  private toolHandlers: ToolHandlers;
  private serverConfig: ServerConfig;

  constructor() {
    this.serverConfig = getServerConfig();
    
    this.server = new Server({
      name: 'elementor-wordpress-mcp',
      version: '1.6.8',
    });

    // Initialize components
    this.wordPressClient = new WordPressClient();
    this.toolHandlers = new ToolHandlers(this.wordPressClient);

    this.setupToolHandlers();
    this.setupResourceHandlers();
  }

  private createErrorResponse(message: string, toolName: string, errorType: string, details: string) {
    return {
      content: [{
        type: 'text',
        text: `❌ **${errorType}** - ${toolName}\n\n${message}\n\n**Details:** ${details}`
      }],
      isError: true
    };
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: any[] = [];

      // Add temp file operations (always available)
      tools.push(
        toolSchemas.get_elementor_data_to_file,
        toolSchemas.get_page_structure_to_file,
        toolSchemas.backup_elementor_data_to_file
      );

      // Add original operations based on server config
      if (this.serverConfig.basicElementorOperations) {
        tools.push(
          toolSchemas.get_elementor_data,
          toolSchemas.get_page_structure,
          toolSchemas.backup_elementor_data
        );
      }

      // TODO: Add more tool schemas based on serverConfig flags

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Check authentication for all operations
        this.wordPressClient.ensureAuthenticated();
        
        return await this.toolHandlers.handleToolCall(name, args);
      } catch (error: any) {
        console.error(`❌ Tool execution failed for ${name}: ${error.message}`);
        return this.createErrorResponse(
          error.message,
          name,
          'TOOL_EXECUTION_ERROR',
          `Failed to execute ${name} with args: ${JSON.stringify(args)}`
        );
      }
    });
  }

  private setupResourceHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'wordpress://connection-status',
            mimeType: 'text/plain',
            name: 'WordPress Connection Status',
            description: 'Current status of the WordPress connection'
          },
          {
            uri: 'wordpress://server-config',
            mimeType: 'application/json', 
            name: 'Server Configuration',
            description: 'Current MCP server configuration and enabled features'
          }
        ]
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;

      if (uri === 'wordpress://connection-status') {
        try {
          this.wordPressClient.ensureAuthenticated();
          const config = this.wordPressClient.getConfig();
          return {
            contents: [{
              uri,
              mimeType: 'text/plain',
              text: `✅ Connected to: ${config.baseUrl}\n👤 User: ${config.username}\n🔧 MCP Server: ${this.server.name} v${this.server.version}`
            }]
          };
        } catch (error: any) {
          return {
            contents: [{
              uri,
              mimeType: 'text/plain',
              text: `❌ Not connected: ${error.message}`
            }]
          };
        }
      }

      if (uri === 'wordpress://server-config') {
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(this.serverConfig, null, 2)
          }]
        };
      }

      throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 Elementor WordPress MCP Server running (refactored version)');
  }
}

const server = new ElementorWordPressMCP();
server.run().catch(console.error);