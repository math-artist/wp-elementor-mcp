export interface WordPressConfig {
  baseUrl: string;
  username: string;
  applicationPassword: string;
}

export interface ParsedElementorData {
  success: boolean;
  data?: any[];
  rawData?: string;
  error?: string;
  debugInfo?: string;
}

export interface TempFileResult {
  file_path: string;
  size_bytes: number;
  post_id: number;
  created: string;
}