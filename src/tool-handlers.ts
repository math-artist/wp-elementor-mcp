import { WordPressClient } from './wordpress-client.js';
import { ElementorDataHandler } from './elementor-handler.js';
import { getServerConfig, ServerConfig } from './server-config.js';
import { ResponseHelpers, ElementorHelpers } from './helpers.js';
import FormData from 'form-data';

export class ToolHandlers {
  private elementorHandler: ElementorDataHandler;
  private serverConfig: ServerConfig;

  constructor(
    private wordPressClient: WordPressClient
  ) {
    this.elementorHandler = new ElementorDataHandler(wordPressClient);
    this.serverConfig = getServerConfig();
  }

  async handleToolCall(name: string, args: any): Promise<any> {
    try {
      switch (name) {
        // WordPress Basic Operations
        case 'get_posts':
          return await this.getPosts(args);
        case 'get_post':
          return await this.getPost(args);
        case 'create_post':
          return await this.createPost(args);
        case 'update_post':
          return await this.updatePost(args);
        case 'get_pages':
          return await this.getPages(args);
        case 'list_all_content':
          return await this.listAllContent(args);
        case 'create_page':
          return await this.createPage(args);
        case 'update_page':
          return await this.updatePage(args);

        // Media Operations
        case 'get_media':
          return await this.getMedia(args);
        case 'upload_media':
          return await this.uploadMedia(args);

        // Elementor Basic Operations
        case 'get_elementor_templates':
          return await this.getElementorTemplates(args);
        case 'get_elementor_data':
          return await this.getElementorData(args);
        case 'update_elementor_data':
          return await this.updateElementorData(args);
        case 'update_elementor_widget':
          return await this.updateElementorWidget(args);
        case 'get_elementor_widget':
          return await this.getElementorWidget(args);
        case 'get_elementor_elements':
          return await this.getElementorElements(args);
        case 'update_elementor_section':
          return await this.updateElementorSection(args);
        case 'get_elementor_data_chunked':
          return await this.getElementorDataChunked(args);
        case 'backup_elementor_data':
          return await this.backupElementorData(args);

        // NEW: Temp file operations
        case 'get_elementor_data_to_file':
          return await this.elementorHandler.getElementorDataToFile(args);
        case 'get_page_structure_to_file':
          return await this.elementorHandler.getPageStructureToFile(args);
        case 'backup_elementor_data_to_file':
          return await this.elementorHandler.backupElementorDataToFile(args);

        // Section and Container Creation Tools
        case 'create_elementor_section':
          return await this.createElementorSection(args);
        case 'create_elementor_container':
          return await this.createElementorContainer(args);
        case 'add_column_to_section':
          return await this.addColumnToSection(args);
        case 'duplicate_section':
          return await this.duplicateSection(args);

        // Widget Addition Tools
        case 'add_widget_to_section':
          return await this.addWidgetToSection(args);
        case 'insert_widget_at_position':
          return await this.insertWidgetAtPosition(args);
        case 'clone_widget':
          return await this.cloneWidget(args);
        case 'move_widget':
          return await this.moveWidget(args);

        // Element Management Tools
        case 'delete_elementor_element':
          return await this.deleteElementorElement(args);
        case 'reorder_elements':
          return await this.reorderElements(args);
        case 'copy_element_settings':
          return await this.copyElementSettings(args);

        // Page Structure Tools
        case 'get_page_structure':
          return await this.getPageStructure(args);
        case 'rebuild_page_structure':
          return await this.rebuildPageStructure(args);
        case 'validate_elementor_data':
          return await this.validateElementorData(args);

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error: any) {
      console.error(`❌ Tool execution failed for ${name}: ${error.message}`);
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }],
        isError: true
      };
    }
  }

  // WordPress Basic Operations
  private async getPosts(args: { per_page?: number; status?: string; search?: string }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    const params: any = {
      per_page: args.per_page || 10,
      status: args.status || 'publish',
      context: 'edit'
    };
    
    if (args.search) {
      params.search = args.search;
    }

    try {
      console.error(`Fetching posts with params: ${JSON.stringify(params)}`);
      const axios = this.wordPressClient.getAxiosInstance();
      const response = await axios.get('posts', { params });
      
      const posts = response.data;
      let debugInfo = `Found ${posts.length} posts\n`;
      
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
      
      return ResponseHelpers.createSuccessResponse(
        {
          posts: posts,
          summary: debugInfo,
          total_found: posts.length
        },
        `Successfully retrieved ${posts.length} posts`
      );
    } catch (error: any) {
      console.error(`Error fetching posts: ${error.response?.status} - ${error.response?.statusText}`);
      return ResponseHelpers.createErrorResponse(
        `Failed to fetch posts: ${error.response?.status} ${error.response?.statusText} - ${error.response?.data?.message || error.message}`,
        'FETCH_POSTS_ERROR',
        'API_ERROR',
        `HTTP ${error.response?.status}: ${error.response?.statusText}`
      );
    }
  }

  private async getPost(args: { id: number }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      console.error(`Fetching post with ID: ${args.id}`);
      const axios = this.wordPressClient.getAxiosInstance();
      const response = await axios.get(`posts/${args.id}`, {
        params: { context: 'edit' }
      });
      
      return ResponseHelpers.createSuccessResponse(
        response.data,
        `Successfully retrieved post ${args.id}`
      );
    } catch (error: any) {
      console.error(`Error fetching post ${args.id}: ${error.response?.status} - ${error.response?.statusText}`);
      
      if (error.response?.status === 404) {
        return ResponseHelpers.createErrorResponse(
          `Post with ID ${args.id} not found. The post may have been deleted, be in trash, or may not exist.`,
          'POST_NOT_FOUND',
          'NOT_FOUND_ERROR',
          `HTTP 404: Post ${args.id} does not exist`
        );
      }
      
      return ResponseHelpers.createErrorResponse(
        `Failed to fetch post ${args.id}: ${error.response?.status} ${error.response?.statusText} - ${error.response?.data?.message || error.message}`,
        'FETCH_POST_ERROR',
        'API_ERROR',
        `HTTP ${error.response?.status}: ${error.response?.statusText}`
      );
    }
  }

  private async createPost(args: { title: string; content: string; status?: string; excerpt?: string }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    const postData = {
      title: args.title,
      content: args.content,
      status: args.status || 'draft',
      ...(args.excerpt && { excerpt: args.excerpt }),
    };

    try {
      console.error(`Creating post with title: "${args.title}"`);
      const axios = this.wordPressClient.getAxiosInstance();
      const response = await axios.post('posts', postData);
      
      await ElementorHelpers.clearElementorCache(response.data.id);
      
      return ResponseHelpers.createSuccessResponse(
        {
          post: response.data,
          cache_cleared: true
        },
        `Post created successfully! ID: ${response.data.id}, Status: ${response.data.status}`
      );
    } catch (error: any) {
      console.error(`Error creating post: ${error.response?.status} - ${error.response?.statusText}`);
      return ResponseHelpers.createErrorResponse(
        `Failed to create post: ${error.response?.status} ${error.response?.statusText} - ${error.response?.data?.message || error.message}`,
        'CREATE_POST_ERROR',
        'API_ERROR',
        `HTTP ${error.response?.status}: ${error.response?.statusText}`
      );
    }
  }

  private async updatePost(args: { id: number; title?: string; content?: string; status?: string; excerpt?: string }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    const updateData: any = {};
    if (args.title) updateData.title = args.title;
    if (args.content) updateData.content = args.content;
    if (args.status) updateData.status = args.status;
    if (args.excerpt) updateData.excerpt = args.excerpt;

    try {
      console.error(`Updating post ID: ${args.id}`);
      const axios = this.wordPressClient.getAxiosInstance();
      const response = await axios.post(`posts/${args.id}`, updateData);
      
      await ElementorHelpers.clearElementorCache(args.id);
      
      return ResponseHelpers.createSuccessResponse(
        {
          post: response.data,
          cache_cleared: true
        },
        `Post updated successfully! ID: ${response.data.id}, Status: ${response.data.status}`
      );
    } catch (error: any) {
      console.error(`Error updating post ${args.id}: ${error.response?.status} - ${error.response?.statusText}`);
      
      if (error.response?.status === 404) {
        return ResponseHelpers.createErrorResponse(
          `Post with ID ${args.id} not found. The post may have been deleted, be in trash, or may not exist.`,
          'POST_NOT_FOUND',
          'NOT_FOUND_ERROR',
          `HTTP 404: Post ${args.id} does not exist`
        );
      }
      
      return ResponseHelpers.createErrorResponse(
        `Failed to update post ${args.id}: ${error.response?.status} ${error.response?.statusText} - ${error.response?.data?.message || error.message}`,
        'UPDATE_POST_ERROR',
        'API_ERROR',
        `HTTP ${error.response?.status}: ${error.response?.statusText}`
      );
    }
  }

  private async getPages(args: { per_page?: number; status?: string }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    const params = {
      per_page: args.per_page || 10,
      status: args.status || 'publish',
      context: 'edit'
    };

    try {
      console.error(`Fetching pages with params: ${JSON.stringify(params)}`);
      const axios = this.wordPressClient.getAxiosInstance();
      const response = await axios.get('pages', { params });
      
      const pages = response.data;
      let debugInfo = `Found ${pages.length} pages\n`;
      
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
      
      return ResponseHelpers.createSuccessResponse(
        {
          pages: pages,
          summary: debugInfo,
          total_found: pages.length
        },
        `Successfully retrieved ${pages.length} pages`
      );
    } catch (error: any) {
      console.error(`Error fetching pages: ${error.response?.status} - ${error.response?.statusText}`);
      return ResponseHelpers.createErrorResponse(
        `Failed to fetch pages: ${error.response?.status} ${error.response?.statusText} - ${error.response?.data?.message || error.message}`,
        'FETCH_PAGES_ERROR',
        'API_ERROR',
        `HTTP ${error.response?.status}: ${error.response?.statusText}`
      );
    }
  }

  private async listAllContent(args: { per_page?: number; include_all_statuses?: boolean }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
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
      
      const axios = this.wordPressClient.getAxiosInstance();
      
      // Fetch posts for each status
      for (const status of statuses) {
        try {
          const postsResponse = await axios.get('posts', {
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
          const pagesResponse = await axios.get('pages', {
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
      
      allContent.sort((a, b) => a.id - b.id);
      
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
      
      allContent.forEach(item => {
        summary.by_status[item.status] = (summary.by_status[item.status] || 0) + 1;
      });
      
      return ResponseHelpers.createSuccessResponse(
        {
          summary,
          content: allContent
        },
        `Successfully retrieved ${allContent.length} content items`
      );
      
    } catch (error: any) {
      console.error(`Error listing all content: ${error.message}`);
      return ResponseHelpers.createErrorResponse(
        `Failed to list content: ${error.response?.status} ${error.response?.statusText} - ${error.response?.data?.message || error.message}`,
        "LIST_CONTENT_ERROR",
        "API_ERROR",
        `HTTP ${error.response?.status}: ${error.response?.statusText}`
      );
    }
  }

  private async createPage(args: { title: string; content: string; status?: string; excerpt?: string; parent?: number }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    const pageData = {
      title: args.title,
      content: args.content,
      status: args.status || 'draft',
      ...(args.excerpt && { excerpt: args.excerpt }),
      ...(args.parent && { parent: args.parent }),
    };

    try {
      console.error(`Creating page with title: "${args.title}"`);
      const axios = this.wordPressClient.getAxiosInstance();
      const response = await axios.post('pages', pageData);
      
      await ElementorHelpers.clearElementorCache(response.data.id);
      
      return ResponseHelpers.createSuccessResponse(
        {
          page: response.data,
          cache_cleared: true
        },
        `Page created successfully! ID: ${response.data.id}, Status: ${response.data.status}`
      );
    } catch (error: any) {
      console.error(`Error creating page: ${error.response?.status} - ${error.response?.statusText}`);
      return ResponseHelpers.createErrorResponse(
        `Failed to create page: ${error.response?.status} ${error.response?.statusText} - ${error.response?.data?.message || error.message}`,
        'CREATE_PAGE_ERROR',
        'API_ERROR',
        `HTTP ${error.response?.status}: ${error.response?.statusText}`
      );
    }
  }

  private async updatePage(args: { id: number; title?: string; content?: string; status?: string; excerpt?: string; parent?: number }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    const updateData: any = {};
    if (args.title) updateData.title = args.title;
    if (args.content) updateData.content = args.content;
    if (args.status) updateData.status = args.status;
    if (args.excerpt) updateData.excerpt = args.excerpt;
    if (args.parent !== undefined) updateData.parent = args.parent;

    try {
      console.error(`Updating page ID: ${args.id}`);
      const axios = this.wordPressClient.getAxiosInstance();
      const response = await axios.post(`pages/${args.id}`, updateData);
      
      await ElementorHelpers.clearElementorCache(args.id);
      
      return ResponseHelpers.createSuccessResponse(
        {
          page: response.data,
          cache_cleared: true
        },
        `Page updated successfully! ID: ${response.data.id}, Status: ${response.data.status}`
      );
    } catch (error: any) {
      console.error(`Error updating page ${args.id}: ${error.response?.status} - ${error.response?.statusText}`);
      
      if (error.response?.status === 404) {
        return ResponseHelpers.createErrorResponse(
          `Page with ID ${args.id} not found. The page may have been deleted, be in trash, or may not exist.`,
          'PAGE_NOT_FOUND',
          'NOT_FOUND',
          `HTTP 404: Page ID ${args.id} not accessible`
        );
      }
      
      return ResponseHelpers.createErrorResponse(
        `Failed to update page ${args.id}: ${error.response?.status} ${error.response?.statusText} - ${error.response?.data?.message || error.message}`,
        'UPDATE_PAGE_ERROR',
        'API_ERROR',
        `HTTP ${error.response?.status}: ${error.response?.statusText}`
      );
    }
  }

  private async getMedia(args: { per_page?: number; media_type?: string }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    const params: any = {
      per_page: args.per_page || 10,
    };
    
    if (args.media_type) {
      params.media_type = args.media_type;
    }

    try {
      console.error(`Fetching media with params: ${JSON.stringify(params)}`);
      const axios = this.wordPressClient.getAxiosInstance();
      const response = await axios.get('media', { params });
      
      return ResponseHelpers.createSuccessResponse(
        {
          media: response.data,
          count: response.data.length,
          filter: args.media_type || 'all'
        },
        `Retrieved ${response.data.length} media items`
      );
    } catch (error: any) {
      console.error(`Error fetching media: ${error.response?.status} - ${error.response?.statusText}`);
      return ResponseHelpers.createErrorResponse(
        `Failed to fetch media: ${error.response?.status} ${error.response?.statusText} - ${error.response?.data?.message || error.message}`,
        'GET_MEDIA_ERROR',
        'API_ERROR',
        `HTTP ${error.response?.status}: ${error.response?.statusText}`
      );
    }
  }

  private async uploadMedia(args: { file_path: string; title?: string; alt_text?: string }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      if (!fs.existsSync(args.file_path)) {
        return ResponseHelpers.createErrorResponse(
          `Failed to upload media: File not found: ${args.file_path}`,
          'FILE_NOT_FOUND',
          'VALIDATION_ERROR',
          'The specified file path does not exist or is not accessible'
        );
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

      const axios = this.wordPressClient.getAxiosInstance();
      const response = await axios.post('media', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });
      
      return ResponseHelpers.createSuccessResponse(
        {
          operation_type: "upload_media",
          media_id: response.data.id,
          url: response.data.source_url,
          title: response.data.title.rendered,
          file_path: args.file_path,
          file_name: fileName,
          mime_type: response.data.mime_type,
          file_size: response.data.media_details?.filesize || null,
          alt_text: args.alt_text || null,
          upload_date: response.data.date
        },
        `Media uploaded successfully! Media ID: ${response.data.id} - ${response.data.title.rendered}`
      );
    } catch (error: any) {
      return ResponseHelpers.createErrorResponse(
        `Failed to upload media: ${error.response?.data?.message || error.message}`,
        'UPLOAD_FAILED',
        'API_ERROR',
        `HTTP ${error.response?.status}: ${error.response?.statusText} - ${error.response?.data || error.message}`
      );
    }
  }

  // Elementor Operations
  private async getElementorTemplates(args: { per_page?: number; type?: string }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    const params: any = {
      per_page: args.per_page || 10,
      meta_key: '_elementor_template_type',
    };
    
    if (args.type) {
      params.meta_value = args.type;
    }

    try {
      const axios = this.wordPressClient.getAxiosInstance();
      const response = await axios.get('elementor_library', { params });
      return ResponseHelpers.createSuccessResponse(
        {
          templates: response.data,
          count: response.data.length
        },
        `Retrieved ${response.data.length} Elementor templates`
      );
    } catch (error: any) {
      if (error.response?.status === 404) {
        return ResponseHelpers.createErrorResponse(
          'Elementor templates endpoint not found. Make sure Elementor Pro is installed and activated.',
          'TEMPLATES_NOT_FOUND',
          'NOT_FOUND',
          'Elementor Pro required for template access'
        );
      }
      return ResponseHelpers.createErrorResponse(
        `Failed to get Elementor templates: ${error.message}`,
        'GET_TEMPLATES_ERROR',
        'API_ERROR',
        `HTTP ${error.response?.status}: ${error.response?.statusText}`
      );
    }
  }

  private async getElementorData(args: any): Promise<any> {
    return await this.elementorHandler.getElementorData(args);
  }

  private async updateElementorData(args: { post_id: number; elementor_data: string }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      const updateData = {
        meta: {
          _elementor_data: args.elementor_data,
          _elementor_edit_mode: 'builder',
        },
      };

      const axios = this.wordPressClient.getAxiosInstance();
      let response;
      let postType = 'post';
      
      try {
        response = await axios.post(`posts/${args.post_id}`, updateData);
      } catch (postError: any) {
        if (postError.response?.status === 404) {
          try {
            response = await axios.post(`pages/${args.post_id}`, updateData);
            postType = 'page';
          } catch (pageError: any) {
            return ResponseHelpers.createErrorResponse(
              `Post/Page ID ${args.post_id} not found in posts or pages`,
              'POST_PAGE_NOT_FOUND',
              'NOT_FOUND',
              'Failed to update both post and page endpoints'
            );
          }
        } else {
          return ResponseHelpers.createErrorResponse(
            `Failed to update post: ${postError.response?.data?.message || postError.message}`,
            'UPDATE_POST_ERROR',
            'API_ERROR',
            `HTTP ${postError.response?.status}: ${postError.response?.statusText}`
          );
        }
      }

      await ElementorHelpers.clearElementorCache(args.post_id);
      
      return ResponseHelpers.createSuccessResponse(
        {
          post_type: postType,
          post_id: args.post_id,
          cache_cleared: true,
          updated_data: true
        },
        `Elementor data updated successfully for ${postType} ID: ${args.post_id}`
      );
    } catch (error: any) {
      return ResponseHelpers.createErrorResponse(
        `Failed to update Elementor data: ${error.response?.data?.message || error.message}`,
        'UPDATE_ELEMENTOR_DATA_ERROR',
        'API_ERROR',
        `HTTP ${error.response?.status}: ${error.response?.statusText}`
      );
    }
  }

  private async updateElementorWidget(args: { post_id: number; widget_id: string; widget_settings?: object; widget_content?: string }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      const parsedResult = await this.elementorHandler.safeGetElementorData(args.post_id);
      
      if (!parsedResult.success || !parsedResult.data) {
        return ResponseHelpers.createErrorResponse(
          `Failed to get Elementor data for post/page ID ${args.post_id}: ${parsedResult.error || 'Unknown error'}`,
          'ELEMENTOR_DATA_ERROR',
          'DATA_ERROR',
          'Could not retrieve or parse Elementor data for widget update'
        );
      }
      
      const elementorData = parsedResult.data;
      
      const updateWidgetRecursive = (elements: any[]): boolean => {
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          
          if (element.id === args.widget_id) {
            if (args.widget_settings) {
              element.settings = { ...element.settings, ...args.widget_settings };
            }
            
            if (args.widget_content) {
              ElementorHelpers.updateWidgetContent(element, args.widget_content);
            }
            
            return true;
          }
          
          if (element.elements && element.elements.length > 0) {
            if (updateWidgetRecursive(element.elements)) {
              return true;
            }
          }
        }
        return false;
      };
      
      const widgetFound = updateWidgetRecursive(elementorData);
      
      if (!widgetFound) {
        return ResponseHelpers.createErrorResponse(
          `Widget ID ${args.widget_id} not found in Elementor data`,
          'WIDGET_NOT_FOUND',
          'NOT_FOUND',
          `Could not locate widget with ID ${args.widget_id} in the page structure`
        );
      }
      
      const updateData = {
        meta: {
          _elementor_data: JSON.stringify(elementorData),
          _elementor_edit_mode: 'builder',
        },
      };

      const axios = this.wordPressClient.getAxiosInstance();
      let response;
      let postType = 'post';
      
      try {
        response = await axios.post(`posts/${args.post_id}`, updateData);
      } catch (postError: any) {
        if (postError.response?.status === 404) {
          try {
            response = await axios.post(`pages/${args.post_id}`, updateData);
            postType = 'page';
          } catch (pageError: any) {
            return ResponseHelpers.createErrorResponse(
              `Post/Page ID ${args.post_id} not found in posts or pages`,
              'POST_PAGE_NOT_FOUND',
              'NOT_FOUND',
              'Failed to update both post and page endpoints for widget update'
            );
          }
        } else {
          return ResponseHelpers.createErrorResponse(
            `Failed to update post: ${postError.response?.data?.message || postError.message}`,
            'UPDATE_POST_ERROR',
            'API_ERROR',
            `HTTP ${postError.response?.status}: ${postError.response?.statusText}`
          );
        }
      }

      await ElementorHelpers.clearElementorCache(args.post_id);
      
      return ResponseHelpers.createSuccessResponse(
        {
          widget_id: args.widget_id,
          post_type: postType,
          post_id: args.post_id,
          cache_cleared: true,
          updated_settings: !!args.widget_settings,
          updated_content: !!args.widget_content
        },
        `Elementor widget ${args.widget_id} updated successfully for ${postType} ID: ${args.post_id}`
      );
    } catch (error: any) {
      return ResponseHelpers.createErrorResponse(
        `Failed to update Elementor widget: ${error.response?.data?.message || error.message}`,
        'UPDATE_WIDGET_ERROR',
        'API_ERROR',
        `HTTP ${error.response?.status}: ${error.response?.statusText}`
      );
    }
  }

  private async getElementorWidget(args: { post_id: number; widget_id: string }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      console.error(`🔍 Getting widget ${args.widget_id} from post ID: ${args.post_id}`);
      
      const parsedResult = await this.elementorHandler.safeGetElementorData(args.post_id);
      
      if (!parsedResult.success || !parsedResult.data) {
        console.error(`❌ Failed to get Elementor data: ${parsedResult.error}`);
        return ResponseHelpers.createErrorResponse(
          `Failed to retrieve Elementor data for post/page ID ${args.post_id}: ${parsedResult.error || 'Unknown error'}`,
          'ELEMENTOR_DATA_ERROR',
          'DATA_ERROR',
          'Could not retrieve or parse Elementor data for widget retrieval'
        );
      }
      
      const elementorData = parsedResult.data;
      console.error(`✅ Successfully parsed data, searching through ${elementorData.length} top-level elements for widget ${args.widget_id}`);
      
      const widget = ElementorHelpers.findElementRecursive(elementorData, args.widget_id);
      
      if (!widget) {
        return ResponseHelpers.createErrorResponse(
          `Widget ID ${args.widget_id} not found in Elementor data`,
          'WIDGET_NOT_FOUND',
          'NOT_FOUND',
          `Could not locate widget with ID ${args.widget_id} in the page structure`
        );
      }
      
      return ResponseHelpers.createSuccessResponse(
        {
          widget: widget,
          widget_id: args.widget_id,
          post_id: args.post_id
        },
        `Widget ${args.widget_id} retrieved successfully`
      );
    } catch (error: any) {
      return ResponseHelpers.createErrorResponse(
        `Failed to get Elementor widget: ${error.response?.data?.message || error.message}`,
        'GET_WIDGET_ERROR',
        'API_ERROR',
        `HTTP ${error.response?.status}: ${error.response?.statusText}`
      );
    }
  }

  private async getElementorElements(args: { post_id: number; include_content?: boolean }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      console.error(`🔍 Getting Elementor elements for ID: ${args.post_id}`);
      
      const parsedResult = await this.elementorHandler.safeGetElementorData(args.post_id);
      
      if (!parsedResult.success || !parsedResult.data) {
        return ResponseHelpers.createErrorResponse(
          `No Elementor data found for post/page ID ${args.post_id}`,
          'NO_ELEMENTOR_DATA',
          'DATA_NOT_FOUND',
          `Post/page does not contain Elementor data or is not built with Elementor: ${parsedResult.error}`
        );
      }
      
      const elementorData = parsedResult.data;
      console.error(`✅ Successfully parsed ${elementorData.length} top-level elements`);
      
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
            if (element.widgetType === 'html' && element.settings.html) {
              elementInfo.contentPreview = element.settings.html.substring(0, 100) + (element.settings.html.length > 100 ? '...' : '');
            } else if (element.widgetType === 'text-editor' && element.settings.editor) {
              elementInfo.contentPreview = element.settings.editor.substring(0, 100) + (element.settings.editor.length > 100 ? '...' : '');
            } else if (element.widgetType === 'heading' && element.settings.title) {
              elementInfo.contentPreview = element.settings.title.substring(0, 100) + (element.settings.title.length > 100 ? '...' : '');
            }
          }
          
          result.push(elementInfo);
          
          if (element.elements && element.elements.length > 0) {
            result.push(...extractElementsRecursive(element.elements, level + 1));
          }
        }
        
        return result;
      };
      
      const elements = extractElementsRecursive(elementorData);
      
      return ResponseHelpers.createSuccessResponse(
        { 
          post_id: args.post_id,
          total_elements: elements.length,
          elements: elements 
        },
        `Retrieved ${elements.length} Elementor elements from post/page ${args.post_id}`
      );
    } catch (error: any) {
      return ResponseHelpers.createErrorResponse(
        `Failed to get Elementor elements: ${error.response?.data?.message || error.message}`,
        'GET_ELEMENTS_ERROR',
        'API_ERROR',
        `HTTP ${error.response?.status}: ${error.response?.statusText}`
      );
    }
  }

  private async updateElementorSection(args: { post_id: number; section_id: string; widgets_updates: Array<{widget_id: string; widget_settings?: object; widget_content?: string}> }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      const parsedResult = await this.elementorHandler.safeGetElementorData(args.post_id);
      
      if (!parsedResult.success || !parsedResult.data) {
        return ResponseHelpers.createErrorResponse(
          `Failed to get Elementor data for post/page ID ${args.post_id}: ${parsedResult.error || 'Unknown error'}`,
          'ELEMENTOR_DATA_ERROR',
          'DATA_ERROR',
          'Could not retrieve or parse Elementor data for section update'
        );
      }
      
      const elementorData = parsedResult.data;
      
      let sectionFound = false;
      let updatedWidgets: string[] = [];
      
      const updateSectionWidgets = (elements: any[]): boolean => {
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          
          if (element.id === args.section_id) {
            sectionFound = true;
            for (const widgetUpdate of args.widgets_updates) {
              const updated = updateWidgetInElements(element.elements || [], widgetUpdate);
              if (updated) {
                updatedWidgets.push(widgetUpdate.widget_id);
              }
            }
            return true;
          }
          
          if (element.elements && element.elements.length > 0) {
            if (updateSectionWidgets(element.elements)) {
              return true;
            }
          }
        }
        return false;
      };
      
      const updateWidgetInElements = (elements: any[], widgetUpdate: {widget_id: string; widget_settings?: object; widget_content?: string}): boolean => {
        for (const element of elements) {
          if (element.id === widgetUpdate.widget_id) {
            if (widgetUpdate.widget_settings) {
              element.settings = { ...element.settings, ...widgetUpdate.widget_settings };
            }
            
            if (widgetUpdate.widget_content) {
              ElementorHelpers.updateWidgetContent(element, widgetUpdate.widget_content);
            }
            
            return true;
          }
          
          if (element.elements && element.elements.length > 0) {
            if (updateWidgetInElements(element.elements, widgetUpdate)) {
              return true;
            }
          }
        }
        return false;
      };
      
      updateSectionWidgets(elementorData);
      
      if (!sectionFound) {
        return ResponseHelpers.createErrorResponse(
          `Section ID ${args.section_id} not found in Elementor data`,
          'SECTION_NOT_FOUND',
          'NOT_FOUND',
          `Could not locate section with ID ${args.section_id} in the page structure`
        );
      }
      
      const updateData = {
        meta: {
          _elementor_data: JSON.stringify(elementorData),
          _elementor_edit_mode: 'builder',
        },
      };

      const axios = this.wordPressClient.getAxiosInstance();
      let response;
      let postType = 'post';
      
      try {
        response = await axios.post(`posts/${args.post_id}`, updateData);
      } catch (postError: any) {
        if (postError.response?.status === 404) {
          try {
            response = await axios.post(`pages/${args.post_id}`, updateData);
            postType = 'page';
          } catch (pageError: any) {
            return ResponseHelpers.createErrorResponse(
              `Post/Page ID ${args.post_id} not found in posts or pages`,
              'POST_PAGE_NOT_FOUND',
              'NOT_FOUND',
              'Failed to update both post and page endpoints for section update'
            );
          }
        } else {
          throw postError;
        }
      }

      await ElementorHelpers.clearElementorCache(args.post_id);
      
      return ResponseHelpers.createSuccessResponse(
        {
          operation_type: "update_section_widgets",
          section_id: args.section_id,
          post_id: args.post_id,
          post_type: postType,
          updated_widgets: updatedWidgets,
          widgets_not_found: args.widgets_updates.filter(w => !updatedWidgets.includes(w.widget_id)).map(w => w.widget_id),
          total_updates_requested: args.widgets_updates.length,
          successful_updates: updatedWidgets.length,
          cache_cleared: true
        },
        `Elementor section ${args.section_id} updated successfully with ${updatedWidgets.length}/${args.widgets_updates.length} widget updates`
      );
    } catch (error: any) {
      return ResponseHelpers.createErrorResponse(
        `Failed to update Elementor section: ${error.response?.data?.message || error.message}`,
        'UPDATE_SECTION_ERROR',
        'API_ERROR',
        `HTTP ${error.response?.status}: ${error.response?.statusText}`
      );
    }
  }

  private async getElementorDataChunked(args: { post_id: number; chunk_size?: number; chunk_index?: number }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      const parsedResult = await this.elementorHandler.safeGetElementorData(args.post_id);
      
      if (!parsedResult.success || !parsedResult.data) {
        return ResponseHelpers.createErrorResponse(
          `Failed to get Elementor data for post/page ID ${args.post_id}: ${parsedResult.error || 'Unknown error'}`,
          'ELEMENTOR_DATA_ERROR',
          'DATA_ERROR',
          'Could not retrieve or parse Elementor data for chunked access'
        );
      }
      
      const elementorData = parsedResult.data;
      
      const chunkSize = args.chunk_size || 5;
      const chunkIndex = args.chunk_index || 0;
      const totalElements = elementorData.length;
      const totalChunks = Math.ceil(totalElements / chunkSize);
      
      const startIndex = chunkIndex * chunkSize;
      const endIndex = Math.min(startIndex + chunkSize, totalElements);
      
      if (chunkIndex >= totalChunks) {
        return ResponseHelpers.createErrorResponse(
          `Chunk index ${chunkIndex} is out of range. Total chunks: ${totalChunks}`,
          'CHUNK_INDEX_OUT_OF_RANGE',
          'VALIDATION_ERROR',
          `Requested chunk ${chunkIndex} but only ${totalChunks} chunks available`
        );
      }
      
      const chunk = elementorData.slice(startIndex, endIndex);
      
      return ResponseHelpers.createSuccessResponse(
        {
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
          chunk_data: chunk,
          pagination: {
            has_next_chunk: chunkIndex < totalChunks - 1,
            has_previous_chunk: chunkIndex > 0,
            next_chunk_index: chunkIndex < totalChunks - 1 ? chunkIndex + 1 : null,
            previous_chunk_index: chunkIndex > 0 ? chunkIndex - 1 : null
          }
        },
        `Retrieved chunk ${chunkIndex + 1} of ${totalChunks} (${chunk.length} elements) for post ID ${args.post_id}`
      );
    } catch (error: any) {
      return ResponseHelpers.createErrorResponse(
        `Failed to get chunked Elementor data: ${error.response?.data?.message || error.message}`,
        'GET_CHUNKED_DATA_ERROR',
        'API_ERROR',
        `HTTP ${error.response?.status}: ${error.response?.statusText}`
      );
    }
  }

  private async backupElementorData(args: { post_id: number; backup_name?: string }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      const parsedResult = await this.elementorHandler.safeGetElementorData(args.post_id);
      
      if (!parsedResult.success || !parsedResult.data) {
        return ResponseHelpers.createErrorResponse(
          `Failed to get Elementor data for post/page ID ${args.post_id}: ${parsedResult.error || 'Unknown error'}`,
          'ELEMENTOR_DATA_ERROR',
          'DATA_ERROR',
          'Could not retrieve or parse Elementor data for backup'
        );
      }
      
      const timestamp = new Date().toISOString();
      const backupName = args.backup_name || `backup_${timestamp}`;
      
      const axios = this.wordPressClient.getAxiosInstance();
      let postInfo;
      let postType = 'post';
      
      try {
        postInfo = await axios.get(`posts/${args.post_id}`, {
          params: { context: 'edit' }
        });
      } catch (postError: any) {
        if (postError.response?.status === 404) {
          try {
            postInfo = await axios.get(`pages/${args.post_id}`, {
              params: { context: 'edit' }
            });
            postType = 'page';
          } catch (pageError: any) {
            return ResponseHelpers.createErrorResponse(
              `Post/Page ID ${args.post_id} not found in posts or pages`,
              'POST_PAGE_NOT_FOUND',
              'NOT_FOUND',
              'Failed to access both post and page endpoints for backup'
            );
          }
        } else {
          throw postError;
        }
      }
      
      const backupKey = `_elementor_data_backup_${Date.now()}`;
      const backupMeta = {
        meta: {
          [backupKey]: JSON.stringify({
            backup_name: backupName,
            timestamp: timestamp,
            post_id: args.post_id,
            post_type: postType,
            post_title: postInfo.data.title.rendered || postInfo.data.title.raw,
            elementor_data: JSON.stringify(parsedResult.data)
          })
        }
      };
      
      let response;
      if (postType === 'page') {
        response = await axios.post(`pages/${args.post_id}`, backupMeta);
      } else {
        response = await axios.post(`posts/${args.post_id}`, backupMeta);
      }
      
      return ResponseHelpers.createSuccessResponse(
        {
          operation_type: "backup_elementor_data",
          post_id: args.post_id,
          post_type: postType,
          post_title: postInfo.data.title.rendered || postInfo.data.title.raw,
          backup_name: backupName,
          backup_key: backupKey,
          timestamp: timestamp,
          backup_storage: "wordpress_meta",
          data_size: JSON.stringify(parsedResult.data).length
        },
        `Elementor data backup created successfully! Backup key: ${backupKey}`
      );
    } catch (error: any) {
      return ResponseHelpers.createErrorResponse(
        `Failed to backup Elementor data: ${error.response?.data?.message || error.message}`,
        'BACKUP_ERROR',
        'API_ERROR',
        `HTTP ${error.response?.status}: ${error.response?.statusText}`
      );
    }
  }

  // Section and Container Creation
  private async createElementorSection(args: { post_id: number; position?: number; columns?: number; section_settings?: object }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      const parsedResult = await this.elementorHandler.safeGetElementorData(args.post_id);
      
      let elementorData: any[] = [];
      if (parsedResult.success && parsedResult.data) {
        elementorData = parsedResult.data;
      }
      
      const newSection = ElementorHelpers.createElementorSection(args.columns || 1, args.section_settings || {});
      
      if (args.position !== undefined && args.position >= 0 && args.position < elementorData.length) {
        elementorData.splice(args.position, 0, newSection);
      } else {
        elementorData.push(newSection);
      }
      
      await this.updateElementorData({
        post_id: args.post_id,
        elementor_data: JSON.stringify(elementorData)
      });
      
      return ResponseHelpers.createSuccessResponse(
        {
          operation_type: "create_section",
          section_id: newSection.id,
          columns: args.columns || 1,
          position: args.position || elementorData.length - 1,
          post_id: args.post_id,
          section_settings: args.section_settings || {},
          column_ids: newSection.elements.map((col: any) => col.id)
        },
        `Section created successfully! Section ID: ${newSection.id} with ${args.columns || 1} columns`
      );
    } catch (error: any) {
      return ResponseHelpers.createErrorResponse(
        `Failed to create section: ${error.message}`,
        'CREATE_SECTION_ERROR',
        'API_ERROR',
        `Section creation failed: ${error.message}`
      );
    }
  }

  private async createElementorContainer(args: { post_id: number; position?: number; container_settings?: object }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      const parsedResult = await this.elementorHandler.safeGetElementorData(args.post_id);
      
      let elementorData: any[] = [];
      if (parsedResult.success && parsedResult.data) {
        elementorData = parsedResult.data;
      }
      
      const containerId = ElementorHelpers.generateElementorId();
      
      const newContainer = {
        id: containerId,
        elType: 'container',
        isInner: false,
        settings: args.container_settings || {},
        elements: [],
        widgetType: null
      };
      
      if (args.position !== undefined && args.position >= 0 && args.position < elementorData.length) {
        elementorData.splice(args.position, 0, newContainer);
      } else {
        elementorData.push(newContainer);
      }
      
      await this.updateElementorData({
        post_id: args.post_id,
        elementor_data: JSON.stringify(elementorData)
      });
      
      return ResponseHelpers.createSuccessResponse(
        {
          operation_type: "create_container",
          container_id: containerId,
          position: args.position || elementorData.length - 1,
          post_id: args.post_id,
          container_settings: args.container_settings || {}
        },
        `Container created successfully! Container ID: ${containerId}`
      );
    } catch (error: any) {
      return ResponseHelpers.createErrorResponse(
        `Failed to create container: ${error.message}`,
        'CREATE_CONTAINER_ERROR',
        'API_ERROR',
        `Container creation failed: ${error.message}`
      );
    }
  }

  private async addColumnToSection(args: { post_id: number; section_id: string; columns_to_add?: number }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      const parsedResult = await this.elementorHandler.safeGetElementorData(args.post_id);
      
      if (!parsedResult.success || !parsedResult.data) {
        return ResponseHelpers.createErrorResponse(
          `Failed to get Elementor data for post/page ID ${args.post_id}: ${parsedResult.error || 'Unknown error'}`,
          'ELEMENTOR_DATA_ERROR',
          'DATA_ERROR',
          'Could not retrieve or parse Elementor data for adding columns'
        );
      }
      
      const elementorData = parsedResult.data;
      const section = ElementorHelpers.findElementRecursive(elementorData, args.section_id);
      
      if (!section) {
        return ResponseHelpers.createErrorResponse(
          `Section ID ${args.section_id} not found in Elementor data`,
          'SECTION_NOT_FOUND',
          'NOT_FOUND',
          `Could not locate section with ID ${args.section_id}`
        );
      }
      
      const columnsToAdd = args.columns_to_add || 1;
      const currentColumns = section.elements.length;
      const newColumnCount = currentColumns + columnsToAdd;
      const newColumnSize = Math.floor(100 / newColumnCount);
      
      // Adjust existing columns
      section.elements.forEach((column: any) => {
        column.settings._column_size = newColumnSize;
      });
      
      // Add new columns
      for (let i = 0; i < columnsToAdd; i++) {
        section.elements.push(ElementorHelpers.createElementorColumn(newColumnSize));
      }
      
      await this.updateElementorData({
        post_id: args.post_id,
        elementor_data: JSON.stringify(elementorData)
      });
      
      return ResponseHelpers.createSuccessResponse(
        {
          operation_type: "add_columns_to_section",
          section_id: args.section_id,
          columns_added: columnsToAdd,
          total_columns: newColumnCount,
          post_id: args.post_id
        },
        `Added ${columnsToAdd} column(s) to section ${args.section_id}. Total columns: ${newColumnCount}`
      );
    } catch (error: any) {
      return ResponseHelpers.createErrorResponse(
        `Failed to add columns to section: ${error.message}`,
        'ADD_COLUMNS_ERROR',
        'API_ERROR',
        `Failed to add columns: ${error.message}`
      );
    }
  }

  private async duplicateSection(args: { post_id: number; section_id: string; position?: number }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      const parsedResult = await this.elementorHandler.safeGetElementorData(args.post_id);
      
      if (!parsedResult.success || !parsedResult.data) {
        return ResponseHelpers.createErrorResponse(
          `Failed to get Elementor data for post/page ID ${args.post_id}: ${parsedResult.error || 'Unknown error'}`,
          'ELEMENTOR_DATA_ERROR',
          'DATA_ERROR',
          'Could not retrieve or parse Elementor data for duplicating section'
        );
      }
      
      const elementorData = parsedResult.data;
      const section = ElementorHelpers.findElementRecursive(elementorData, args.section_id);
      
      if (!section) {
        return ResponseHelpers.createErrorResponse(
          `Section ID ${args.section_id} not found in Elementor data`,
          'SECTION_NOT_FOUND',
          'NOT_FOUND',
          `Could not locate section with ID ${args.section_id}`
        );
      }
      
      // Deep clone the section and generate new IDs
      const duplicatedSection = JSON.parse(JSON.stringify(section));
      duplicatedSection.id = ElementorHelpers.generateElementorId();
      
      // Recursively update all element IDs
      const updateIds = (element: any) => {
        element.id = ElementorHelpers.generateElementorId();
        if (element.elements) {
          element.elements.forEach(updateIds);
        }
      };
      
      duplicatedSection.elements.forEach(updateIds);
      
      // Find the original section index
      const originalIndex = elementorData.findIndex((el: any) => el.id === args.section_id);
      const insertIndex = args.position !== undefined ? args.position : originalIndex + 1;
      
      elementorData.splice(insertIndex, 0, duplicatedSection);
      
      await this.updateElementorData({
        post_id: args.post_id,
        elementor_data: JSON.stringify(elementorData)
      });
      
      return ResponseHelpers.createSuccessResponse(
        {
          operation_type: "duplicate_section",
          original_section_id: args.section_id,
          duplicated_section_id: duplicatedSection.id,
          position: insertIndex,
          post_id: args.post_id
        },
        `Section ${args.section_id} duplicated successfully! New section ID: ${duplicatedSection.id}`
      );
    } catch (error: any) {
      return ResponseHelpers.createErrorResponse(
        `Failed to duplicate section: ${error.message}`,
        'DUPLICATE_SECTION_ERROR',
        'API_ERROR',
        `Failed to duplicate section: ${error.message}`
      );
    }
  }

  // Widget Addition and Management
  private async addWidgetToSection(args: { post_id: number; widget_type: string; section_id?: string; column_id?: string; position?: number; widget_settings?: object }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      const parsedResult = await this.elementorHandler.safeGetElementorData(args.post_id);
      
      if (!parsedResult.success || !parsedResult.data) {
        return ResponseHelpers.createErrorResponse(
          `Failed to get Elementor data for post/page ID ${args.post_id}: ${parsedResult.error || 'Unknown error'}`,
          'ELEMENTOR_DATA_ERROR',
          'DATA_ERROR',
          'Could not retrieve or parse Elementor data for adding widget'
        );
      }
      
      const elementorData = parsedResult.data;
      let targetColumn = null;
      
      if (args.column_id) {
        targetColumn = ElementorHelpers.findElementRecursive(elementorData, args.column_id);
      } else if (args.section_id) {
        const section = ElementorHelpers.findElementRecursive(elementorData, args.section_id);
        if (section && section.elements && section.elements.length > 0) {
          targetColumn = section.elements[0]; // Use first column
        }
      }
      
      if (!targetColumn) {
        return ResponseHelpers.createErrorResponse(
          `Target column not found. Please specify a valid section_id or column_id`,
          'TARGET_COLUMN_NOT_FOUND',
          'NOT_FOUND',
          'Could not locate target column for widget placement'
        );
      }
      
      const newWidget = {
        id: ElementorHelpers.generateElementorId(),
        elType: 'widget',
        isInner: false,
        settings: args.widget_settings || {},
        elements: [],
        widgetType: args.widget_type
      };
      
      if (args.position !== undefined && args.position >= 0 && args.position < targetColumn.elements.length) {
        targetColumn.elements.splice(args.position, 0, newWidget);
      } else {
        targetColumn.elements.push(newWidget);
      }
      
      await this.updateElementorData({
        post_id: args.post_id,
        elementor_data: JSON.stringify(elementorData)
      });
      
      return ResponseHelpers.createSuccessResponse(
        {
          operation_type: "add_widget_to_section",
          widget_id: newWidget.id,
          widget_type: args.widget_type,
          target_column_id: targetColumn.id,
          position: args.position || targetColumn.elements.length - 1,
          post_id: args.post_id,
          widget_settings: args.widget_settings || {}
        },
        `Widget ${args.widget_type} added successfully! Widget ID: ${newWidget.id}`
      );
    } catch (error: any) {
      return ResponseHelpers.createErrorResponse(
        `Failed to add widget to section: ${error.message}`,
        'ADD_WIDGET_ERROR',
        'API_ERROR',
        `Failed to add widget: ${error.message}`
      );
    }
  }

  private async insertWidgetAtPosition(args: { post_id: number; widget_type: string; target_element_id: string; insert_position?: string; widget_settings?: object }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      const parsedResult = await this.elementorHandler.safeGetElementorData(args.post_id);
      
      if (!parsedResult.success || !parsedResult.data) {
        return ResponseHelpers.createErrorResponse(
          `Failed to get Elementor data for post/page ID ${args.post_id}: ${parsedResult.error || 'Unknown error'}`,
          'ELEMENTOR_DATA_ERROR',
          'DATA_ERROR',
          'Could not retrieve or parse Elementor data for inserting widget'
        );
      }
      
      const elementorData = parsedResult.data;
      const targetElement = ElementorHelpers.findElementRecursive(elementorData, args.target_element_id);
      
      if (!targetElement) {
        return ResponseHelpers.createErrorResponse(
          `Target element ID ${args.target_element_id} not found`,
          'TARGET_ELEMENT_NOT_FOUND',
          'NOT_FOUND',
          `Could not locate element with ID ${args.target_element_id}`
        );
      }
      
      const newWidget = {
        id: ElementorHelpers.generateElementorId(),
        elType: 'widget',
        isInner: false,
        settings: args.widget_settings || {},
        elements: [],
        widgetType: args.widget_type
      };
      
      const insertPosition = args.insert_position || 'after';
      
      // Find parent container
      const findParentContainer = (elements: any[], elementId: string): any => {
        for (const element of elements) {
          if (element.elements) {
            const childIndex = element.elements.findIndex((child: any) => child.id === elementId);
            if (childIndex !== -1) {
              return { parent: element, childIndex };
            }
            const result = findParentContainer(element.elements, elementId);
            if (result) return result;
          }
        }
        return null;
      };
      
      const parentInfo = findParentContainer(elementorData, args.target_element_id);
      
      if (parentInfo) {
        const { parent, childIndex } = parentInfo;
        switch (insertPosition) {
          case 'before':
            parent.elements.splice(childIndex, 0, newWidget);
            break;
          case 'after':
            parent.elements.splice(childIndex + 1, 0, newWidget);
            break;
          case 'inside':
            targetElement.elements.push(newWidget);
            break;
        }
      } else {
        // Target is a top-level element
        const topIndex = elementorData.findIndex((el: any) => el.id === args.target_element_id);
        if (topIndex !== -1) {
          if (insertPosition === 'before') {
            elementorData.splice(topIndex, 0, newWidget);
          } else {
            elementorData.splice(topIndex + 1, 0, newWidget);
          }
        }
      }
      
      await this.updateElementorData({
        post_id: args.post_id,
        elementor_data: JSON.stringify(elementorData)
      });
      
      return ResponseHelpers.createSuccessResponse(
        {
          operation_type: "insert_widget_at_position",
          widget_id: newWidget.id,
          widget_type: args.widget_type,
          target_element_id: args.target_element_id,
          insert_position: insertPosition,
          post_id: args.post_id
        },
        `Widget ${args.widget_type} inserted ${insertPosition} element ${args.target_element_id}! Widget ID: ${newWidget.id}`
      );
    } catch (error: any) {
      return ResponseHelpers.createErrorResponse(
        `Failed to insert widget at position: ${error.message}`,
        'INSERT_WIDGET_ERROR',
        'API_ERROR',
        `Failed to insert widget: ${error.message}`
      );
    }
  }

  private async cloneWidget(args: { post_id: number; widget_id: string; target_element_id?: string; insert_position?: string }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      const parsedResult = await this.elementorHandler.safeGetElementorData(args.post_id);
      
      if (!parsedResult.success || !parsedResult.data) {
        return ResponseHelpers.createErrorResponse(
          `Failed to get Elementor data for post/page ID ${args.post_id}: ${parsedResult.error || 'Unknown error'}`,
          'ELEMENTOR_DATA_ERROR',
          'DATA_ERROR',
          'Could not retrieve or parse Elementor data for cloning widget'
        );
      }
      
      const elementorData = parsedResult.data;
      const sourceWidget = ElementorHelpers.findElementRecursive(elementorData, args.widget_id);
      
      if (!sourceWidget) {
        return ResponseHelpers.createErrorResponse(
          `Widget ID ${args.widget_id} not found`,
          'WIDGET_NOT_FOUND',
          'NOT_FOUND',
          `Could not locate widget with ID ${args.widget_id}`
        );
      }
      
      // Deep clone the widget and generate new ID
      const clonedWidget = JSON.parse(JSON.stringify(sourceWidget));
      clonedWidget.id = ElementorHelpers.generateElementorId();
      
      // Clone to specific position or after original
      if (args.target_element_id) {
        return await this.insertWidgetAtPosition({
          post_id: args.post_id,
          widget_type: clonedWidget.widgetType,
          target_element_id: args.target_element_id,
          insert_position: args.insert_position || 'after',
          widget_settings: clonedWidget.settings
        });
      } else {
        // Clone after original widget
        return await this.insertWidgetAtPosition({
          post_id: args.post_id,
          widget_type: clonedWidget.widgetType,
          target_element_id: args.widget_id,
          insert_position: 'after',
          widget_settings: clonedWidget.settings
        });
      }
    } catch (error: any) {
      return ResponseHelpers.createErrorResponse(
        `Failed to clone widget: ${error.message}`,
        'CLONE_WIDGET_ERROR',
        'API_ERROR',
        `Failed to clone widget: ${error.message}`
      );
    }
  }

  private async moveWidget(args: { post_id: number; widget_id: string; target_section_id?: string; target_column_id?: string; position?: number }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      const parsedResult = await this.elementorHandler.safeGetElementorData(args.post_id);
      
      if (!parsedResult.success || !parsedResult.data) {
        return ResponseHelpers.createErrorResponse(
          `Failed to get Elementor data for post/page ID ${args.post_id}: ${parsedResult.error || 'Unknown error'}`,
          'ELEMENTOR_DATA_ERROR',
          'DATA_ERROR',
          'Could not retrieve or parse Elementor data for moving widget'
        );
      }
      
      const elementorData = parsedResult.data;
      
      // Find and remove the widget from its current location
      let widgetToMove = null;
      const removeWidget = (elements: any[]): boolean => {
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          if (element.id === args.widget_id) {
            widgetToMove = elements.splice(i, 1)[0];
            return true;
          }
          if (element.elements && removeWidget(element.elements)) {
            return true;
          }
        }
        return false;
      };
      
      if (!removeWidget(elementorData)) {
        return ResponseHelpers.createErrorResponse(
          `Widget ID ${args.widget_id} not found`,
          'WIDGET_NOT_FOUND',
          'NOT_FOUND',
          `Could not locate widget with ID ${args.widget_id}`
        );
      }
      
      // Find target location
      let targetColumn = null;
      if (args.target_column_id) {
        targetColumn = ElementorHelpers.findElementRecursive(elementorData, args.target_column_id);
      } else if (args.target_section_id) {
        const section = ElementorHelpers.findElementRecursive(elementorData, args.target_section_id);
        if (section && section.elements && section.elements.length > 0) {
          targetColumn = section.elements[0]; // Use first column
        }
      }
      
      if (!targetColumn) {
        return ResponseHelpers.createErrorResponse(
          `Target location not found. Please specify a valid target_section_id or target_column_id`,
          'TARGET_LOCATION_NOT_FOUND',
          'NOT_FOUND',
          'Could not locate target location for widget move'
        );
      }
      
      // Insert widget at target location
      if (args.position !== undefined && args.position >= 0 && args.position < targetColumn.elements.length) {
        targetColumn.elements.splice(args.position, 0, widgetToMove);
      } else {
        targetColumn.elements.push(widgetToMove);
      }
      
      await this.updateElementorData({
        post_id: args.post_id,
        elementor_data: JSON.stringify(elementorData)
      });
      
      return ResponseHelpers.createSuccessResponse(
        {
          operation_type: "move_widget",
          widget_id: args.widget_id,
          target_column_id: targetColumn.id,
          position: args.position || targetColumn.elements.length - 1,
          post_id: args.post_id
        },
        `Widget ${args.widget_id} moved successfully to column ${targetColumn.id}`
      );
    } catch (error: any) {
      return ResponseHelpers.createErrorResponse(
        `Failed to move widget: ${error.message}`,
        'MOVE_WIDGET_ERROR',
        'API_ERROR',
        `Failed to move widget: ${error.message}`
      );
    }
  }

  // Element Management
  private async deleteElementorElement(args: { post_id: number; element_id: string }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      const parsedResult = await this.elementorHandler.safeGetElementorData(args.post_id);
      
      if (!parsedResult.success || !parsedResult.data) {
        return ResponseHelpers.createErrorResponse(
          `Failed to get Elementor data for post/page ID ${args.post_id}: ${parsedResult.error || 'Unknown error'}`,
          'ELEMENTOR_DATA_ERROR',
          'DATA_ERROR',
          'Could not retrieve or parse Elementor data for deleting element'
        );
      }
      
      const elementorData = parsedResult.data;
      
      // Find and remove the element
      const removeElement = (elements: any[]): boolean => {
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          if (element.id === args.element_id) {
            elements.splice(i, 1);
            return true;
          }
          if (element.elements && removeElement(element.elements)) {
            return true;
          }
        }
        return false;
      };
      
      if (!removeElement(elementorData)) {
        return ResponseHelpers.createErrorResponse(
          `Element ID ${args.element_id} not found`,
          'ELEMENT_NOT_FOUND',
          'NOT_FOUND',
          `Could not locate element with ID ${args.element_id}`
        );
      }
      
      await this.updateElementorData({
        post_id: args.post_id,
        elementor_data: JSON.stringify(elementorData)
      });
      
      return ResponseHelpers.createSuccessResponse(
        {
          operation_type: "delete_element",
          element_id: args.element_id,
          post_id: args.post_id
        },
        `Element ${args.element_id} deleted successfully`
      );
    } catch (error: any) {
      return ResponseHelpers.createErrorResponse(
        `Failed to delete element: ${error.message}`,
        'DELETE_ELEMENT_ERROR',
        'API_ERROR',
        `Failed to delete element: ${error.message}`
      );
    }
  }

  private async reorderElements(args: { post_id: number; container_id: string; element_ids: string[] }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      const parsedResult = await this.elementorHandler.safeGetElementorData(args.post_id);
      
      if (!parsedResult.success || !parsedResult.data) {
        return ResponseHelpers.createErrorResponse(
          `Failed to get Elementor data for post/page ID ${args.post_id}: ${parsedResult.error || 'Unknown error'}`,
          'ELEMENTOR_DATA_ERROR',
          'DATA_ERROR',
          'Could not retrieve or parse Elementor data for reordering elements'
        );
      }
      
      const elementorData = parsedResult.data;
      const container = ElementorHelpers.findElementRecursive(elementorData, args.container_id);
      
      if (!container) {
        return ResponseHelpers.createErrorResponse(
          `Container ID ${args.container_id} not found`,
          'CONTAINER_NOT_FOUND',
          'NOT_FOUND',
          `Could not locate container with ID ${args.container_id}`
        );
      }
      
      // Create a map of current elements
      const elementMap = new Map();
      container.elements.forEach((element: any) => {
        elementMap.set(element.id, element);
      });
      
      // Reorder elements according to provided order
      const reorderedElements = [];
      for (const elementId of args.element_ids) {
        if (elementMap.has(elementId)) {
          reorderedElements.push(elementMap.get(elementId));
          elementMap.delete(elementId);
        }
      }
      
      // Add any remaining elements that weren't specified
      elementMap.forEach(element => {
        reorderedElements.push(element);
      });
      
      container.elements = reorderedElements;
      
      await this.updateElementorData({
        post_id: args.post_id,
        elementor_data: JSON.stringify(elementorData)
      });
      
      return ResponseHelpers.createSuccessResponse(
        {
          operation_type: "reorder_elements",
          container_id: args.container_id,
          element_ids: args.element_ids,
          total_elements: reorderedElements.length,
          post_id: args.post_id
        },
        `Elements in container ${args.container_id} reordered successfully`
      );
    } catch (error: any) {
      return ResponseHelpers.createErrorResponse(
        `Failed to reorder elements: ${error.message}`,
        'REORDER_ELEMENTS_ERROR',
        'API_ERROR',
        `Failed to reorder elements: ${error.message}`
      );
    }
  }

  private async copyElementSettings(args: { post_id: number; source_element_id: string; target_element_id: string; settings_to_copy?: string[] }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      const parsedResult = await this.elementorHandler.safeGetElementorData(args.post_id);
      
      if (!parsedResult.success || !parsedResult.data) {
        return ResponseHelpers.createErrorResponse(
          `Failed to get Elementor data for post/page ID ${args.post_id}: ${parsedResult.error || 'Unknown error'}`,
          'ELEMENTOR_DATA_ERROR',
          'DATA_ERROR',
          'Could not retrieve or parse Elementor data for copying settings'
        );
      }
      
      const elementorData = parsedResult.data;
      const sourceElement = ElementorHelpers.findElementRecursive(elementorData, args.source_element_id);
      const targetElement = ElementorHelpers.findElementRecursive(elementorData, args.target_element_id);
      
      if (!sourceElement) {
        return ResponseHelpers.createErrorResponse(
          `Source element ID ${args.source_element_id} not found`,
          'SOURCE_ELEMENT_NOT_FOUND',
          'NOT_FOUND',
          `Could not locate source element with ID ${args.source_element_id}`
        );
      }
      
      if (!targetElement) {
        return ResponseHelpers.createErrorResponse(
          `Target element ID ${args.target_element_id} not found`,
          'TARGET_ELEMENT_NOT_FOUND',
          'NOT_FOUND',
          `Could not locate target element with ID ${args.target_element_id}`
        );
      }
      
      // Copy settings
      if (args.settings_to_copy && args.settings_to_copy.length > 0) {
        // Copy specific settings
        args.settings_to_copy.forEach(setting => {
          if (sourceElement.settings && sourceElement.settings[setting] !== undefined) {
            targetElement.settings = targetElement.settings || {};
            targetElement.settings[setting] = sourceElement.settings[setting];
          }
        });
      } else {
        // Copy all settings
        targetElement.settings = { ...sourceElement.settings };
      }
      
      await this.updateElementorData({
        post_id: args.post_id,
        elementor_data: JSON.stringify(elementorData)
      });
      
      return ResponseHelpers.createSuccessResponse(
        {
          operation_type: "copy_element_settings",
          source_element_id: args.source_element_id,
          target_element_id: args.target_element_id,
          settings_copied: args.settings_to_copy || 'all',
          post_id: args.post_id
        },
        `Settings copied from ${args.source_element_id} to ${args.target_element_id} successfully`
      );
    } catch (error: any) {
      return ResponseHelpers.createErrorResponse(
        `Failed to copy element settings: ${error.message}`,
        'COPY_SETTINGS_ERROR',
        'API_ERROR',
        `Failed to copy settings: ${error.message}`
      );
    }
  }

  private async getPageStructure(args: any): Promise<any> {
    return await this.elementorHandler.getPageStructure(args);
  }

  private async rebuildPageStructure(args: { post_id: number }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    return ResponseHelpers.createErrorResponse(
      'Rebuild page structure not yet implemented. Please use WordPress admin interface to rebuild page structure.',
      'NOT_IMPLEMENTED',
      'FEATURE_NOT_AVAILABLE',
      'Use WordPress admin interface for page structure rebuilding'
    );
  }

  private async validateElementorData(args: { post_id: number }): Promise<any> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      const parsedResult = await this.elementorHandler.safeGetElementorData(args.post_id);
      
      if (!parsedResult.success) {
        return ResponseHelpers.createErrorResponse(
          `Validation failed: ${parsedResult.error}`,
          'VALIDATION_FAILED',
          'DATA_ERROR',
          'Elementor data could not be parsed or validated'
        );
      }
      
      const elementorData = parsedResult.data!;
      const issues: string[] = [];
      
      // Basic validation checks
      const validateElement = (element: any, path: string) => {
        if (!element.id) {
          issues.push(`Missing ID at ${path}`);
        }
        if (!element.elType) {
          issues.push(`Missing elType at ${path}`);
        }
        if (element.elements) {
          element.elements.forEach((child: any, index: number) => {
            validateElement(child, `${path}.elements[${index}]`);
          });
        }
      };
      
      elementorData.forEach((element: any, index: number) => {
        validateElement(element, `root[${index}]`);
      });
      
      return ResponseHelpers.createSuccessResponse(
        {
          operation_type: "validate_elementor_data",
          post_id: args.post_id,
          is_valid: issues.length === 0,
          total_elements: elementorData.length,
          issues: issues,
          validation_passed: issues.length === 0
        },
        `Elementor data validation ${issues.length === 0 ? 'passed' : 'failed'} for post ID ${args.post_id}`
      );
    } catch (error: any) {
      return ResponseHelpers.createErrorResponse(
        `Failed to validate Elementor data: ${error.message}`,
        'VALIDATION_ERROR',
        'API_ERROR',
        `Validation process failed: ${error.message}`
      );
    }
  }
}