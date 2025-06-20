import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { WordPressConfig } from './types.js';

export class WordPressClient {
  private axiosInstance: AxiosInstance | null = null;
  private config: WordPressConfig | null = null;

  constructor() {
    this.initializeFromEnvironment();
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
    const baseURL = config.baseUrl.endsWith('/') 
      ? `${config.baseUrl}wp-json/wp/v2/`
      : `${config.baseUrl}/wp-json/wp/v2/`;
      
    const auth = Buffer.from(`${config.username}:${config.applicationPassword}`).toString('base64');
    
    const httpsAgent = new https.Agent({
      rejectUnauthorized: this.shouldRejectUnauthorized(config.baseUrl)
    });
    
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      httpsAgent: httpsAgent,
      timeout: 60000, // Increased to 60 second timeout for large operations
      maxContentLength: 50 * 1024 * 1024, // 50MB response limit
      maxBodyLength: 10 * 1024 * 1024, // 10MB request limit
    });
    
    // Add request interceptor for debugging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.error(`Making request to: ${config.method?.toUpperCase()} ${config.url}`);
        if (config.data && typeof config.data === 'string' && config.data.length > 1000) {
          console.error(`Request data size: ${config.data.length} characters`);
        }
        return config;
      },
      (error) => {
        console.error(`Request error: ${error.message}`);
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor for debugging and error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.error(`Response received: ${response.status} ${response.statusText}`);
        if (response.data && typeof response.data === 'string' && response.data.length > 10000) {
          console.error(`Response data size: ${response.data.length} characters`);
        } else if (response.data && Array.isArray(response.data)) {
          console.error(`Response array length: ${response.data.length} items`);
        }
        return response;
      },
      (error) => {
        // Enhanced error logging
        if (error.code === 'ECONNABORTED') {
          console.error(`🕐 Request timeout: ${error.message}`);
        } else if (error.response?.status) {
          console.error(`❌ HTTP Error: ${error.response.status} ${error.response.statusText}`);
          console.error(`URL: ${error.config?.url}`);
          if (error.response.data?.message) {
            console.error(`WordPress Error: ${error.response.data.message}`);
          }
        } else {
          console.error(`🔥 Network/Connection Error: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );
    
    this.config = config;
  }

  private shouldRejectUnauthorized(baseUrl: string): boolean {
    try {
      const url = new URL(baseUrl);
      
      // Allow self-signed certificates for local development
      const isLocal = url.hostname === 'localhost' || 
                     url.hostname === '127.0.0.1' ||
                     url.hostname.endsWith('.local') ||
                     url.hostname.endsWith('.dev') ||
                     url.hostname.endsWith('.test');
      
      if (isLocal) {
        console.error(`🔓 Allowing self-signed certificates for local development site: ${url.hostname}`);
        return false;
      }
      
      // For production sites, require valid certificates
      console.error(`🔒 Requiring valid SSL certificates for production site: ${url.hostname}`);
      return true;
    } catch (error) {
      // If URL parsing fails, default to requiring valid certificates
      console.error(`⚠️ Could not parse URL ${baseUrl}, defaulting to requiring valid SSL certificates`);
      return true;
    }
  }

  ensureAuthenticated() {
    if (!this.axiosInstance || !this.config) {
      throw new Error('WordPress connection not configured. Please set environment variables: WORDPRESS_BASE_URL, WORDPRESS_USERNAME, WORDPRESS_APPLICATION_PASSWORD.');
    }
  }

  // Utility method to handle large responses with better error reporting
  async safeApiCall<T>(operation: () => Promise<T>, operationName: string, context: string = ''): Promise<T> {
    try {
      const startTime = Date.now();
      console.error(`🚀 Starting ${operationName}${context ? ` for ${context}` : ''}`);
      
      const result = await operation();
      
      const duration = Date.now() - startTime;
      console.error(`✅ Completed ${operationName} in ${duration}ms`);
      
      return result;
    } catch (error: any) {
      console.error(`❌ Failed ${operationName}${context ? ` for ${context}` : ''}`);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error(`Request timeout for ${operationName}. The operation took longer than 60 seconds.`);
      } else if (error.response?.status) {
        throw new Error(`HTTP ${error.response.status}: ${error.response.data?.message || error.response.statusText}`);
      } else {
        throw new Error(`Network error: ${error.message}`);
      }
    }
  }

  getAxiosInstance(): AxiosInstance {
    this.ensureAuthenticated();
    return this.axiosInstance!;
  }

  getConfig(): WordPressConfig {
    this.ensureAuthenticated();
    return this.config!;
  }
}