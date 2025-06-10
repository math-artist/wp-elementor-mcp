#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { Base64 } from 'js-base64';
import { getServerConfig, ServerConfig } from './server-config.js';

interface WordPressConfig {
  baseUrl: string;
  username: string;
  applicationPassword: string;
}

class ElementorWordPressMCP {
  private server: Server;
  private axiosInstance: AxiosInstance | null = null;
  private config: WordPressConfig | null = null;
  private serverConfig: ServerConfig;

  constructor() {
    this.serverConfig = getServerConfig();
    
    this.server = new Server(
      {
        name: 'elementor-wordpress-mcp',
        version: '1.0.0',
      }
    );

    // Initialize WordPress configuration from environment variables
    this.initializeFromEnvironment();

    this.setupToolHandlers();
    this.setupResourceHandlers();
  }

  private initializeFromEnvironment() {
    const baseUrl = process.env.WORDPRESS_BASE_URL;
    const username = process.env.WORDPRESS_USERNAME;
    const applicationPassword = process.env.WORDPRESS_APPLICATION_PASSWORD;

    if (baseUrl && username && applicationPassword) {
      console.error('Initializing WordPress connection from environment variables...');
      this.setupAxios({
        baseUrl: baseUrl.replace(/\/$/, ''), // Remove trailing slash if present
        username,
        applicationPassword
      });
      console.error('WordPress connection configured successfully');
    } else {
      console.error('WordPress environment variables not found. Manual configuration will be required.');
      console.error('Required environment variables:');
      console.error('- WORDPRESS_BASE_URL');
      console.error('- WORDPRESS_USERNAME');
      console.error('- WORDPRESS_APPLICATION_PASSWORD');
    }
  }

