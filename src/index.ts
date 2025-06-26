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
  private serverInfo = {
    name: 'elementor-wordpress-mcp',
    version: '1.7.1'
  };

  constructor() {
    this.serverConfig = getServerConfig();
    
    this.server = new Server(this.serverInfo);

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

      // Add basic WordPress operations
      tools.push(
        toolSchemas.get_page
      );

      // Add smart Elementor operations (replacing old tools)
      tools.push(
        toolSchemas.get_elementor_data_smart,
        toolSchemas.get_elementor_structure_summary
      );

      // Add original operations based on server config
      if (this.serverConfig.basicElementorOperations) {
        tools.push(
          toolSchemas.get_elementor_data,
          toolSchemas.backup_elementor_data
        );
      }

      // WordPress Basic Operations
      if (this.serverConfig.basicWordPressOperations) {
        tools.push(
          toolSchemas.get_posts,
          toolSchemas.get_post,
          toolSchemas.create_post,
          toolSchemas.update_post,
          toolSchemas.get_pages,
          toolSchemas.list_all_content,
          toolSchemas.create_page,
          toolSchemas.update_page,
          toolSchemas.get_media,
          toolSchemas.upload_media
        );
      }

      // Extended Elementor Operations
      if (this.serverConfig.basicElementorOperations) {
        tools.push(
          toolSchemas.get_elementor_templates,
          toolSchemas.update_elementor_data,
          toolSchemas.update_elementor_widget,
          toolSchemas.get_elementor_widget,
          toolSchemas.get_elementor_elements,
          toolSchemas.update_elementor_section
        );
      }

      // Section and Container Creation
      if (this.serverConfig.sectionContainerCreation) {
        tools.push(
          toolSchemas.create_elementor_section,
          toolSchemas.create_elementor_container,
          toolSchemas.add_column_to_section,
          toolSchemas.duplicate_section
        );
      }

      // Widget Addition Tools
      if (this.serverConfig.widgetAddition) {
        tools.push(
          toolSchemas.add_widget_to_section,
          toolSchemas.insert_widget_at_position,
          toolSchemas.clone_widget,
          toolSchemas.move_widget
        );
      }

      // Element Management Tools
      if (this.serverConfig.elementManagement) {
        tools.push(
          toolSchemas.delete_elementor_element,
          toolSchemas.reorder_elements,
          toolSchemas.copy_element_settings
        );
      }

      // Page Structure Tools
      if (this.serverConfig.pageStructure) {
        tools.push(
          toolSchemas.get_page_structure,
          toolSchemas.rebuild_page_structure,
          toolSchemas.validate_elementor_data
        );
      }

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Check authentication for all operations
        this.wordPressClient.ensureAuthenticated();
        
        // Delegate to ToolHandlers centralized routing
        return await this.toolHandlers.handleToolCall(name, args);
      } catch (error: any) {
        console.error(`❌ Tool execution failed for ${name}: ${error.message}`);
        
        if (error.code) {
          // Handle MCP errors
          return this.createErrorResponse(
            error.message || 'MCP operation failed',
            'MCP_ERROR',
            'PROTOCOL_ERROR',
            `MCP Error Code: ${error.code}`
          );
        }
        
        return this.createErrorResponse(
          error.message || 'Tool execution failed',
          'TOOL_EXECUTION_ERROR', 
          'INTERNAL_ERROR',
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
              text: `✅ Connected to: ${config.baseUrl}\n👤 User: ${config.username}\n🔧 MCP Server: ${this.serverInfo.name} v${this.serverInfo.version}`
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