import { WordPressClient } from './wordpress-client.js';
import { ElementorDataParser, TempFileManager } from './utils.js';
import { ParsedElementorData, TempFileResult } from './types.js';
import { ResponseHelpers, ElementorHelpers } from './helpers.js';

export class ElementorDataHandler {
  constructor(private wordPressClient: WordPressClient) {}

  // Safe method to get parsed Elementor data with comprehensive error handling
  async safeGetElementorData(postId: number): Promise<ParsedElementorData> {
    try {
      const response = await this.getElementorData({ post_id: postId });
      const responseText = response.content[0].text;
      
      return ElementorDataParser.parseElementorResponse(responseText);
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to retrieve Elementor data: ${error.message}`
      };
    }
  }

  // NEW: Get Elementor data and write to temp file
  async getElementorDataToFile(args: { post_id: number }): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      console.error(`📁 Getting Elementor data for post ${args.post_id} and writing to temp file...`);
      
      // Get the raw Elementor data
      const axios = this.wordPressClient.getAxiosInstance();
      const config = this.wordPressClient.getConfig();
      
      const response = await this.wordPressClient.safeApiCall(
        () => axios.get(`${config.baseUrl}/wp-admin/admin-ajax.php`, {
          params: {
            action: 'mcp_get_elementor_data',
            post_id: args.post_id,
            format: 'json',
            include_meta: 'true'
          }
        }),
        'get Elementor data for temp file',
        `post ID ${args.post_id}`
      );

      // Parse the response to extract actual data
      const parsedData = ElementorDataParser.parseElementorResponse(response.data);
      
      if (!parsedData.success) {
        return {
          content: [{
            type: 'text',
            text: `Error parsing Elementor data: ${parsedData.error}`
          }]
        };
      }

      // Write to temp file
      const tempFileResult = TempFileManager.writeElementorDataToFile(args.post_id, parsedData.data);
      
      console.error(`✅ Elementor data written to temp file: ${tempFileResult.file_path}`);
      console.error(`📊 File size: ${tempFileResult.size_bytes} bytes`);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(tempFileResult, null, 2)
        }]
      };
    } catch (error: any) {
      console.error(`❌ Error writing Elementor data to temp file: ${error.message}`);
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }]
      };
    }
  }

  // NEW: Get page structure and write to temp file
  async getPageStructureToFile(args: { post_id: number; include_settings?: boolean }): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      console.error(`📁 Getting page structure for post ${args.post_id} and writing to temp file...`);
      
      // Get page structure first
      const structureResponse = await this.getPageStructure(args);
      const structureData = JSON.parse(structureResponse.content[0].text);
      
      // Write to temp file
      const tempFileResult = TempFileManager.writeElementorDataToFile(args.post_id, structureData);
      
      console.error(`✅ Page structure written to temp file: ${tempFileResult.file_path}`);
      console.error(`📊 File size: ${tempFileResult.size_bytes} bytes`);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(tempFileResult, null, 2)
        }]
      };
    } catch (error: any) {
      console.error(`❌ Error writing page structure to temp file: ${error.message}`);
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }]
      };
    }
  }

  // NEW: Backup Elementor data to temp file
  async backupElementorDataToFile(args: { post_id: number; backup_name?: string }): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      console.error(`📁 Creating backup of Elementor data for post ${args.post_id} to temp file...`);
      
      // Get the full Elementor data
      const dataResponse = await this.getElementorDataToFile({ post_id: args.post_id });
      const tempFileInfo = JSON.parse(dataResponse.content[0].text);
      
      console.error(`✅ Backup created at: ${tempFileInfo.file_path}`);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            ...tempFileInfo,
            backup_name: args.backup_name || `backup-${new Date().toISOString()}`,
            backup_type: 'full_elementor_data'
          }, null, 2)
        }]
      };
    } catch (error: any) {
      console.error(`❌ Error creating Elementor data backup: ${error.message}`);
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }]
      };
    }
  }

  async getElementorData(args: { post_id: number }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    return this.wordPressClient.safeApiCall(async () => {
      console.error(`Getting Elementor data for ID: ${args.post_id}`);
      
      const axios = this.wordPressClient.getAxiosInstance();
      
      // Try to get as post first, then as page if that fails
      let response;
      let postType = 'post';
      let debugInfo = '';
      
      try {
        console.error(`Trying to fetch as post: posts/${args.post_id}`);
        response = await axios.get(`posts/${args.post_id}`, {
          params: { context: 'edit' }
        });
        debugInfo += `Found as post (ID: ${args.post_id})\n`;
      } catch (postError: any) {
        console.error(`Post fetch failed: ${postError.response?.status} - ${postError.response?.statusText}`);
        
        if (postError.response?.status === 404) {
          // Try as page
          try {
            console.error(`Trying to fetch as page: pages/${args.post_id}`);
            response = await axios.get(`pages/${args.post_id}`, {
              params: { context: 'edit' }
            });
            postType = 'page';
            debugInfo += `Found as page (ID: ${args.post_id})\n`;
          } catch (pageError: any) {
            console.error(`Page fetch failed: ${pageError.response?.status} - ${pageError.response?.statusText}`);
            
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
            
            return ResponseHelpers.createErrorResponse(
              errorDetails.trim(),
              "POST_PAGE_NOT_FOUND",
              "NOT_FOUND",
              "Post/Page ID not found in either posts or pages endpoints"
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
          
          return ResponseHelpers.createSuccessResponse(
            {
              post_id: args.post_id,
              post_type: postType,
              title: data.title?.rendered || data.title?.raw || 'Unknown',
              status: data.status,
              edit_mode: elementorEditMode,
              elementor_data: parsedData,
              metadata: {
                has_page_settings: !!data.meta?._elementor_page_settings,
                has_elementor_data: true,
                elements_count: Array.isArray(parsedData) ? parsedData.length : 0,
                version: elementorVersion
              }
            },
            `Successfully retrieved Elementor data for ${postType} ID ${args.post_id} with ${Array.isArray(parsedData) ? parsedData.length : 0} elements`
          );
        } catch (parseError) {
          debugInfo += `⚠️ Elementor data found but failed to parse JSON\n`;
          return ResponseHelpers.createErrorResponse(
            `Failed to parse Elementor data for ${postType} ID ${args.post_id}: JSON parsing error`,
            'PARSE_ERROR',
            'DATA_FORMAT_ERROR',
            `${debugInfo}\nRaw data: ${elementorData?.substring(0, 200)}...`
          );
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
        
        return ResponseHelpers.createErrorResponse(
          `No Elementor data found for ${postType} ID ${args.post_id}`,
          'NO_ELEMENTOR_DATA',
          'DATA_NOT_FOUND',
          `${debugInfo}\nAvailable meta keys: ${data.meta ? Object.keys(data.meta).join(', ') : 'None'}`
        );
      }
    }, 'getElementorData', `post/page ID ${args.post_id}`);
  }

  async getPageStructure(args: { post_id: number; include_settings?: boolean }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const authCheck = this.wordPressClient.ensureAuthenticated();
    if (authCheck) return authCheck;
    
    try {
      console.error(`🏗️ Getting page structure for ID: ${args.post_id}`);
      
      // Get current Elementor data using safe parsing utility
      const parsedResult = await this.safeGetElementorData(args.post_id);
      
      if (!parsedResult.success || !parsedResult.data) {
        console.error(`❌ Failed to get Elementor data: ${parsedResult.error}`);
        return ResponseHelpers.createErrorResponse(
          `Could not get Elementor data for post/page ID ${args.post_id}: ${parsedResult.error || 'Unknown error'}`,
          'GET_PAGE_STRUCTURE_ERROR',
          'API_ERROR',
          'Failed to retrieve Elementor data'
        );
      }
      
      const elementorData = parsedResult.data;
      console.error(`✅ Successfully parsed structure for ${elementorData.length} top-level elements`);
      
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
      
      return ResponseHelpers.createSuccessResponse(
        {
          post_id: args.post_id,
          structure: structure,
          total_elements: elementorData.length,
          include_settings: args.include_settings || false
        },
        `Successfully retrieved page structure for post/page ID ${args.post_id} with ${elementorData.length} top-level elements`
      );
    } catch (error: any) {
      return ResponseHelpers.createErrorResponse(
        `Failed to get page structure: ${error.message}`,
        "GET_PAGE_STRUCTURE_ERROR",
        "API_ERROR",
        "Operation failed"
      );
    }
  }
}