  private setupAxios(config: WordPressConfig) {
    const auth = Base64.encode(`${config.username}:${config.applicationPassword}`);
    const baseURL = `${config.baseUrl}/wp-json/wp/v2/`;
    
    console.error(`Setting up WordPress connection to: ${baseURL}`);
    console.error(`Username: ${config.username}`);
    
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });
    
    // Add request interceptor for debugging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.error(`Making request to: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error(`Request error: ${error.message}`);
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor for debugging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.error(`Response received: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        console.error(`Response error: ${error.response?.status} ${error.response?.statusText}`);
        console.error(`Error details: ${error.response?.data?.message || error.message}`);
        return Promise.reject(error);
      }
    );
    
    this.config = config;
  }

  private ensureAuthenticated() {
    if (!this.axiosInstance || !this.config) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'WordPress connection not configured. Please set environment variables (WORDPRESS_BASE_URL, WORDPRESS_USERNAME, WORDPRESS_APPLICATION_PASSWORD) or use the configure_wordpress tool.'
      );
    }
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: any[] = [];
      
      // Always include configuration tool
      tools.push({
        name: 'configure_wordpress',
        description: 'Configure WordPress connection with base URL and application password (only needed if environment variables are not set)',
        inputSchema: {
          type: 'object',
          properties: {
            baseUrl: {
              type: 'string',
              description: 'WordPress site base URL (e.g., https://yoursite.com)',
            },
            username: {
              type: 'string',
              description: 'WordPress username',
            },
            applicationPassword: {
              type: 'string',
              description: 'WordPress application password (not regular password)',
            },
          },
          required: ['baseUrl', 'username', 'applicationPassword'],
        },
      });

      // Add tools based on configuration
      if (this.serverConfig.basicWordPressOperations) {
        tools.push(
          {
            name: 'get_posts',
            description: 'Retrieve WordPress posts with optional filtering',
            inputSchema: {
              type: 'object',
              properties: {
                per_page: {
                  type: 'number',
                  description: 'Number of posts to retrieve (default: 10)',
                  default: 10,
                },
                status: {
                  type: 'string',
                  description: 'Post status (publish, draft, private, etc.)',
                  default: 'publish',
                },
                search: {
                  type: 'string',
                  description: 'Search term to filter posts',
                },
              },
            },
          },
          {
            name: 'get_post',
            description: 'Get a specific WordPress post by ID',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Post ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'create_post',
            description: 'Create a new WordPress post',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Post title',
                },
                content: {
                  type: 'string',
                  description: 'Post content (HTML)',
                },
                status: {
                  type: 'string',
                  description: 'Post status (draft, publish, private)',
                  default: 'draft',
                },
                excerpt: {
                  type: 'string',
                  description: 'Post excerpt',
                },
              },
              required: ['title', 'content'],
            },
          },
          {
            name: 'update_post',
            description: 'Update an existing WordPress post',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Post ID to update',
                },
                title: {
                  type: 'string',
                  description: 'Post title',
                },
                content: {
                  type: 'string',
                  description: 'Post content (HTML)',
                },
                status: {
                  type: 'string',
                  description: 'Post status (draft, publish, private)',
                },
                excerpt: {
                  type: 'string',
                  description: 'Post excerpt',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'get_pages',
            description: 'Retrieve WordPress pages',
            inputSchema: {
              type: 'object',
              properties: {
                per_page: {
                  type: 'number',
                  description: 'Number of pages to retrieve (default: 10)',
                  default: 10,
                },
                status: {
                  type: 'string',
                  description: 'Page status (publish, draft, private, etc.)',
                  default: 'publish',
                },
              },
            },
          },
          {
            name: 'list_all_content',
            description: 'List all posts and pages with their IDs and Elementor status for debugging',
            inputSchema: {
              type: 'object',
              properties: {
                per_page: {
                  type: 'number',
                  description: 'Number of items to retrieve per type (default: 50)',
                  default: 50,
                },
                include_all_statuses: {
                  type: 'boolean',
                  description: 'Include draft, private, and trashed content (default: false)',
                  default: false,
                },
              },
            },
          },
          {
            name: 'create_page',
            description: 'Create a new WordPress page',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Page title',
                },
                content: {
                  type: 'string',
                  description: 'Page content (HTML)',
                },
                status: {
                  type: 'string',
                  description: 'Page status (draft, publish, private)',
                  default: 'draft',
                },
                excerpt: {
                  type: 'string',
                  description: 'Page excerpt',
                },
                parent: {
                  type: 'number',
                  description: 'Parent page ID (for creating child pages)',
                },
              },
              required: ['title', 'content'],
            },
          },
          {
            name: 'update_page',
            description: 'Update an existing WordPress page',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Page ID to update',
                },
                title: {
                  type: 'string',
                  description: 'Page title',
                },
                content: {
                  type: 'string',
                  description: 'Page content (HTML)',
                },
                status: {
                  type: 'string',
                  description: 'Page status (draft, publish, private)',
                },
                excerpt: {
                  type: 'string',
                  description: 'Page excerpt',
                },
                parent: {
                  type: 'number',
                  description: 'Parent page ID (for creating child pages)',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'get_media',
            description: 'Get WordPress media library items',
            inputSchema: {
              type: 'object',
              properties: {
                per_page: {
                  type: 'number',
                  description: 'Number of media items to retrieve (default: 10)',
                  default: 10,
                },
                media_type: {
                  type: 'string',
                  description: 'Media type (image, video, audio, etc.)',
                },
              },
            },
          },
          {
            name: 'upload_media',
            description: 'Upload media file to WordPress',
            inputSchema: {
              type: 'object',
              properties: {
                file_path: {
                  type: 'string',
                  description: 'Local path to file to upload',
                },
                title: {
                  type: 'string',
                  description: 'Media title',
                },
                alt_text: {
                  type: 'string',
                  description: 'Alt text for images',
                },
              },
              required: ['file_path'],
            },
          }
        );
      }

      if (this.serverConfig.basicElementorOperations) {
        tools.push(
          {
            name: 'get_elementor_templates',
            description: 'Get Elementor templates',
            inputSchema: {
              type: 'object',
              properties: {
                per_page: {
                  type: 'number',
                  description: 'Number of templates to retrieve (default: 10)',
                  default: 10,
                },
                type: {
                  type: 'string',
                  description: 'Template type (page, section, widget, etc.)',
                },
              },
            },
          },
          {
            name: 'get_elementor_data',
            description: 'Get complete Elementor data for a page',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID',
                },
              },
              required: ['post_id'],
            },
          },
          {
            name: 'update_elementor_data',
            description: 'Update complete Elementor data for a page',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID to update',
                },
                elementor_data: {
                  type: 'string',
                  description: 'Complete Elementor data as JSON string',
                },
              },
              required: ['post_id', 'elementor_data'],
            },
          },
          {
            name: 'update_elementor_widget',
            description: 'Update a specific widget within an Elementor page (incremental update)',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID to update',
                },
                widget_id: {
                  type: 'string',
                  description: 'Elementor widget ID (e.g., "621ef73f")',
                },
                widget_settings: {
                  type: 'object',
                  description: 'Widget settings object to update',
                },
                widget_content: {
                  type: 'string',
                  description: 'Widget content (for widgets like HTML, text, etc.)',
                },
              },
              required: ['post_id', 'widget_id'],
            },
          },
          {
            name: 'get_elementor_widget',
            description: 'Get a specific widget from an Elementor page',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID',
                },
                widget_id: {
                  type: 'string',
                  description: 'Elementor widget ID (e.g., "621ef73f")',
                },
              },
              required: ['post_id', 'widget_id'],
            },
          },
          {
            name: 'get_elementor_elements',
            description: 'Get a simplified list of all elements and their IDs from an Elementor page',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID',
                },
                include_content: {
                  type: 'boolean',
                  description: 'Include element content/settings preview (default: false)',
                  default: false,
                },
              },
              required: ['post_id'],
            },
          },
          {
            name: 'update_elementor_section',
            description: 'Update multiple widgets within a specific Elementor section (batch update)',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID to update',
                },
                section_id: {
                  type: 'string',
                  description: 'Elementor section ID',
                },
                widgets_updates: {
                  type: 'array',
                  description: 'Array of widget updates',
                  items: {
                    type: 'object',
                    properties: {
                      widget_id: {
                        type: 'string',
                        description: 'Widget ID to update',
                      },
                      widget_settings: {
                        type: 'object',
                        description: 'Widget settings to update',
                      },
                      widget_content: {
                        type: 'string',
                        description: 'Widget content to update',
                      },
                    },
                    required: ['widget_id'],
                  },
                },
              },
              required: ['post_id', 'section_id', 'widgets_updates'],
            },
          },
          {
            name: 'get_elementor_data_chunked',
            description: 'Get Elementor data in smaller chunks to handle large pages more efficiently',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID',
                },
                chunk_size: {
                  type: 'number',
                  description: 'Number of top-level elements per chunk (default: 5)',
                  default: 5,
                },
                chunk_index: {
                  type: 'number',
                  description: 'Zero-based chunk index to retrieve (default: 0)',
                  default: 0,
                },
              },
              required: ['post_id'],
            },
          },
          {
            name: 'backup_elementor_data',
            description: 'Create a backup of Elementor page data',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID to backup',
                },
                backup_name: {
                  type: 'string',
                  description: 'Optional name for the backup',
                },
              },
              required: ['post_id'],
            },
          },
          {
            name: 'clear_elementor_cache',
            description: 'Clear Elementor cache for better performance',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Optional: specific post ID to clear cache for',
                },
              },
            },
          }
        );
      }

      if (this.serverConfig.sectionContainerCreation) {
        tools.push(
          {
            name: 'create_elementor_section',
            description: 'Create a new Elementor section with specified columns',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID to add section to',
                },
                position: {
                  type: 'number',
                  description: 'Position to insert the section (0-based, default: append to end)',
                },
                columns: {
                  type: 'number',
                  description: 'Number of columns to create (default: 1)',
                  default: 1,
                },
                section_settings: {
                  type: 'object',
                  description: 'Optional settings for the section',
                },
              },
              required: ['post_id'],
            },
          },
          {
            name: 'create_elementor_container',
            description: 'Create a new Elementor container (Flexbox)',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID to add container to',
                },
                position: {
                  type: 'number',
                  description: 'Position to insert the container (0-based, default: append to end)',
                },
                container_settings: {
                  type: 'object',
                  description: 'Optional settings for the container',
                },
              },
              required: ['post_id'],
            },
          },
          {
            name: 'add_column_to_section',
            description: 'Add columns to an existing Elementor section',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID',
                },
                section_id: {
                  type: 'string',
                  description: 'Section ID to add columns to',
                },
                columns_to_add: {
                  type: 'number',
                  description: 'Number of columns to add (default: 1)',
                  default: 1,
                },
              },
              required: ['post_id', 'section_id'],
            },
          },
          {
            name: 'duplicate_section',
            description: 'Duplicate an existing Elementor section',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID',
                },
                section_id: {
                  type: 'string',
                  description: 'Section ID to duplicate',
                },
                position: {
                  type: 'number',
                  description: 'Position to insert the duplicated section (0-based, default: after original)',
                },
              },
              required: ['post_id', 'section_id'],
            },
          }
        );
      }

      if (this.serverConfig.widgetAddition) {
        tools.push(
          {
            name: 'add_widget_to_section',
            description: 'Add a widget to a specific section/column',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID',
                },
                section_id: {
                  type: 'string',
                  description: 'Target section ID (optional if column_id is provided)',
                },
                column_id: {
                  type: 'string',
                  description: 'Target column ID (optional if section_id is provided)',
                },
                widget_type: {
                  type: 'string',
                  description: 'Widget type (e.g., "heading", "text", "image", "button")',
                },
                widget_settings: {
                  type: 'object',
                  description: 'Widget settings and content',
                },
                position: {
                  type: 'number',
                  description: 'Position within the container (0-based, default: append)',
                },
              },
              required: ['post_id', 'widget_type'],
            },
          },
          {
            name: 'insert_widget_at_position',
            description: 'Insert a widget at a specific position relative to another element',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID',
                },
                widget_type: {
                  type: 'string',
                  description: 'Widget type to insert',
                },
                widget_settings: {
                  type: 'object',
                  description: 'Widget settings and content',
                },
                target_element_id: {
                  type: 'string',
                  description: 'Element ID to insert relative to',
                },
                insert_position: {
                  type: 'string',
                  description: 'Position relative to target: "before", "after", "inside" (default: "after")',
                  default: 'after',
                },
              },
              required: ['post_id', 'widget_type', 'target_element_id'],
            },
          },
          {
            name: 'clone_widget',
            description: 'Clone an existing widget',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID',
                },
                widget_id: {
                  type: 'string',
                  description: 'Widget ID to clone',
                },
                target_element_id: {
                  type: 'string',
                  description: 'Element ID to insert cloned widget relative to (optional)',
                },
                insert_position: {
                  type: 'string',
                  description: 'Position relative to target: "before", "after", "inside" (default: "after")',
                  default: 'after',
                },
              },
              required: ['post_id', 'widget_id'],
            },
          },
          {
            name: 'move_widget',
            description: 'Move a widget to a different section/column',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID',
                },
                widget_id: {
                  type: 'string',
                  description: 'Widget ID to move',
                },
                target_section_id: {
                  type: 'string',
                  description: 'Target section ID (optional if target_column_id is provided)',
                },
                target_column_id: {
                  type: 'string',
                  description: 'Target column ID (optional if target_section_id is provided)',
                },
                position: {
                  type: 'number',
                  description: 'Position within target container (0-based, default: append)',
                },
              },
              required: ['post_id', 'widget_id'],
            },
          }
        );
      }

      if (this.serverConfig.elementManagement) {
        tools.push(
          {
            name: 'delete_elementor_element',
            description: 'Delete an Elementor element (section, column, or widget)',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID',
                },
                element_id: {
                  type: 'string',
                  description: 'Element ID to delete',
                },
              },
              required: ['post_id', 'element_id'],
            },
          },
          {
            name: 'reorder_elements',
            description: 'Reorder elements within a container',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID',
                },
                container_id: {
                  type: 'string',
                  description: 'Container ID (section or column)',
                },
                element_ids: {
                  type: 'array',
                  description: 'Array of element IDs in desired order',
                  items: {
                    type: 'string',
                  },
                },
              },
              required: ['post_id', 'container_id', 'element_ids'],
            },
          },
          {
            name: 'copy_element_settings',
            description: 'Copy settings from one element to another',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID',
                },
                source_element_id: {
                  type: 'string',
                  description: 'Source element ID to copy from',
                },
                target_element_id: {
                  type: 'string',
                  description: 'Target element ID to copy to',
                },
                settings_to_copy: {
                  type: 'array',
                  description: 'Specific setting keys to copy (optional, copies all if not specified)',
                  items: {
                    type: 'string',
                  },
                },
              },
              required: ['post_id', 'source_element_id', 'target_element_id'],
            },
          }
        );
      }

      if (this.serverConfig.pageStructure) {
        tools.push(
          {
            name: 'get_page_structure',
            description: 'Get a simplified overview of the page structure',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID',
                },
                include_settings: {
                  type: 'boolean',
                  description: 'Include basic settings for each element (default: false)',
                  default: false,
                },
              },
              required: ['post_id'],
            },
          }
        );
      }

      if (this.serverConfig.performanceOptimization) {
        tools.push(
          {
            name: 'clear_elementor_cache_by_page',
            description: 'Clear Elementor cache for a specific page',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID to clear cache for',
                },
              },
              required: ['post_id'],
            },
          }
        );
      }

      if (this.serverConfig.advancedElementOperations) {
        tools.push(
          {
            name: 'find_elements_by_type',
            description: 'Find all elements of a specific type on a page',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID',
                },
                widget_type: {
                  type: 'string',
                  description: 'Widget type to search for (e.g., "heading", "text", "image")',
                },
                include_settings: {
                  type: 'boolean',
                  description: 'Include element settings in results (default: false)',
                  default: false,
                },
              },
              required: ['post_id', 'widget_type'],
            },
          }
        );
      }

      // Add tool count to help users understand which mode is active
      const totalEnabled = this.serverConfig.getTotalEnabledFeatures();
      
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[Config] Loaded ${tools.length} tools (Mode: ${this.serverConfig.mode}, Features: ${totalEnabled})`);
        console.error(`[Config] Active features: ${Object.entries(this.serverConfig)
          .filter(([key, value]) => typeof value === 'boolean' && value && key !== 'mode')
          .map(([key]) => key)
          .join(', ')}`);
      }

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'configure_wordpress':
            return await this.configureWordPress(args as any);
          case 'get_posts':
            return await this.getPosts(args as any);
          case 'get_post':
            return await this.getPost(args as any);
          case 'create_post':
            return await this.createPost(args as any);
          case 'update_post':
            return await this.updatePost(args as any);
          case 'get_pages':
            return await this.getPages(args as any);
          case 'list_all_content':
            return await this.listAllContent(args as any);
          case 'create_page':
            return await this.createPage(args as any);
          case 'update_page':
            return await this.updatePage(args as any);
          case 'get_elementor_templates':
            return await this.getElementorTemplates(args as any);
          case 'get_elementor_data':
            return await this.getElementorData(args as any);
          case 'update_elementor_data':
            return await this.updateElementorData(args as any);
          case 'update_elementor_widget':
            return await this.updateElementorWidget(args as any);
          case 'get_elementor_widget':
            return await this.getElementorWidget(args as any);
          case 'get_elementor_elements':
            return await this.getElementorElements(args as any);
          case 'update_elementor_section':
            return await this.updateElementorSection(args as any);
          case 'get_elementor_data_chunked':
            return await this.getElementorDataChunked(args as any);
          case 'backup_elementor_data':
            return await this.backupElementorData(args as any);
          case 'get_media':
            return await this.getMedia(args as any);
          case 'upload_media':
            return await this.uploadMedia(args as any);
          // Section and Container Creation Tools
          case 'create_elementor_section':
            return await this.createElementorSection(args as any);
          case 'create_elementor_container':
            return await this.createElementorContainer(args as any);
          case 'add_column_to_section':
            return await this.addColumnToSection(args as any);
          case 'duplicate_section':
            return await this.duplicateSection(args as any);
          // Widget Addition Tools
          case 'add_widget_to_section':
            return await this.addWidgetToSection(args as any);
          case 'insert_widget_at_position':
            return await this.insertWidgetAtPosition(args as any);
          case 'clone_widget':
            return await this.cloneWidget(args as any);
          case 'move_widget':
            return await this.moveWidget(args as any);
          // Element Management Tools
          case 'delete_elementor_element':
            return await this.deleteElementorElement(args as any);
          case 'reorder_elements':
            return await this.reorderElements(args as any);
          case 'copy_element_settings':
            return await this.copyElementSettings(args as any);
          // Template Management
          case 'create_elementor_template':
            return await this.createElementorTemplate(args as any);
          case 'apply_template_to_page':
            return await this.applyTemplateToPage(args as any);
          case 'export_elementor_template':
            return await this.exportElementorTemplate(args as any);
          case 'import_elementor_template':
            return await this.importElementorTemplate(args as any);
          // Global Settings Management
          case 'get_elementor_global_colors':
            return await this.getElementorGlobalColors(args as any);
          case 'update_elementor_global_colors':
            return await this.updateElementorGlobalColors(args as any);
          case 'get_elementor_global_fonts':
            return await this.getElementorGlobalFonts(args as any);
          case 'update_elementor_global_fonts':
            return await this.updateElementorGlobalFonts(args as any);
          // Page Structure Tools
          case 'get_page_structure':
            return await this.getPageStructure(args as any);
          case 'rebuild_page_structure':
            return await this.rebuildPageStructure(args as any);
          case 'validate_elementor_data':
            return await this.validateElementorData(args as any);
          // Performance & Optimization
          case 'regenerate_css':
            return await this.regenerateCSS(args as any);
          case 'optimize_elementor_assets':
            return await this.optimizeElementorAssets(args as any);
          case 'clear_elementor_cache_by_page':
            return await this.clearElementorCacheByPage(args as any);
          // Advanced Element Operations
          case 'find_elements_by_type':
            return await this.findElementsByType(args as any);
          case 'bulk_update_widget_settings':
            return await this.bulkUpdateWidgetSettings(args as any);
          case 'replace_widget_content':
            return await this.replaceWidgetContent(args as any);
          // Custom Fields Integration
          case 'get_elementor_custom_fields':
            return await this.getElementorCustomFields(args as any);
          case 'update_dynamic_content_sources':
            return await this.updateDynamicContentSources(args as any);
          // Revision and History
          case 'get_elementor_revisions':
            return await this.getElementorRevisions(args as any);
          case 'restore_elementor_revision':
            return await this.restoreElementorRevision(args as any);
          case 'compare_elementor_revisions':
            return await this.compareElementorRevisions(args as any);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error}`);
      }
    });
  }

  private setupResourceHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'elementor://config',
            mimeType: 'application/json',
            name: 'WordPress Configuration',
            description: 'Current WordPress connection configuration',
          },
        ],
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      if (uri === 'elementor://config') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(
                this.config
                  ? {
                      baseUrl: this.config.baseUrl,
                      username: this.config.username,
                      connected: true,
                    }
                  : { connected: false },
                null,
                2
              ),
            },
          ],
        };
      }

      throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
    });
  }

  // Tool implementations
  private async configureWordPress(args: {
    baseUrl: string;
    username: string;
    applicationPassword: string;
  }) {
    try {
      this.setupAxios(args);
      
      // Test the connection
      const response = await this.axiosInstance!.get('users/me');
      
      return {
        content: [
          {
            type: 'text',
            text: `Successfully connected to WordPress!\nUser: ${response.data.name}\nSite: ${args.baseUrl}`,
          },
        ],
      };
    } catch (error: any) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to connect to WordPress: ${error.response?.data?.message || error.message}`
      );
    }
  }

  private async getPosts(args: { per_page?: number; status?: string; search?: string }) {
    this.ensureAuthenticated();
    
    const params: any = {
      per_page: args.per_page || 10,
      status: args.status || 'publish',
      context: 'edit' // Get full data including meta
    };
    
    if (args.search) {
      params.search = args.search;
    }

    try {
      console.error(`Fetching posts with params: ${JSON.stringify(params)}`);
      const response = await this.axiosInstance!.get('posts', { params });
      
      // Enhanced response with debugging info
      const posts = response.data;
      let debugInfo = `Found ${posts.length} posts\n`;
      
      // Add summary of posts with Elementor data detection
      posts.forEach((post: any, index: number) => {
        const hasElementorData = post.meta && post.meta._elementor_data;
        const hasElementorEditMode = post.meta && post.meta._elementor_edit_mode;
        debugInfo += `${index + 1}. ID: ${post.id}, Title: "${post.title.rendered}", Status: ${post.status}`;
        if (hasElementorData) {
          debugInfo += ` ✅ Elementor`;
        } else if (hasElementorEditMode) {
          debugInfo += ` ⚠️ Elementor (no data)`;
        }
        debugInfo += `\n`;
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `${debugInfo}\n--- Full JSON Response ---\n${JSON.stringify(posts, null, 2)}`,
          },
        ],
      };
    } catch (error: any) {
      console.error(`Error fetching posts: ${error.response?.status} - ${error.response?.statusText}`);
      console.error(`URL: ${error.config?.url}`);
      console.error(`Headers: ${JSON.stringify(error.config?.headers)}`);
      
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to fetch posts: ${error.response?.status} ${error.response?.statusText} - ${error.response?.data?.message || error.message}`
      );
    }
  }

  private async getPost(args: { id: number }) {
    this.ensureAuthenticated();
    
    const response = await this.axiosInstance!.get(`posts/${args.id}`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async createPost(args: {
    title: string;
    content: string;
    status?: string;
    excerpt?: string;
  }) {
    this.ensureAuthenticated();
    
    const postData = {
      title: args.title,
      content: args.content,
      status: args.status || 'draft',
      ...(args.excerpt && { excerpt: args.excerpt }),
    };

    const response = await this.axiosInstance!.post('posts', postData);
    
    // Clear Elementor cache after creating post
    await this.clearElementorCache(response.data.id);
    
          return {
        content: [
          {
            type: 'text',
            text: `Post created successfully!\nID: ${response.data.id}\nTitle: ${response.data.title.rendered}\nStatus: ${response.data.status}\nURL: ${response.data.link}

✅ Automatic Elementor cache clearing attempted.
💡 If using Elementor content, manually clear cache: WordPress Admin → Elementor → Tools → Regenerate CSS & Data`,
          },
        ],
      };
  }

  private async updatePost(args: {
    id: number;
    title?: string;
    content?: string;
    status?: string;
    excerpt?: string;
  }) {
    this.ensureAuthenticated();
    
    const updateData: any = {};
    if (args.title) updateData.title = args.title;
    if (args.content) updateData.content = args.content;
    if (args.status) updateData.status = args.status;
    if (args.excerpt) updateData.excerpt = args.excerpt;

    const response = await this.axiosInstance!.post(`posts/${args.id}`, updateData);
    
    // Clear Elementor cache after updating post
    await this.clearElementorCache(args.id);
    
          return {
        content: [
          {
            type: 'text',
            text: `Post updated successfully!\nID: ${response.data.id}\nTitle: ${response.data.title.rendered}\nStatus: ${response.data.status}

✅ Automatic Elementor cache clearing attempted.
💡 If using Elementor content, manually clear cache: WordPress Admin → Elementor → Tools → Regenerate CSS & Data`,
          },
        ],
      };
  }

  private async getPages(args: { per_page?: number; status?: string }) {
    this.ensureAuthenticated();
    
    const params = {
      per_page: args.per_page || 10,
      status: args.status || 'publish',
      context: 'edit' // Get full data including meta
    };

    try {
      console.error(`Fetching pages with params: ${JSON.stringify(params)}`);
      const response = await this.axiosInstance!.get('pages', { params });
      
      // Enhanced response with debugging info
      const pages = response.data;
      let debugInfo = `Found ${pages.length} pages\n`;
      
      // Add summary of pages with Elementor data detection
      pages.forEach((page: any, index: number) => {
        const hasElementorData = page.meta && page.meta._elementor_data;
        const hasElementorEditMode = page.meta && page.meta._elementor_edit_mode;
        debugInfo += `${index + 1}. ID: ${page.id}, Title: "${page.title.rendered}", Status: ${page.status}`;
        if (hasElementorData) {
          debugInfo += ` ✅ Elementor`;
        } else if (hasElementorEditMode) {
          debugInfo += ` ⚠️ Elementor (no data)`;
        }
        debugInfo += `\n`;
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `${debugInfo}\n--- Full JSON Response ---\n${JSON.stringify(pages, null, 2)}`,
          },
        ],
      };
    } catch (error: any) {
      console.error(`Error fetching pages: ${error.response?.status} - ${error.response?.statusText}`);
      console.error(`URL: ${error.config?.url}`);
      console.error(`Headers: ${JSON.stringify(error.config?.headers)}`);
      
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to fetch pages: ${error.response?.status} ${error.response?.statusText} - ${error.response?.data?.message || error.message}`
      );
         }
   }

  private async listAllContent(args: { per_page?: number; include_all_statuses?: boolean }) {
    this.ensureAuthenticated();
    
    try {
      const perPage = args.per_page || 50;
      const statuses = args.include_all_statuses ? ['publish', 'draft', 'private', 'trash'] : ['publish'];
      
      console.error(`Listing all content with per_page: ${perPage}, statuses: ${statuses.join(', ')}`);
      
      let allContent: Array<{
        id: number;
        title: string;
        type: 'post' | 'page';
        status: string;
        elementor_status: 'full' | 'partial' | 'none';
        url?: string;
      }> = [];
      
      // Fetch posts for each status
      for (const status of statuses) {
        try {
          const postsResponse = await this.axiosInstance!.get('posts', {
            params: {
              per_page: perPage,
              status,
              context: 'edit'
            }
          });
          
          postsResponse.data.forEach((post: any) => {
            const hasElementorData = post.meta?._elementor_data;
            const hasElementorEditMode = post.meta?._elementor_edit_mode;
            
            let elementorStatus: 'full' | 'partial' | 'none' = 'none';
            if (hasElementorData) {
              elementorStatus = 'full';
            } else if (hasElementorEditMode === 'builder') {
              elementorStatus = 'partial';
            }
            
            allContent.push({
              id: post.id,
              title: post.title.rendered || '(No title)',
              type: 'post',
              status: post.status,
              elementor_status: elementorStatus,
              url: post.link
            });
          });
        } catch (error: any) {
          console.error(`Failed to fetch posts with status ${status}: ${error.message}`);
        }
      }
      
      // Fetch pages for each status
      for (const status of statuses) {
        try {
          const pagesResponse = await this.axiosInstance!.get('pages', {
            params: {
              per_page: perPage,
              status,
              context: 'edit'
            }
          });
          
          pagesResponse.data.forEach((page: any) => {
            const hasElementorData = page.meta?._elementor_data;
            const hasElementorEditMode = page.meta?._elementor_edit_mode;
            
            let elementorStatus: 'full' | 'partial' | 'none' = 'none';
            if (hasElementorData) {
              elementorStatus = 'full';
            } else if (hasElementorEditMode === 'builder') {
              elementorStatus = 'partial';
            }
            
            allContent.push({
              id: page.id,
              title: page.title.rendered || '(No title)',
              type: 'page',
              status: page.status,
              elementor_status: elementorStatus,
              url: page.link
            });
          });
        } catch (error: any) {
          console.error(`Failed to fetch pages with status ${status}: ${error.message}`);
        }
      }
      
      // Sort by ID
      allContent.sort((a, b) => a.id - b.id);
      
      // Generate summary
      const summary = {
        total: allContent.length,
        by_type: {
          posts: allContent.filter(item => item.type === 'post').length,
          pages: allContent.filter(item => item.type === 'page').length
        },
        by_elementor_status: {
          full: allContent.filter(item => item.elementor_status === 'full').length,
          partial: allContent.filter(item => item.elementor_status === 'partial').length,
          none: allContent.filter(item => item.elementor_status === 'none').length
        },
        by_status: {} as Record<string, number>
      };
      
      // Count by status
      allContent.forEach(item => {
        summary.by_status[item.status] = (summary.by_status[item.status] || 0) + 1;
      });
      
      // Format output
      let output = `📊 Content Summary\n`;
      output += `Total items: ${summary.total}\n`;
      output += `Posts: ${summary.by_type.posts}, Pages: ${summary.by_type.pages}\n`;
      output += `Elementor: Full (${summary.by_elementor_status.full}), Partial (${summary.by_elementor_status.partial}), None (${summary.by_elementor_status.none})\n`;
      output += `Statuses: ${Object.entries(summary.by_status).map(([status, count]) => `${status} (${count})`).join(', ')}\n\n`;
      
      output += `📋 Content List\n`;
      output += `${'ID'.padEnd(6)} ${'Type'.padEnd(5)} ${'Status'.padEnd(8)} ${'Elementor'.padEnd(9)} Title\n`;
      output += `${'─'.repeat(6)} ${'─'.repeat(5)} ${'─'.repeat(8)} ${'─'.repeat(9)} ${'─'.repeat(50)}\n`;
      
      allContent.forEach(item => {
        const elementorIcon = item.elementor_status === 'full' ? '✅' : item.elementor_status === 'partial' ? '⚠️' : '❌';
        const title = item.title.length > 45 ? item.title.substring(0, 42) + '...' : item.title;
        output += `${item.id.toString().padEnd(6)} ${item.type.padEnd(5)} ${item.status.padEnd(8)} ${(elementorIcon + ' ' + item.elementor_status).padEnd(9)} ${title}\n`;
      });
      
      return {
        content: [
          {
            type: 'text',
            text: output,
          },
        ],
      };
      
    } catch (error: any) {
      console.error(`Error listing all content: ${error.message}`);
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to list content: ${error.response?.status} ${error.response?.statusText} - ${error.response?.data?.message || error.message}`
      );
    }
  }

  private async createPage(args: {
    title: string;
    content: string;
    status?: string;
    excerpt?: string;
    parent?: number;
  }) {
    this.ensureAuthenticated();
    
    const pageData = {
      title: args.title,
      content: args.content,
      status: args.status || 'draft',
      ...(args.excerpt && { excerpt: args.excerpt }),
      ...(args.parent && { parent: args.parent }),
    };

    const response = await this.axiosInstance!.post('pages', pageData);
    
    // Clear Elementor cache after creating page
    await this.clearElementorCache(response.data.id);
    
          return {
        content: [
          {
            type: 'text',
            text: `Page created successfully!\nID: ${response.data.id}\nTitle: ${response.data.title.rendered}\nStatus: ${response.data.status}\nURL: ${response.data.link}

✅ Automatic Elementor cache clearing attempted.
💡 If using Elementor content, manually clear cache: WordPress Admin → Elementor → Tools → Regenerate CSS & Data`,
          },
        ],
      };
  }

  private async updatePage(args: {
    id: number;
    title?: string;
    content?: string;
    status?: string;
    excerpt?: string;
    parent?: number;
  }) {
    this.ensureAuthenticated();
    
    const updateData: any = {};
    if (args.title) updateData.title = args.title;
    if (args.content) updateData.content = args.content;
    if (args.status) updateData.status = args.status;
    if (args.excerpt) updateData.excerpt = args.excerpt;
    if (args.parent !== undefined) updateData.parent = args.parent;

    const response = await this.axiosInstance!.post(`pages/${args.id}`, updateData);
    
    // Clear Elementor cache after updating page
    await this.clearElementorCache(args.id);
    
          return {
        content: [
          {
            type: 'text',
            text: `Page updated successfully!\nID: ${response.data.id}\nTitle: ${response.data.title.rendered}\nStatus: ${response.data.status}

✅ Automatic Elementor cache clearing attempted.
💡 If using Elementor content, manually clear cache: WordPress Admin → Elementor → Tools → Regenerate CSS & Data`,
          },
        ],
      };
  }

  private async getElementorTemplates(args: { per_page?: number; type?: string }) {
    this.ensureAuthenticated();
    
    const params: any = {
      per_page: args.per_page || 10,
      meta_key: '_elementor_template_type',
    };
    
    if (args.type) {
      params.meta_value = args.type;
    }

    try {
      const response = await this.axiosInstance!.get('elementor_library', { params });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          'Elementor templates endpoint not found. Make sure Elementor Pro is installed and activated.'
        );
      }
      throw error;
    }
  }

  private async getElementorData(args: { post_id: number }) {
    this.ensureAuthenticated();
    
    try {
      console.error(`Getting Elementor data for ID: ${args.post_id}`);
      
      // Try to get as post first, then as page if that fails
      let response;
      let postType = 'post';
      let debugInfo = '';
      
      try {
        console.error(`Trying to fetch as post: posts/${args.post_id}`);
        response = await this.axiosInstance!.get(`posts/${args.post_id}`, {
          params: { context: 'edit' }
        });
        debugInfo += `Found as post (ID: ${args.post_id})\n`;
      } catch (postError: any) {
        console.error(`Post fetch failed: ${postError.response?.status} - ${postError.response?.statusText}`);
        
        if (postError.response?.status === 404) {
          // Try as page
          try {
            console.error(`Trying to fetch as page: pages/${args.post_id}`);
            response = await this.axiosInstance!.get(`pages/${args.post_id}`, {
              params: { context: 'edit' }
            });
            postType = 'page';
            debugInfo += `Found as page (ID: ${args.post_id})\n`;
          } catch (pageError: any) {
            console.error(`Page fetch failed: ${pageError.response?.status} - ${pageError.response?.statusText}`);
            
            // Provide comprehensive error message
            const errorDetails = `
❌ Post/Page ID ${args.post_id} not found

Debug Information:
- Tried as post: ${postError.response?.status} ${postError.response?.statusText}
- Tried as page: ${pageError.response?.status} ${pageError.response?.statusText}

Suggestions:
1. Verify the ID exists by running get_posts or get_pages
2. Check if the ID might be a custom post type
3. Ensure the post/page is not trashed
4. Verify your user permissions include access to this content
            `;
            
            throw new McpError(
              ErrorCode.InvalidRequest,
              errorDetails.trim()
            );
          }
        } else {
          throw postError;
        }
      }
      
      // Analyze the response for Elementor data
      const data = response.data;
      console.error(`Response received for ${postType} ${args.post_id}`);
      console.error(`Meta keys available: ${data.meta ? Object.keys(data.meta).join(', ') : 'None'}`);
      
      const elementorData = data.meta?._elementor_data;
      const elementorEditMode = data.meta?._elementor_edit_mode;
      const elementorVersion = data.meta?._elementor_version;
      const elementorPageSettings = data.meta?._elementor_page_settings;
      
      debugInfo += `Title: "${data.title.rendered}"\n`;
      debugInfo += `Status: ${data.status}\n`;
      debugInfo += `Type: ${postType}\n`;
      debugInfo += `Edit Mode: ${elementorEditMode || 'None'}\n`;
      debugInfo += `Version: ${elementorVersion || 'None'}\n`;
      debugInfo += `Has Page Settings: ${elementorPageSettings ? 'Yes' : 'No'}\n`;
      debugInfo += `Has Elementor Data: ${elementorData ? 'Yes' : 'No'}\n`;
      
      if (elementorData) {
        try {
          const parsedData = JSON.parse(elementorData);
          debugInfo += `Elementor Elements Count: ${Array.isArray(parsedData) ? parsedData.length : 'Not an array'}\n`;
          
          return {
            content: [
              {
                type: 'text',
                text: `${debugInfo}\n--- Elementor Data ---\n${JSON.stringify(parsedData, null, 2)}`,
              },
            ],
          };
        } catch (parseError) {
          debugInfo += `⚠️ Elementor data found but failed to parse JSON\n`;
          return {
            content: [
              {
                type: 'text',
                text: `${debugInfo}\n--- Raw Elementor Data ---\n${elementorData}`,
              },
            ],
          };
        }
      } else {
        // Check if this is an Elementor page without data
        if (elementorEditMode === 'builder') {
          debugInfo += `\n⚠️ This appears to be an Elementor page but has no data.\n`;
          debugInfo += `Possible reasons:\n`;
          debugInfo += `- Empty Elementor page\n`;
          debugInfo += `- Cache/synchronization issue\n`;
          debugInfo += `- Elementor data stored differently\n`;
        } else {
          debugInfo += `\n❌ This ${postType} does not use Elementor builder.\n`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `${debugInfo}\n--- Available Meta Keys ---\n${data.meta ? JSON.stringify(Object.keys(data.meta), null, 2) : 'No meta data available'}`,
            },
          ],
        };
      }
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      
      console.error(`Unexpected error getting Elementor data: ${error.message}`);
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to get Elementor data: ${error.response?.status} ${error.response?.statusText} - ${error.response?.data?.message || error.message}`
      );
    }
  }

  private async clearElementorCache(postId?: number) {
    try {
      console.error('Attempting to clear Elementor cache...');
      
      // Method 1: Clear specific Elementor meta that forces regeneration
      if (postId) {
        try {
          console.error(`Clearing Elementor cache meta for post ${postId}...`);
          
          // Try to get current page/post
          let currentData;
          let isPage = false;
          
          try {
            currentData = await this.axiosInstance!.get(`pages/${postId}`);
            isPage = true;
          } catch {
            currentData = await this.axiosInstance!.get(`posts/${postId}`);
          }
          
          // Update meta to force Elementor cache regeneration
          const cacheBreakMeta = {
            meta: {
              _elementor_css: '',  // Clear generated CSS cache
              _elementor_page_settings: currentData.data.meta._elementor_page_settings || '',
              _elementor_edit_mode: 'builder',
              _elementor_version: '3.0.0',  // Force version update
              _elementor_cache_bust: Date.now().toString()
            }
          };
          
          if (isPage) {
            await this.axiosInstance!.post(`pages/${postId}`, cacheBreakMeta);
          } else {
            await this.axiosInstance!.post(`posts/${postId}`, cacheBreakMeta);
          }
          
          console.error(`Elementor cache meta cleared for post ${postId}`);
        } catch (error: any) {
          console.error(`Failed to clear post-specific cache: ${error.message}`);
        }
      }
      
      // Method 2: Try WordPress cache clearing endpoints
      const cacheEndpoints = [
        'wp/v2/elementor/flush',
        'wp/v2/settings',  // Sometimes triggers cache clear
        'elementor/v1/flush-css',
        'elementor/v1/clear-cache'
      ];

      for (const endpoint of cacheEndpoints) {
        try {
          console.error(`Trying cache clear endpoint: ${endpoint}`);
          if (endpoint === 'wp/v2/settings') {
            // Force settings update to trigger cache clear
            await this.axiosInstance!.post(endpoint, {
              elementor_cache_time: Date.now().toString()
            });
          } else {
            await this.axiosInstance!.post(endpoint, {});
          }
          console.error(`Cache clear attempted via ${endpoint}`);
        } catch (error: any) {
          console.error(`Cache clear failed via ${endpoint}: ${error.response?.status || error.message}`);
        }
      }

      // Method 3: Update Elementor global settings to force regeneration
      try {
        console.error('Forcing Elementor regeneration via options...');
        
        // Update multiple Elementor options that can trigger cache clear
        const optionUpdates = [
          { elementor_css_print_method: 'internal' },
          { elementor_cpt_support: ['page', 'post'] },
          { elementor_disable_color_schemes: '' },
          { elementor_disable_typography_schemes: '' },
          { elementor_cache_files_time: Date.now().toString() }
        ];
        
        for (const option of optionUpdates) {
          try {
            await this.axiosInstance!.post('wp/v2/options', option);
          } catch (error: any) {
            console.error(`Option update failed: ${error.message}`);
          }
        }
        
        console.error('Elementor options updated to force regeneration');
      } catch (error: any) {
        console.error(`Failed to update Elementor options: ${error.message}`);
      }

      // Method 4: Force Elementor to rebuild by clearing ALL cache-related meta
      if (postId) {
        try {
          console.error('Forcing complete Elementor rebuild...');
          
          // Get current data again
          let currentData;
          let isPage = false;
          
          try {
            currentData = await this.axiosInstance!.get(`pages/${postId}`);
            isPage = true;
          } catch {
            currentData = await this.axiosInstance!.get(`posts/${postId}`);
          }
          
          // Force complete rebuild by clearing all Elementor cache meta
          const forceRebuildMeta = {
            meta: {
              _elementor_css: '',
              _elementor_page_assets: '',
              _elementor_controls_usage: '',
              _elementor_css_file: '',
              _elementor_inline_css: '',
              _elementor_template_type: '',
              _elementor_edit_mode: 'builder',
              _elementor_version: '3.20.0',
              _elementor_pro_version: '3.20.0',
              _elementor_data: currentData.data.meta._elementor_data,  // Keep the data but force rebuild
              _elementor_cache_bust: Date.now().toString(),
              _elementor_force_rebuild: 'yes'
            }
          };
          
          if (isPage) {
            await this.axiosInstance!.post(`pages/${postId}`, forceRebuildMeta);
          } else {
            await this.axiosInstance!.post(`posts/${postId}`, forceRebuildMeta);
          }
          
          console.error('Complete Elementor rebuild forced');
        } catch (error: any) {
          console.error(`Force rebuild failed: ${error.message}`);
        }
      }

      // Method 5: Try to trigger WordPress object cache flush
      try {
        console.error('Attempting WordPress object cache flush...');
        await this.axiosInstance!.post('wp/v2/posts', {
          title: `Cache Flush Trigger ${Date.now()}`,
          content: 'Cache flush trigger',
          status: 'draft'
        });
        console.error('Cache flush trigger post created');
      } catch (error: any) {
        console.error(`Cache flush trigger failed: ${error.message}`);
      }

      // Method 6: Try to force WordPress transient cache clear
      try {
        console.error('Attempting transient cache clear...');
        await this.axiosInstance!.post('wp/v2/options', {
          elementor_transient_clear: Date.now().toString()
        });
        console.error('Transient cache clear attempted');
      } catch (error: any) {
        console.error(`Transient cache clear failed: ${error.message}`);
      }

      console.error('Aggressive Elementor cache clearing sequence completed');
      
    } catch (error: any) {
      console.error('Cache clearing error:', error.message);
    }
  }

  private async updateElementorData(args: { post_id: number; elementor_data: string }) {
    this.ensureAuthenticated();
    
    try {
      // Update the post meta with Elementor data
      const updateData = {
        meta: {
          _elementor_data: args.elementor_data,
          _elementor_edit_mode: 'builder',
        },
      };

      // Try to update as post first, then as page if that fails
      let response;
      let postType = 'post';
      
      try {
        response = await this.axiosInstance!.post(`posts/${args.post_id}`, updateData);
      } catch (postError: any) {
        if (postError.response?.status === 404) {
          // Try as page
          try {
            response = await this.axiosInstance!.post(`pages/${args.post_id}`, updateData);
            postType = 'page';
          } catch (pageError: any) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              `Post/Page ID ${args.post_id} not found in posts or pages`
            );
          }
        } else {
          throw postError;
        }
      }

      // Clear Elementor cache after updating data
      await this.clearElementorCache(args.post_id);
      
      return {
        content: [
          {
            type: 'text',
            text: `Elementor data updated successfully for ${postType} ID: ${args.post_id}.

⚠️  IMPORTANT: MANUAL CACHE CLEARING REQUIRED
The Elementor cache has been programmatically cleared, but you may need to manually clear additional caches:

🔧 REQUIRED STEPS:
1. Go to WordPress Admin → Elementor → Tools → Regenerate CSS & Data
2. Click "Regenerate Files & Data" 
3. If using caching plugins, clear those caches too
4. Clear browser cache or use incognito/private browsing

🎯 VERIFICATION:
Visit the page to confirm changes are visible. If not, the cache clearing was incomplete.

✅ Automatic cache clearing attempted via API.`,
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to update Elementor data: ${error.response?.data?.message || error.message}`
      );
    }
  }

  private async updateElementorWidget(args: { post_id: number; widget_id: string; widget_settings?: object; widget_content?: string }) {
    this.ensureAuthenticated();
    
    try {
      // Get current Elementor data
      const currentElementorData = await this.getElementorData({ post_id: args.post_id });
      const currentDataText = currentElementorData.content[0].text;
      
      if (currentDataText.includes('No Elementor data found')) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `No Elementor data found for post/page ID ${args.post_id}`
        );
      }
      
      // Parse current data
      let elementorData: any[];
      try {
        elementorData = JSON.parse(currentDataText);
      } catch (parseError) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Failed to parse current Elementor data: ${parseError}`
        );
      }
      
      // Function to recursively find and update widget
      const updateWidgetRecursive = (elements: any[]): boolean => {
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          
          if (element.id === args.widget_id) {
            // Found the widget, update it
            if (args.widget_settings) {
              element.settings = { ...element.settings, ...args.widget_settings };
            }
            
            // Special handling for HTML widget content
            if (args.widget_content && element.widgetType === 'html') {
              element.settings.html = args.widget_content;
            }
            
            // Special handling for text widget content
            if (args.widget_content && element.widgetType === 'text-editor') {
              element.settings.editor = args.widget_content;
            }
            
            // Special handling for heading widget content
            if (args.widget_content && element.widgetType === 'heading') {
              element.settings.title = args.widget_content;
            }
            
            return true;
          }
          
          // Recursively search in nested elements
          if (element.elements && element.elements.length > 0) {
            if (updateWidgetRecursive(element.elements)) {
              return true;
            }
          }
        }
        return false;
      };
      
      // Find and update the widget
      const widgetFound = updateWidgetRecursive(elementorData);
      
      if (!widgetFound) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Widget ID ${args.widget_id} not found in Elementor data`
        );
      }
      
      // Update the page with modified data
      const updateData = {
        meta: {
          _elementor_data: JSON.stringify(elementorData),
          _elementor_edit_mode: 'builder',
        },
      };

      // Try to update as post first, then as page if that fails
      let response;
      let postType = 'post';
      
      try {
        response = await this.axiosInstance!.post(`posts/${args.post_id}`, updateData);
      } catch (postError: any) {
        if (postError.response?.status === 404) {
          // Try as page
          try {
            response = await this.axiosInstance!.post(`pages/${args.post_id}`, updateData);
            postType = 'page';
          } catch (pageError: any) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              `Post/Page ID ${args.post_id} not found in posts or pages`
            );
          }
        } else {
          throw postError;
        }
      }

      // Clear Elementor cache after updating data
      await this.clearElementorCache(args.post_id);
      
      return {
        content: [
          {
            type: 'text',
            text: `Elementor widget ${args.widget_id} updated successfully for ${postType} ID: ${args.post_id}.

