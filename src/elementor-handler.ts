import { WordPressClient } from './wordpress-client.js';
import { ElementorDataParser, TempFileManager } from './utils.js';
import { ParsedElementorData, TempFileResult } from './types.js';

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

  // Original methods (these will need to be extracted from index.ts)
  async getElementorData(args: { post_id: number }): Promise<{ content: Array<{ type: string; text: string }> }> {
    // This method needs to be extracted from the original index.ts
    // For now, this is a placeholder
    throw new Error('getElementorData method needs to be implemented');
  }

  async getPageStructure(args: { post_id: number; include_settings?: boolean }): Promise<{ content: Array<{ type: string; text: string }> }> {
    // This method needs to be extracted from the original index.ts
    // For now, this is a placeholder
    throw new Error('getPageStructure method needs to be implemented');
  }
}