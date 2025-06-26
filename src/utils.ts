import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { ParsedElementorData, TempFileResult } from './types.js';

export class ElementorDataParser {
  static parseElementorResponse(responseText: string): ParsedElementorData {
    try {
      // Check if this is a direct API response
      if (responseText.trim().startsWith('[') || responseText.trim().startsWith('{')) {
        try {
          const data = JSON.parse(responseText);
          return {
            success: true,
            data: Array.isArray(data) ? data : [data]
          };
        } catch (directParseError) {
          return {
            success: false,
            error: `Direct JSON parse failed: ${directParseError}`,
            rawData: responseText
          };
        }
      }

      // Extract debug info and JSON data from formatted response
      let debugInfo = '';
      let jsonData = '';

      if (responseText.includes('--- Elementor Data ---')) {
        const parts = responseText.split('--- Elementor Data ---');
        debugInfo = parts[0]?.trim() || '';
        jsonData = parts[1]?.trim() || '';
      } else if (responseText.includes('--- Raw Elementor Data ---')) {
        const parts = responseText.split('--- Raw Elementor Data ---');
        debugInfo = parts[0]?.trim() || '';
        jsonData = parts[1]?.trim() || '';
      } else {
        // Try to find JSON-like content
        const jsonMatch = responseText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
        if (jsonMatch) {
          jsonData = jsonMatch[1];
          debugInfo = responseText.replace(jsonMatch[1], '').trim();
        } else {
          return {
            success: false,
            error: 'No JSON data found in response',
            rawData: responseText,
            debugInfo: responseText
          };
        }
      }

      // Validate that we have data to parse
      if (!jsonData || jsonData.trim() === '') {
        return {
          success: false,
          error: 'Empty JSON data in response',
          rawData: responseText,
          debugInfo
        };
      }

      // Check for known error messages in debug info
      if (debugInfo.includes('No Elementor data found') || 
          debugInfo.includes('does not use Elementor builder') ||
          debugInfo.includes('failed to parse JSON')) {
        return {
          success: false,
          error: 'No valid Elementor data available',
          debugInfo,
          rawData: jsonData
        };
      }

      // Attempt to parse the JSON data
      try {
        const parsedData = JSON.parse(jsonData);
        
        // Ensure we have an array
        const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];
        
        return {
          success: true,
          data: dataArray,
          debugInfo
        };
      } catch (parseError: any) {
        // Try to clean the JSON and parse again
        try {
          // Remove common JSON formatting issues
          const cleanedJson = jsonData
            .replace(/^```json\s*/, '')  // Remove markdown code blocks
            .replace(/\s*```$/, '')
            .replace(/^```\s*/, '')
            .replace(/\n\s*\n/g, '\n')  // Remove extra newlines
            .trim();

          const parsedData = JSON.parse(cleanedJson);
          const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];
          
          return {
            success: true,
            data: dataArray,
            debugInfo
          };
        } catch (cleanedParseError) {
          return {
            success: false,
            error: `JSON parse failed: ${parseError.message}. Cleaned parse also failed: ${cleanedParseError}`,
            rawData: jsonData,
            debugInfo
          };
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Parsing utility failed: ${error.message}`,
        rawData: responseText
      };
    }
  }
}

export class TempFileManager {
  private static readonly TEMP_DIR = resolve(process.cwd(), 'tmp', 'elementor-data');

  static ensureTempDir(): void {
    if (!existsSync(this.TEMP_DIR)) {
      mkdirSync(this.TEMP_DIR, { recursive: true });
    }
  }

  static writeElementorDataToFile(postId: number, data: any): TempFileResult {
    this.ensureTempDir();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `page-${postId}-${timestamp}.json`;
    const filePath = join(this.TEMP_DIR, filename);
    
    const jsonString = JSON.stringify(data, null, 2);
    writeFileSync(filePath, jsonString, 'utf8');
    
    return {
      file_path: filePath,
      size_bytes: Buffer.byteLength(jsonString, 'utf8'),
      post_id: postId,
      created: new Date().toISOString()
    };
  }
}