⚠️  IMPORTANT: MANUAL CACHE CLEARING REQUIRED
The Elementor cache has been programmatically cleared, but you may need to manually clear additional caches:

🔧 REQUIRED STEPS:
1. Go to WordPress Admin → Elementor → Tools → Regenerate CSS & Data
2. Click "Regenerate Files & Data" 
3. If using caching plugins, clear those caches too
4. Clear browser cache or use incognito/private browsing

🎯 VERIFICATION:
Visit the page to confirm changes are visible. If not, the cache clearing was incomplete.

✅ Widget-specific incremental update completed.`,
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to update Elementor widget: ${error.response?.data?.message || error.message}`
      );
    }
  }

  private async getElementorWidget(args: { post_id: number; widget_id: string }) {
    this.ensureAuthenticated();
    
    try {
      // Get current Elementor data
      const currentElementorData = await this.getElementorData({ post_id: args.post_id });
      const currentDataText = currentElementorData.content[0].text;
      
      if (currentDataText.includes('No Elementor data found')) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `No Elementor data found for post/page ID ${args.post_id}`
        );
      }
      
      // Parse current data
      let elementorData: any[];
      try {
        elementorData = JSON.parse(currentDataText);
      } catch (parseError) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Failed to parse current Elementor data: ${parseError}`
        );
      }
      
      // Function to recursively find widget
      const findWidgetRecursive = (elements: any[]): any => {
        for (const element of elements) {
          if (element.id === args.widget_id) {
            return element;
          }
          
          // Recursively search in nested elements
          if (element.elements && element.elements.length > 0) {
            const found = findWidgetRecursive(element.elements);
            if (found) return found;
          }
        }
        return null;
      };
      
      // Find the widget
      const widget = findWidgetRecursive(elementorData);
      
      if (!widget) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Widget ID ${args.widget_id} not found in Elementor data`
        );
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(widget, null, 2),
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to get Elementor widget: ${error.response?.data?.message || error.message}`
      );
    }
  }

  private async getElementorElements(args: { post_id: number; include_content?: boolean }) {
    this.ensureAuthenticated();
    
    try {
      // Get current Elementor data
      const currentElementorData = await this.getElementorData({ post_id: args.post_id });
      const currentDataText = currentElementorData.content[0].text;
      
      if (currentDataText.includes('No Elementor data found')) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `No Elementor data found for post/page ID ${args.post_id}`
        );
      }
      
      // Parse current data
      let elementorData: any[];
      try {
        elementorData = JSON.parse(currentDataText);
      } catch (parseError) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Failed to parse current Elementor data: ${parseError}`
        );
      }
      
      // Function to recursively extract elements
      const extractElementsRecursive = (elements: any[], level = 0): any[] => {
        const result: any[] = [];
        
        for (const element of elements) {
          const elementInfo: any = {
            id: element.id,
            type: element.elType,
            level: level,
          };
          
          if (element.widgetType) {
            elementInfo.widgetType = element.widgetType;
          }
          
          if (args.include_content && element.settings) {
            // Include preview of content for common widget types
            if (element.widgetType === 'html' && element.settings.html) {
              elementInfo.contentPreview = element.settings.html.substring(0, 100) + (element.settings.html.length > 100 ? '...' : '');
            } else if (element.widgetType === 'text-editor' && element.settings.editor) {
              elementInfo.contentPreview = element.settings.editor.substring(0, 100) + (element.settings.editor.length > 100 ? '...' : '');
            } else if (element.widgetType === 'heading' && element.settings.title) {
              elementInfo.contentPreview = element.settings.title.substring(0, 100) + (element.settings.title.length > 100 ? '...' : '');
            }
          }
          
          result.push(elementInfo);
          
          // Recursively process nested elements
          if (element.elements && element.elements.length > 0) {
            result.push(...extractElementsRecursive(element.elements, level + 1));
          }
        }
        
        return result;
      };
      
      const elements = extractElementsRecursive(elementorData);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ 
              post_id: args.post_id,
              total_elements: elements.length,
              elements: elements 
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to get Elementor elements: ${error.response?.data?.message || error.message}`
      );
    }
  }

  private async updateElementorSection(args: { post_id: number; section_id: string; widgets_updates: Array<{widget_id: string; widget_settings?: object; widget_content?: string}> }) {
    this.ensureAuthenticated();
    
    try {
      // Get current Elementor data
      const currentElementorData = await this.getElementorData({ post_id: args.post_id });
      const currentDataText = currentElementorData.content[0].text;
      
      if (currentDataText.includes('No Elementor data found')) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `No Elementor data found for post/page ID ${args.post_id}`
        );
      }
      
      // Parse current data
      let elementorData: any[];
      try {
        elementorData = JSON.parse(currentDataText);
      } catch (parseError) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Failed to parse current Elementor data: ${parseError}`
        );
      }
      
      let sectionFound = false;
      let updatedWidgets: string[] = [];
      
      // Function to recursively find section and update widgets
      const updateSectionWidgets = (elements: any[]): boolean => {
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          
          if (element.id === args.section_id) {
            sectionFound = true;
            // Found the section, now update widgets within it
            for (const widgetUpdate of args.widgets_updates) {
              const updated = updateWidgetInElements(element.elements || [], widgetUpdate);
              if (updated) {
                updatedWidgets.push(widgetUpdate.widget_id);
              }
            }
            return true;
          }
          
          // Recursively search in nested elements
          if (element.elements && element.elements.length > 0) {
            if (updateSectionWidgets(element.elements)) {
              return true;
            }
          }
        }
        return false;
      };
      
      // Helper function to update widget in elements array
      const updateWidgetInElements = (elements: any[], widgetUpdate: {widget_id: string; widget_settings?: object; widget_content?: string}): boolean => {
        for (const element of elements) {
          if (element.id === widgetUpdate.widget_id) {
            // Found the widget, update it
            if (widgetUpdate.widget_settings) {
              element.settings = { ...element.settings, ...widgetUpdate.widget_settings };
            }
            
            // Special handling for HTML widget content
            if (widgetUpdate.widget_content && element.widgetType === 'html') {
              element.settings.html = widgetUpdate.widget_content;
            }
            
            // Special handling for text widget content
            if (widgetUpdate.widget_content && element.widgetType === 'text-editor') {
              element.settings.editor = widgetUpdate.widget_content;
            }
            
            // Special handling for heading widget content
            if (widgetUpdate.widget_content && element.widgetType === 'heading') {
              element.settings.title = widgetUpdate.widget_content;
            }
            
            return true;
          }
          
          // Recursively search in nested elements
          if (element.elements && element.elements.length > 0) {
            if (updateWidgetInElements(element.elements, widgetUpdate)) {
              return true;
            }
          }
        }
        return false;
      };
      
      // Find section and update widgets
      updateSectionWidgets(elementorData);
      
      if (!sectionFound) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Section ID ${args.section_id} not found in Elementor data`
        );
      }
      
      // Update the page with modified data
      const updateData = {
        meta: {
          _elementor_data: JSON.stringify(elementorData),
          _elementor_edit_mode: 'builder',
        },
      };

      // Try to update as post first, then as page if that fails
      let response;
      let postType = 'post';
      
      try {
        response = await this.axiosInstance!.post(`posts/${args.post_id}`, updateData);
      } catch (postError: any) {
        if (postError.response?.status === 404) {
          // Try as page
          try {
            response = await this.axiosInstance!.post(`pages/${args.post_id}`, updateData);
            postType = 'page';
          } catch (pageError: any) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              `Post/Page ID ${args.post_id} not found in posts or pages`
            );
          }
        } else {
          throw postError;
        }
      }

      // Clear Elementor cache after updating data
      await this.clearElementorCache(args.post_id);
      
      return {
        content: [
          {
            type: 'text',
            text: `Elementor section ${args.section_id} updated successfully for ${postType} ID: ${args.post_id}.

