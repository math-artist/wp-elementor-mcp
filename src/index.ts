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

interface WordPressConfig {
  baseUrl: string;
  username: string;
  applicationPassword: string;
}

class ElementorWordPressMCP {
  private server: Server;
  private axiosInstance: AxiosInstance | null = null;
  private config: WordPressConfig | null = null;

  constructor() {
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
    this.axiosInstance = axios.create({
      baseURL: `${config.baseUrl}/wp-json/wp/v2/`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });
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
      return {
        tools: [
          {
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
          },
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
            name: 'get_elementor_templates',
            description: 'Get Elementor templates (requires Elementor Pro)',
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
            description: 'Get Elementor page/post data',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID to get Elementor data for',
                },
              },
              required: ['post_id'],
            },
          },
          {
            name: 'update_elementor_data',
            description: 'Update Elementor page/post data',
            inputSchema: {
              type: 'object',
              properties: {
                post_id: {
                  type: 'number',
                  description: 'Post/Page ID to update',
                },
                elementor_data: {
                  type: 'string',
                  description: 'Elementor JSON data as string',
                },
              },
              required: ['post_id', 'elementor_data'],
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
          },
        ],
      };
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
          case 'get_media':
            return await this.getMedia(args as any);
          case 'upload_media':
            return await this.uploadMedia(args as any);
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
    };
    
    if (args.search) {
      params.search = args.search;
    }

    const response = await this.axiosInstance!.get('posts', { params });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
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
    
    return {
      content: [
        {
          type: 'text',
          text: `Post created successfully!\nID: ${response.data.id}\nTitle: ${response.data.title.rendered}\nStatus: ${response.data.status}\nURL: ${response.data.link}`,
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
    
    return {
      content: [
        {
          type: 'text',
          text: `Post updated successfully!\nID: ${response.data.id}\nTitle: ${response.data.title.rendered}\nStatus: ${response.data.status}`,
        },
      ],
    };
  }

  private async getPages(args: { per_page?: number; status?: string }) {
    this.ensureAuthenticated();
    
    const params = {
      per_page: args.per_page || 10,
      status: args.status || 'publish',
    };

    const response = await this.axiosInstance!.get('pages', { params });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
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
    
    return {
      content: [
        {
          type: 'text',
          text: `Page created successfully!\nID: ${response.data.id}\nTitle: ${response.data.title.rendered}\nStatus: ${response.data.status}\nURL: ${response.data.link}`,
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
    
    return {
      content: [
        {
          type: 'text',
          text: `Page updated successfully!\nID: ${response.data.id}\nTitle: ${response.data.title.rendered}\nStatus: ${response.data.status}`,
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
      // Try to get as post first, then as page if that fails
      let response;
      let postType = 'post';
      
      try {
        response = await this.axiosInstance!.get(`posts/${args.post_id}`, {
          params: { context: 'edit' }
        });
      } catch (postError: any) {
        if (postError.response?.status === 404) {
          // Try as page
          try {
            response = await this.axiosInstance!.get(`pages/${args.post_id}`, {
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
      
      // Try to get Elementor data from meta
      const elementorData = response.data.meta?._elementor_data;
      
      return {
        content: [
          {
            type: 'text',
            text: elementorData 
              ? JSON.stringify(JSON.parse(elementorData), null, 2)
              : `No Elementor data found for this ${postType} (ID: ${args.post_id}).`,
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to get Elementor data: ${error.response?.data?.message || error.message}`
      );
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
      
      return {
        content: [
          {
            type: 'text',
            text: `Elementor data updated successfully for ${postType} ID: ${args.post_id}`,
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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Elementor WordPress MCP server running on stdio');
  }
}

const server = new ElementorWordPressMCP();
server.run().catch(console.error); 