Updated widgets: ${updatedWidgets.join(', ') || 'None'}
Widgets not found: ${args.widgets_updates.filter(w => !updatedWidgets.includes(w.widget_id)).map(w => w.widget_id).join(', ') || 'None'}

⚠️  IMPORTANT: MANUAL CACHE CLEARING REQUIRED
The Elementor cache has been programmatically cleared, but you may need to manually clear additional caches:

🔧 REQUIRED STEPS:
1. Go to WordPress Admin → Elementor → Tools → Regenerate CSS & Data
2. Click "Regenerate Files & Data" 
3. If using caching plugins, clear those caches too
4. Clear browser cache or use incognito/private browsing

🎯 VERIFICATION:
Visit the page to confirm changes are visible. If not, the cache clearing was incomplete.

✅ Section-level batch update completed.`,
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to update Elementor section: ${error.response?.data?.message || error.message}`
      );
    }
  }

  private async getElementorDataChunked(args: { post_id: number; chunk_size?: number; chunk_index?: number }) {
    this.ensureAuthenticated();
    
    try {
      // Get current Elementor data
      const currentElementorData = await this.getElementorData({ post_id: args.post_id });
      const currentDataText = currentElementorData.content[0].text;
      
      if (currentDataText.includes('No Elementor data found')) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `No Elementor data found for post/page ID ${args.post_id}`
        );
      }
      
      // Parse current data
      let elementorData: any[];
      try {
        elementorData = JSON.parse(currentDataText);
      } catch (parseError) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Failed to parse current Elementor data: ${parseError}`
        );
      }
      
      const chunkSize = args.chunk_size || 5;
      const chunkIndex = args.chunk_index || 0;
      const totalElements = elementorData.length;
      const totalChunks = Math.ceil(totalElements / chunkSize);
      
      const startIndex = chunkIndex * chunkSize;
      const endIndex = Math.min(startIndex + chunkSize, totalElements);
      
      if (chunkIndex >= totalChunks) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Chunk index ${chunkIndex} is out of range. Total chunks: ${totalChunks}`
        );
      }
      
      const chunk = elementorData.slice(startIndex, endIndex);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              post_id: args.post_id,
              chunk_info: {
                chunk_index: chunkIndex,
                chunk_size: chunkSize,
                total_chunks: totalChunks,
                total_elements: totalElements,
                elements_in_chunk: chunk.length,
                start_index: startIndex,
                end_index: endIndex - 1
              },
              chunk_data: chunk
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to get chunked Elementor data: ${error.response?.data?.message || error.message}`
      );
    }
  }

  private async backupElementorData(args: { post_id: number; backup_name?: string }) {
    this.ensureAuthenticated();
    
    try {
      // Get current Elementor data
      const currentElementorData = await this.getElementorData({ post_id: args.post_id });
      const currentDataText = currentElementorData.content[0].text;
      
      if (currentDataText.includes('No Elementor data found')) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `No Elementor data found for post/page ID ${args.post_id}`
        );
      }
      
      // Create backup metadata
      const timestamp = new Date().toISOString();
      const backupName = args.backup_name || `backup_${timestamp}`;
      
      // Try to get the post/page to determine type
      let postInfo;
      let postType = 'post';
      
      try {
        postInfo = await this.axiosInstance!.get(`posts/${args.post_id}`, {
          params: { context: 'edit' }
        });
      } catch (postError: any) {
        if (postError.response?.status === 404) {
          try {
            postInfo = await this.axiosInstance!.get(`pages/${args.post_id}`, {
              params: { context: 'edit' }
            });
            postType = 'page';
          } catch (pageError: any) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              `Post/Page ID ${args.post_id} not found in posts or pages`
            );
          }
        } else {
          throw postError;
        }
      }
      
      // Store backup in post meta with unique key
      const backupKey = `_elementor_data_backup_${Date.now()}`;
      const backupMeta = {
        meta: {
          [backupKey]: JSON.stringify({
            backup_name: backupName,
            timestamp: timestamp,
            post_id: args.post_id,
            post_type: postType,
            post_title: postInfo.data.title.rendered || postInfo.data.title.raw,
            elementor_data: currentDataText
          })
        }
      };
      
      // Save backup
      let response;
      if (postType === 'page') {
        response = await this.axiosInstance!.post(`pages/${args.post_id}`, backupMeta);
      } else {
        response = await this.axiosInstance!.post(`posts/${args.post_id}`, backupMeta);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Elementor data backup created successfully!

Backup Details:
- Post/Page ID: ${args.post_id}
- Post Type: ${postType}
- Post Title: ${postInfo.data.title.rendered || postInfo.data.title.raw}
- Backup Name: ${backupName}
- Backup Key: ${backupKey}
- Timestamp: ${timestamp}

💡 This backup is stored as meta data in the same post/page. You can restore it using the regular update_elementor_data tool with the backed up data if needed.

⚠️  Note: This backup method stores data in WordPress meta. For production use, consider implementing a dedicated backup system with external storage.`,
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to backup Elementor data: ${error.response?.data?.message || error.message}`
      );
    }
  }

  private async getMedia(args: { per_page?: number; media_type?: string }) {
    this.ensureAuthenticated();
    
    const params: any = {
      per_page: args.per_page || 10,
    };
    
    if (args.media_type) {
      params.media_type = args.media_type;
    }

    const response = await this.axiosInstance!.get('media', { params });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async uploadMedia(args: { file_path: string; title?: string; alt_text?: string }) {
    this.ensureAuthenticated();
    
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      if (!fs.existsSync(args.file_path)) {
        throw new McpError(ErrorCode.InvalidRequest, `File not found: ${args.file_path}`);
      }

      const formData = new FormData();
      const fileStream = fs.createReadStream(args.file_path);
      const fileName = path.basename(args.file_path);
      
      formData.append('file', fileStream, fileName);
      
      if (args.title) {
        formData.append('title', args.title);
      }
      
      if (args.alt_text) {
        formData.append('alt_text', args.alt_text);
      }

      const response = await this.axiosInstance!.post('media', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `Media uploaded successfully!\nID: ${response.data.id}\nURL: ${response.data.source_url}\nTitle: ${response.data.title.rendered}`,
          },
        ],
      };
    } catch (error: any) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to upload media: ${error.response?.data?.message || error.message}`
      );
    }
  }

  // Section and Container Creation Tools
  private async createElementorSection(args: { post_id: number; position?: number; columns?: number; section_settings?: object }) {
    this.ensureAuthenticated();
    
    try {
      // Get current Elementor data
      const currentElementorData = await this.getElementorData({ post_id: args.post_id });
      const currentDataText = currentElementorData.content[0].text;
      
      let elementorData: any[] = [];
      if (!currentDataText.includes('No Elementor data found')) {
        try {
          elementorData = JSON.parse(currentDataText);
        } catch (parseError) {
          elementorData = [];
        }
      }
      
      // Generate unique ID for the section
      const sectionId = Math.random().toString(36).substr(2, 8);
      const columns = args.columns || 1;
      
      // Create column elements
      const columnElements = [];
      for (let i = 0; i < columns; i++) {
        const columnId = Math.random().toString(36).substr(2, 8);
        columnElements.push({
          id: columnId,
          elType: 'column',
          isInner: false,
          settings: {
            _column_size: Math.floor(100 / columns),
            _inline_size: null
          },
          elements: [],
          widgetType: null
        });
      }
      
      // Create new section
      const newSection = {
        id: sectionId,
        elType: 'section',
        isInner: false,
        settings: args.section_settings || {},
        elements: columnElements,
        widgetType: null
      };
      
      // Insert section at specified position or at the end
      if (args.position !== undefined && args.position >= 0 && args.position < elementorData.length) {
        elementorData.splice(args.position, 0, newSection);
      } else {
        elementorData.push(newSection);
      }
      
      // Update the page
      await this.updateElementorData({
        post_id: args.post_id,
        elementor_data: JSON.stringify(elementorData)
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `Section created successfully! Section ID: ${sectionId}\nColumns: ${columns}\nPosition: ${args.position || 'end'}`,
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to create section: ${error.message}`
      );
    }
  }

  private async createElementorContainer(args: { post_id: number; position?: number; container_settings?: object }) {
    this.ensureAuthenticated();
    
    try {
      // Get current Elementor data
      const currentElementorData = await this.getElementorData({ post_id: args.post_id });
      const currentDataText = currentElementorData.content[0].text;
      
      let elementorData: any[] = [];
      if (!currentDataText.includes('No Elementor data found')) {
        try {
          elementorData = JSON.parse(currentDataText);
        } catch (parseError) {
          elementorData = [];
        }
      }
      
      // Generate unique ID for the container
      const containerId = Math.random().toString(36).substr(2, 8);
      
      // Create new container (Elementor v3.6+ flexbox container)
      const newContainer = {
        id: containerId,
        elType: 'container',
        isInner: false,
        settings: {
          content_width: 'boxed',
          flex_direction: 'column',
          ...args.container_settings
        },
        elements: [],
        widgetType: null
      };
      
      // Insert container at specified position or at the end
      if (args.position !== undefined && args.position >= 0 && args.position < elementorData.length) {
        elementorData.splice(args.position, 0, newContainer);
      } else {
        elementorData.push(newContainer);
      }
      
      // Update the page
      await this.updateElementorData({
        post_id: args.post_id,
        elementor_data: JSON.stringify(elementorData)
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `Container created successfully! Container ID: ${containerId}\nPosition: ${args.position || 'end'}`,
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to create container: ${error.message}`
      );
    }
  }

  private async addColumnToSection(args: { post_id: number; section_id: string; columns_to_add?: number }) {
    this.ensureAuthenticated();
    
    try {
      // Get current Elementor data
      const currentElementorData = await this.getElementorData({ post_id: args.post_id });
      const currentDataText = currentElementorData.content[0].text;
      
      if (currentDataText.includes('No Elementor data found')) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `No Elementor data found for post/page ID ${args.post_id}`
        );
      }
      
      let elementorData: any[];
      try {
        elementorData = JSON.parse(currentDataText);
      } catch (parseError) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Failed to parse current Elementor data: ${parseError}`
        );
      }
      
      const columnsToAdd = args.columns_to_add || 1;
      let sectionFound = false;
      
      // Function to find and update section
      const findAndUpdateSection = (elements: any[]): boolean => {
        for (let element of elements) {
          if (element.id === args.section_id && element.elType === 'section') {
            // Add new columns
            for (let i = 0; i < columnsToAdd; i++) {
              const columnId = Math.random().toString(36).substr(2, 8);
              element.elements.push({
                id: columnId,
                elType: 'column',
                isInner: false,
                settings: {},
                elements: [],
                widgetType: null
              });
            }
            return true;
          }
          
          if (element.elements && element.elements.length > 0) {
            if (findAndUpdateSection(element.elements)) {
              return true;
            }
          }
        }
        return false;
      };
      
      sectionFound = findAndUpdateSection(elementorData);
      
      if (!sectionFound) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Section ID ${args.section_id} not found`
        );
      }
      
      // Update the page
      await this.updateElementorData({
        post_id: args.post_id,
        elementor_data: JSON.stringify(elementorData)
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `Successfully added ${columnsToAdd} column(s) to section ${args.section_id}`,
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to add columns to section: ${error.message}`
      );
    }
  }

  private async duplicateSection(args: { post_id: number; section_id: string; position?: number }) {
    this.ensureAuthenticated();
    
    try {
      // Get current Elementor data
      const currentElementorData = await this.getElementorData({ post_id: args.post_id });
      const currentDataText = currentElementorData.content[0].text;
      
      if (currentDataText.includes('No Elementor data found')) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `No Elementor data found for post/page ID ${args.post_id}`
        );
      }
      
      let elementorData: any[];
      try {
        elementorData = JSON.parse(currentDataText);
      } catch (parseError) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Failed to parse current Elementor data: ${parseError}`
        );
      }
      
      let sectionToDuplicate: any = null;
      let insertIndex = elementorData.length;
      
      // Find the section to duplicate
      for (let i = 0; i < elementorData.length; i++) {
        if (elementorData[i].id === args.section_id && elementorData[i].elType === 'section') {
          sectionToDuplicate = JSON.parse(JSON.stringify(elementorData[i])); // Deep copy
          insertIndex = args.position !== undefined ? args.position : i + 1;
          break;
        }
      }
      
      if (!sectionToDuplicate) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Section ID ${args.section_id} not found`
        );
      }
      
      // Generate new IDs for the duplicated section and all its children
      const generateNewIds = (element: any): void => {
        element.id = Math.random().toString(36).substr(2, 8);
        if (element.elements) {
          element.elements.forEach(generateNewIds);
        }
      };
      
      generateNewIds(sectionToDuplicate);
      
      // Insert the duplicated section
      elementorData.splice(insertIndex, 0, sectionToDuplicate);
      
      // Update the page
      await this.updateElementorData({
        post_id: args.post_id,
        elementor_data: JSON.stringify(elementorData)
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `Section duplicated successfully! New section ID: ${sectionToDuplicate.id}\nInserted at position: ${insertIndex}`,
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to duplicate section: ${error.message}`
      );
    }
  }

  // Widget Addition Tools
  private async addWidgetToSection(args: { post_id: number; section_id?: string; column_id?: string; widget_type: string; widget_settings?: object; position?: number }) {
    this.ensureAuthenticated();
    
    try {
      // Get current Elementor data
      const currentElementorData = await this.getElementorData({ post_id: args.post_id });
      const currentDataText = currentElementorData.content[0].text;
      
      if (currentDataText.includes('No Elementor data found')) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `No Elementor data found for post/page ID ${args.post_id}`
        );
      }
      
      let elementorData: any[];
      try {
        elementorData = JSON.parse(currentDataText);
      } catch (parseError) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Failed to parse current Elementor data: ${parseError}`
        );
      }
      
      // Generate unique ID for the widget
      const widgetId = Math.random().toString(36).substr(2, 8);
      
      // Create new widget
      const newWidget = {
        id: widgetId,
        elType: 'widget',
        widgetType: args.widget_type,
        isInner: false,
        settings: args.widget_settings || {},
        elements: []
      };
      
      let targetFound = false;
      
      // Function to find target container and add widget
      const findAndAddWidget = (elements: any[]): boolean => {
        for (let element of elements) {
          // If column_id is specified, look for that specific column
          if (args.column_id && element.id === args.column_id && element.elType === 'column') {
            if (args.position !== undefined && args.position >= 0 && args.position < element.elements.length) {
              element.elements.splice(args.position, 0, newWidget);
            } else {
              element.elements.push(newWidget);
            }
            return true;
          }
          
          // If section_id is specified, add to first column of that section
          if (args.section_id && element.id === args.section_id && element.elType === 'section') {
            if (element.elements && element.elements.length > 0) {
              const firstColumn = element.elements[0];
              if (args.position !== undefined && args.position >= 0 && args.position < firstColumn.elements.length) {
                firstColumn.elements.splice(args.position, 0, newWidget);
              } else {
                firstColumn.elements.push(newWidget);
              }
              return true;
            }
          }
          
          // If no specific target, add to first available column
          if (!args.section_id && !args.column_id && element.elType === 'column') {
            element.elements.push(newWidget);
            return true;
          }
          
          // Recursively search
          if (element.elements && element.elements.length > 0) {
            if (findAndAddWidget(element.elements)) {
              return true;
            }
          }
        }
        return false;
      };
      
      targetFound = findAndAddWidget(elementorData);
      
      if (!targetFound) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Target container not found (section_id: ${args.section_id}, column_id: ${args.column_id})`
        );
      }
      
      // Update the page
      await this.updateElementorData({
        post_id: args.post_id,
        elementor_data: JSON.stringify(elementorData)
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `Widget added successfully! Widget ID: ${widgetId}\nWidget Type: ${args.widget_type}\nPosition: ${args.position || 'end'}`,
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to add widget: ${error.message}`
      );
    }
  }

  private async insertWidgetAtPosition(args: { post_id: number; widget_type: string; widget_settings?: object; target_element_id: string; insert_position?: string }) {
    this.ensureAuthenticated();
    
    try {
      // Get current Elementor data
      const currentElementorData = await this.getElementorData({ post_id: args.post_id });
      const currentDataText = currentElementorData.content[0].text;
      
      if (currentDataText.includes('No Elementor data found')) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `No Elementor data found for post/page ID ${args.post_id}`
        );
      }
      
      let elementorData: any[];
      try {
        elementorData = JSON.parse(currentDataText);
      } catch (parseError) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Failed to parse current Elementor data: ${parseError}`
        );
      }
      
      // Generate unique ID for the widget
      const widgetId = Math.random().toString(36).substr(2, 8);
      
      // Create new widget
      const newWidget = {
        id: widgetId,
        elType: 'widget',
        widgetType: args.widget_type,
        isInner: false,
        settings: args.widget_settings || {},
        elements: []
      };
      
      let targetFound = false;
      
      // Function to find target element and insert widget
      const findAndInsertWidget = (elements: any[], parent: any): boolean => {
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          
          if (element.id === args.target_element_id) {
            const insertIndex = args.insert_position === 'before' ? i : i + 1;
            parent.elements.splice(insertIndex, 0, newWidget);
            return true;
          }
          
          if (element.elements && element.elements.length > 0) {
            if (findAndInsertWidget(element.elements, element)) {
              return true;
            }
          }
        }
        return false;
      };
      
      // Create a mock parent for top-level elements
      const mockParent = { elements: elementorData };
      targetFound = findAndInsertWidget(elementorData, mockParent);
      
      if (!targetFound) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Target element ID ${args.target_element_id} not found`
        );
      }
      
      // Update the page
      await this.updateElementorData({
        post_id: args.post_id,
        elementor_data: JSON.stringify(elementorData)
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `Widget inserted successfully! Widget ID: ${widgetId}\nWidget Type: ${args.widget_type}\nInserted ${args.insert_position || 'after'} element: ${args.target_element_id}`,
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to insert widget: ${error.message}`
      );
    }
  }

  private async cloneWidget(args: { post_id: number; widget_id: string; target_element_id?: string; insert_position?: string }) {
    this.ensureAuthenticated();
    
    try {
      // Get current Elementor data
      const currentElementorData = await this.getElementorData({ post_id: args.post_id });
      const currentDataText = currentElementorData.content[0].text;
      
      if (currentDataText.includes('No Elementor data found')) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `No Elementor data found for post/page ID ${args.post_id}`
        );
      }
      
      let elementorData: any[];
      try {
        elementorData = JSON.parse(currentDataText);
      } catch (parseError) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Failed to parse current Elementor data: ${parseError}`
        );
      }
      
      let widgetToClone: any = null;
      
      // Function to find widget to clone
      const findWidget = (elements: any[]): any => {
        for (let element of elements) {
          if (element.id === args.widget_id) {
            return JSON.parse(JSON.stringify(element)); // Deep copy
          }
          
          if (element.elements && element.elements.length > 0) {
            const found = findWidget(element.elements);
            if (found) return found;
          }
        }
        return null;
      };
      
      widgetToClone = findWidget(elementorData);
      
      if (!widgetToClone) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Widget ID ${args.widget_id} not found`
        );
      }
      
      // Generate new ID for cloned widget
      const generateNewIds = (element: any): void => {
        element.id = Math.random().toString(36).substr(2, 8);
        if (element.elements) {
          element.elements.forEach(generateNewIds);
        }
      };
      
      generateNewIds(widgetToClone);
      
      // Insert cloned widget
      if (args.target_element_id) {
        // Insert at specific position
        let targetFound = false;
        
        const findAndInsertWidget = (elements: any[], parent: any): boolean => {
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            
            if (element.id === args.target_element_id) {
              const insertIndex = args.insert_position === 'before' ? i : i + 1;
              parent.elements.splice(insertIndex, 0, widgetToClone);
              return true;
            }
            
            if (element.elements && element.elements.length > 0) {
              if (findAndInsertWidget(element.elements, element)) {
                return true;
              }
            }
          }
          return false;
        };
        
        const mockParent = { elements: elementorData };
        targetFound = findAndInsertWidget(elementorData, mockParent);
        
        if (!targetFound) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            `Target element ID ${args.target_element_id} not found`
          );
        }
      } else {
        // Add to first available column
        const findFirstColumn = (elements: any[]): boolean => {
          for (let element of elements) {
            if (element.elType === 'column') {
              element.elements.push(widgetToClone);
              return true;
            }
            
            if (element.elements && element.elements.length > 0) {
              if (findFirstColumn(element.elements)) {
                return true;
              }
            }
          }
          return false;
        };
        
        if (!findFirstColumn(elementorData)) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'No column found to place cloned widget'
          );
        }
      }
      
      // Update the page
      await this.updateElementorData({
        post_id: args.post_id,
        elementor_data: JSON.stringify(elementorData)
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `Widget cloned successfully! New widget ID: ${widgetToClone.id}\nOriginal widget ID: ${args.widget_id}`,
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to clone widget: ${error.message}`
      );
    }
  }

  private async moveWidget(args: { post_id: number; widget_id: string; target_section_id?: string; target_column_id?: string; position?: number }) {
    this.ensureAuthenticated();
    
    try {
      // Get current Elementor data
      const currentElementorData = await this.getElementorData({ post_id: args.post_id });
      const currentDataText = currentElementorData.content[0].text;
      
      if (currentDataText.includes('No Elementor data found')) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `No Elementor data found for post/page ID ${args.post_id}`
        );
      }
      
      let elementorData: any[];
      try {
        elementorData = JSON.parse(currentDataText);
      } catch (parseError) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Failed to parse current Elementor data: ${parseError}`
        );
      }
      
      let widgetToMove: any = null;
      
      // Function to find and remove widget
      const findAndRemoveWidget = (elements: any[]): boolean => {
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          
          if (element.id === args.widget_id) {
            widgetToMove = elements.splice(i, 1)[0];
            return true;
          }
          
          if (element.elements && element.elements.length > 0) {
            if (findAndRemoveWidget(element.elements)) {
              return true;
            }
          }
        }
        return false;
      };
      
      if (!findAndRemoveWidget(elementorData)) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Widget ID ${args.widget_id} not found`
        );
      }
      
      // Function to find target and add widget
      const findTargetAndAddWidget = (elements: any[]): boolean => {
        for (let element of elements) {
          // If column_id is specified, look for that specific column
          if (args.target_column_id && element.id === args.target_column_id && element.elType === 'column') {
            if (args.position !== undefined && args.position >= 0 && args.position < element.elements.length) {
              element.elements.splice(args.position, 0, widgetToMove);
            } else {
              element.elements.push(widgetToMove);
            }
            return true;
          }
          
          // If section_id is specified, add to first column of that section
          if (args.target_section_id && element.id === args.target_section_id && element.elType === 'section') {
            if (element.elements && element.elements.length > 0) {
              const firstColumn = element.elements[0];
              if (args.position !== undefined && args.position >= 0 && args.position < firstColumn.elements.length) {
                firstColumn.elements.splice(args.position, 0, widgetToMove);
              } else {
                firstColumn.elements.push(widgetToMove);
              }
              return true;
            }
          }
          
          if (element.elements && element.elements.length > 0) {
            if (findTargetAndAddWidget(element.elements)) {
              return true;
            }
          }
        }
        return false;
      };
      
      if (!findTargetAndAddWidget(elementorData)) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Target container not found (section_id: ${args.target_section_id}, column_id: ${args.target_column_id})`
        );
      }
      
      // Update the page
      await this.updateElementorData({
        post_id: args.post_id,
        elementor_data: JSON.stringify(elementorData)
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `Widget moved successfully! Widget ID: ${args.widget_id}\nMoved to: ${args.target_column_id || args.target_section_id}\nPosition: ${args.position || 'end'}`,
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to move widget: ${error.message}`
      );
    }
  }

  // Element Management Tools
  private async deleteElementorElement(args: { post_id: number; element_id: string }) {
    this.ensureAuthenticated();
    
    try {
      // Get current Elementor data
      const currentElementorData = await this.getElementorData({ post_id: args.post_id });
      const currentDataText = currentElementorData.content[0].text;
      
      if (currentDataText.includes('No Elementor data found')) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `No Elementor data found for post/page ID ${args.post_id}`
        );
      }
      
      let elementorData: any[];
      try {
        elementorData = JSON.parse(currentDataText);
      } catch (parseError) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Failed to parse current Elementor data: ${parseError}`
        );
      }
      
      let elementDeleted = false;
      
      // Function to find and delete element
      const findAndDeleteElement = (elements: any[]): boolean => {
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          
          if (element.id === args.element_id) {
            elements.splice(i, 1);
            return true;
          }
          
          if (element.elements && element.elements.length > 0) {
            if (findAndDeleteElement(element.elements)) {
              return true;
            }
          }
        }
        return false;
      };
      
      elementDeleted = findAndDeleteElement(elementorData);
      
      if (!elementDeleted) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Element ID ${args.element_id} not found`
        );
      }
      
      // Update the page
      await this.updateElementorData({
        post_id: args.post_id,
        elementor_data: JSON.stringify(elementorData)
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `Element deleted successfully! Element ID: ${args.element_id}`,
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to delete element: ${error.message}`
      );
    }
  }

  private async reorderElements(args: { post_id: number; container_id: string; element_ids: string[] }) {
    this.ensureAuthenticated();
    
    try {
      // Get current Elementor data
      const currentElementorData = await this.getElementorData({ post_id: args.post_id });
      const currentDataText = currentElementorData.content[0].text;
      
      if (currentDataText.includes('No Elementor data found')) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `No Elementor data found for post/page ID ${args.post_id}`
        );
      }
      
      let elementorData: any[];
      try {
        elementorData = JSON.parse(currentDataText);
      } catch (parseError) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Failed to parse current Elementor data: ${parseError}`
        );
      }
      
      let containerFound = false;
      
      // Function to find container and reorder elements
      const findAndReorderElements = (elements: any[]): boolean => {
        for (let element of elements) {
          if (element.id === args.container_id) {
            const oldElements = [...element.elements];
            const newElements: any[] = [];
            
            // Reorder according to provided array
            for (let elementId of args.element_ids) {
              const foundElement = oldElements.find(el => el.id === elementId);
              if (foundElement) {
                newElements.push(foundElement);
              }
            }
            
            // Add any elements that weren't in the reorder list
            for (let oldElement of oldElements) {
              if (!args.element_ids.includes(oldElement.id)) {
                newElements.push(oldElement);
              }
            }
            
            element.elements = newElements;
            return true;
          }
          
          if (element.elements && element.elements.length > 0) {
            if (findAndReorderElements(element.elements)) {
              return true;
            }
          }
        }
        return false;
      };
      
      containerFound = findAndReorderElements(elementorData);
      
      if (!containerFound) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Container ID ${args.container_id} not found`
        );
      }
      
      // Update the page
      await this.updateElementorData({
        post_id: args.post_id,
        elementor_data: JSON.stringify(elementorData)
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `Elements reordered successfully in container: ${args.container_id}`,
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to reorder elements: ${error.message}`
      );
    }
  }

  private async copyElementSettings(args: { post_id: number; source_element_id: string; target_element_id: string; settings_to_copy?: string[] }) {
    this.ensureAuthenticated();
    
    try {
      // Get current Elementor data
      const currentElementorData = await this.getElementorData({ post_id: args.post_id });
      const currentDataText = currentElementorData.content[0].text;
      
      if (currentDataText.includes('No Elementor data found')) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `No Elementor data found for post/page ID ${args.post_id}`
        );
      }
      
      let elementorData: any[];
      try {
        elementorData = JSON.parse(currentDataText);
      } catch (parseError) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Failed to parse current Elementor data: ${parseError}`
        );
      }
      
      let sourceElement: any = null;
      let targetElement: any = null;
      
      // Function to find elements
      const findElement = (elements: any[], elementId: string): any => {
        for (let element of elements) {
          if (element.id === elementId) {
            return element;
          }
          
          if (element.elements && element.elements.length > 0) {
            const found = findElement(element.elements, elementId);
            if (found) return found;
          }
        }
        return null;
      };
      
      sourceElement = findElement(elementorData, args.source_element_id);
      targetElement = findElement(elementorData, args.target_element_id);
      
      if (!sourceElement) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Source element ID ${args.source_element_id} not found`
        );
      }
      
      if (!targetElement) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Target element ID ${args.target_element_id} not found`
        );
      }
      
      // Copy settings
      if (args.settings_to_copy && args.settings_to_copy.length > 0) {
        // Copy specific settings
        for (let setting of args.settings_to_copy) {
          if (sourceElement.settings && sourceElement.settings[setting] !== undefined) {
            if (!targetElement.settings) targetElement.settings = {};
            targetElement.settings[setting] = JSON.parse(JSON.stringify(sourceElement.settings[setting]));
          }
        }
      } else {
        // Copy all settings
        targetElement.settings = JSON.parse(JSON.stringify(sourceElement.settings || {}));
      }
      
      // Update the page
      await this.updateElementorData({
        post_id: args.post_id,
        elementor_data: JSON.stringify(elementorData)
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `Settings copied successfully from ${args.source_element_id} to ${args.target_element_id}`,
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to copy element settings: ${error.message}`
      );
    }
  }

  // Page Structure Tools
  private async getPageStructure(args: { post_id: number; include_settings?: boolean }) {
    this.ensureAuthenticated();
    
    try {
      // Get current Elementor data
      const currentElementorData = await this.getElementorData({ post_id: args.post_id });
      const currentDataText = currentElementorData.content[0].text;
      
      if (currentDataText.includes('No Elementor data found')) {
        return {
          content: [
            {
              type: 'text',
              text: `No Elementor data found for post/page ID ${args.post_id}`,
            },
          ],
        };
      }
      
      let elementorData: any[];
      try {
        elementorData = JSON.parse(currentDataText);
      } catch (parseError) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Failed to parse Elementor data: ${parseError}`
        );
      }
      
      // Function to extract structure
      const extractStructure = (elements: any[], level = 0): any[] => {
        return elements.map(element => {
          const structure: any = {
            id: element.id,
            type: element.elType,
            widgetType: element.widgetType || null,
            level: level
          };
          
          if (args.include_settings && element.settings) {
            structure.settings = element.settings;
          }
          
          if (element.elements && element.elements.length > 0) {
            structure.children = extractStructure(element.elements, level + 1);
          }
          
          return structure;
        });
      };
      
      const structure = extractStructure(elementorData);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(structure, null, 2),
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to get page structure: ${error.message}`
      );
    }
  }

  // Performance & Optimization
  private async clearElementorCacheByPage(args: { post_id: number }) {
    this.ensureAuthenticated();
    
    try {
      await this.clearElementorCache(args.post_id);
      
      return {
        content: [
          {
            type: 'text',
            text: `Cache cleared successfully for post/page ID: ${args.post_id}`,
          },
        ],
      };
    } catch (error: any) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to clear cache: ${error.message}`
      );
    }
  }

  // Advanced Element Operations
  private async findElementsByType(args: { post_id: number; widget_type: string; include_settings?: boolean }) {
    this.ensureAuthenticated();
    
    try {
      // Get current Elementor data
      const currentElementorData = await this.getElementorData({ post_id: args.post_id });
      const currentDataText = currentElementorData.content[0].text;
      
      if (currentDataText.includes('No Elementor data found')) {
        return {
          content: [
            {
              type: 'text',
              text: `No Elementor data found for post/page ID ${args.post_id}`,
            },
          ],
        };
      }
      
      let elementorData: any[];
      try {
        elementorData = JSON.parse(currentDataText);
      } catch (parseError) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Failed to parse Elementor data: ${parseError}`
        );
      }
      
      const foundElements: any[] = [];
      
      // Function to find elements by type
      const findElementsByTypeRecursive = (elements: any[]): void => {
        for (let element of elements) {
          if (element.widgetType === args.widget_type) {
            const result: any = {
              id: element.id,
              widgetType: element.widgetType
            };
            
            if (args.include_settings && element.settings) {
              result.settings = element.settings;
            }
            
            foundElements.push(result);
          }
          
          if (element.elements && element.elements.length > 0) {
            findElementsByTypeRecursive(element.elements);
          }
        }
      };
      
      findElementsByTypeRecursive(elementorData);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(foundElements, null, 2),
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to find elements by type: ${error.message}`
      );
    }
  }

  // Template Management (Requires Elementor Pro)
  private async createElementorTemplate(args: any) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Template management requires Elementor Pro API access. This feature is not available in the free version.',
        },
      ],
    };
  }

  private async applyTemplateToPage(args: any) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Template management requires Elementor Pro API access. This feature is not available in the free version.',
        },
      ],
    };
  }

  private async exportElementorTemplate(args: any) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Template management requires Elementor Pro API access. This feature is not available in the free version.',
        },
      ],
    };
  }

  private async importElementorTemplate(args: any) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Template management requires Elementor Pro API access. This feature is not available in the free version.',
        },
      ],
    };
  }

  // Global Settings (Requires Elementor Pro)
  private async getElementorGlobalColors(args: any) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Global settings require Elementor Pro API access. This feature is not available in the free version.',
        },
      ],
    };
  }

  private async updateElementorGlobalColors(args: any) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Global settings require Elementor Pro API access. This feature is not available in the free version.',
        },
      ],
    };
  }

  private async getElementorGlobalFonts(args: any) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Global settings require Elementor Pro API access. This feature is not available in the free version.',
        },
      ],
    };
  }

  private async updateElementorGlobalFonts(args: any) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Global settings require Elementor Pro API access. This feature is not available in the free version.',
        },
      ],
    };
  }

  // Advanced Operations (Not Yet Implemented)
  private async rebuildPageStructure(args: any) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Page structure rebuilding is a complex operation not yet implemented. Please use individual element manipulation tools instead.',
        },
      ],
    };
  }

  private async validateElementorData(args: any) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Data validation not yet implemented. Please check data manually using get_elementor_data.',
        },
      ],
    };
  }

  private async regenerateCSS(args: any) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: CSS regeneration requires direct server access. Please use the Elementor admin interface: Elementor → Tools → Regenerate CSS & Data.',
        },
      ],
    };
  }

  private async optimizeElementorAssets(args: any) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Asset optimization requires direct server access. Please use WordPress optimization plugins or the Elementor admin interface.',
        },
      ],
    };
  }

  private async bulkUpdateWidgetSettings(args: any) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Bulk widget updates not yet implemented. Please use individual widget update tools or find_elements_by_type to identify widgets first.',
        },
      ],
    };
  }

  private async replaceWidgetContent(args: any) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Widget content replacement not yet implemented. Please use individual widget update tools.',
        },
      ],
    };
  }

  private async getElementorCustomFields(args: any) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Custom fields integration not yet implemented. Please use WordPress REST API to access custom fields directly.',
        },
      ],
    };
  }

  private async updateDynamicContentSources(args: any) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Dynamic content management not yet implemented. Please update widget settings manually with dynamic field configurations.',
        },
      ],
    };
  }

  private async getElementorRevisions(args: any) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Revision management not yet implemented. Please use WordPress admin interface to access revisions.',
        },
      ],
    };
  }

  private async restoreElementorRevision(args: any) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Revision management not yet implemented. Please use WordPress admin interface to restore revisions.',
        },
      ],
    };
  }

  private async compareElementorRevisions(args: any) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Revision management not yet implemented. Please use WordPress admin interface to compare revisions.',
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Elementor WordPress MCP server running on stdio');
  }
}

const server = new ElementorWordPressMCP();
server.run().catch(console.error); 