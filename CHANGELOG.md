# Changelog

All notable changes to the WordPress Elementor MCP Server will be documented in this file.

## [1.6.5] - 2024-12-19

### 📋 Structured JSON Responses
- **Consistent Response Format**: All tools now return standardized `{status: "success"/"error", data: {...}}` JSON format
- **Enhanced Error Objects**: Rich error responses with `error_type`, `code`, and detailed `message` fields
- **Better Client Integration**: Standardized parsing for all MCP clients (Claude Desktop, Continue.dev, Cursor)
- **Comprehensive Validation**: 100% response format compliance across all 34 tools

### 🔧 Response Format Features
- **Success Format**: `{status: "success", data: {actual_response_data}, message: "Operation completed"}`
- **Error Format**: `{status: "error", data: {message, code, error_type, details}}`
- **Debugging Support**: Enhanced error context and actionable feedback
- **Client Compatibility**: Works seamlessly with structured response parsing

### ✨ User Experience Improvements
- **Clear Status Indicators**: Immediate success/error recognition in all responses
- **Actionable Error Messages**: Detailed guidance for resolving issues
- **Rich Data Context**: Comprehensive information in both success and error cases
- **Consistent Parsing**: Eliminates client-side response format guesswork

### 🛠️ Developer Benefits
- **Type Safety**: Predictable response structures for better integration
- **Error Handling**: Standardized error codes and categories across all operations
- **Debugging**: Enhanced logging and error context for troubleshooting
- **Documentation**: Updated guides reflect new response format standards

## [1.6.4] - 2024-12-19

### 🔧 MCP Client Fixes
- **Response Size Limits**: Added 50MB response limit and 10MB request limit to axios configuration
- **Enhanced Timeout Handling**: Increased timeout to 60 seconds for large operations with better error reporting
- **Improved Error Handling**: Added comprehensive error handling for timeouts, server errors, and large responses
- **Better Data Parsing**: Enhanced JSON parsing with detailed error messages for Elementor data operations
- **Diagnostic Logging**: Added extensive debug logging for troubleshooting MCP client issues
- **Safe API Calls**: Implemented `safeApiCall` utility for consistent error handling across all operations

### 🐛 Bug Fixes
- **getElementorElements**: Fixed parsing errors and added graceful fallbacks for corrupted data
- **getPageStructure**: Improved error handling and response formatting
- **getElementorWidget**: Enhanced widget search with better error messages
- **addWidgetToSection**: Fixed timeout issues and added detailed progress logging

### 📊 Improvements
- **Response Monitoring**: Added response size logging for large data operations
- **Network Error Handling**: Improved handling of connection timeouts and server errors
- **Data Validation**: Enhanced validation for Elementor data structure before processing

## [1.6.3] - 2025-06-10

### 🧹 Maintenance
- **Project Cleanup**: Removed test and debug files created during development
- **Security**: Ensured `.cursor/` folder is properly excluded from git to protect API keys
- **Documentation**: Enhanced pull request documentation and release processes
- **Development**: Improved debugging workflow and local testing procedures

### 🔧 Improved
- **Development Experience**: Streamlined local testing and debugging setup
- **Security**: Better protection of sensitive configuration files
- **Documentation**: Enhanced contribution guidelines and release documentation

## [1.6.2] - 2024-12-10

### ✨ Added
- **New Tool**: `list_all_content` - Content discovery with Elementor status indicators (✅/⚠️/❌)
- **Enhanced Error Handling**: Much more informative 404 and connection error messages
- **SSL Certificate Support**: Automatic SSL handling for local development sites (`.local`, `.dev`, `.test`, `localhost`)
- **Debugging Infrastructure**: Console logging and detailed request information
- **Connection Diagnostics**: Automatic timeout handling (30s) and enhanced error reporting
- **Test Suite**: Comprehensive credential testing with real WordPress connections
- **Documentation**: Added `TROUBLESHOOTING.md`, `CREDENTIAL-TESTING.md`, and `SSL-SUPPORT.md` guides

### 🔧 Improved
- **WordPress Integration**: Enhanced data retrieval with `context: 'edit'` for full meta access
- **Error Messages**: Much more informative debugging information for connection issues
- **Data Discovery**: Better handling of posts/pages that may not have Elementor data
- **Connection Setup**: Enhanced axios configuration with timeout and debug logging

### 🛠️ Fixed
- **404 Errors**: Better handling and diagnosis of "Request failed with status code 404"
- **Missing Elementor Data**: Improved detection and reporting of "No Elementor data found"
- **SSL Certificate Errors**: Self-signed certificate support for local development environments
- **Post/Page Discovery**: Enhanced search and filtering capabilities
- **Connection Issues**: Better error messages for authentication and network problems

### 📚 Documentation
- Added comprehensive troubleshooting guide
- Created credential testing documentation
- Enhanced error message examples
- Added debugging tips and common solutions

### 🧪 Testing
- Added `test:enhanced` script for enhanced features
- Added `test:credentials` script for credential testing
- Updated tool count validation for new `list_all_content` tool
- Enhanced test coverage for error scenarios

## [1.6.1] - 2024-12-09

### ✨ Added
- **New Tool**: `list_all_content` - Content discovery with Elementor status indicators (✅/⚠️/❌)
- **Enhanced Error Handling**: Much more informative 404 and connection error messages
- **Debugging Infrastructure**: Console logging and detailed request information
- **Connection Diagnostics**: Automatic timeout handling (30s) and enhanced error reporting
- **Test Suite**: Comprehensive credential testing with real WordPress connections
- **Documentation**: Added `TROUBLESHOOTING.md` and `CREDENTIAL-TESTING.md` guides

### 🔧 Improved
- **WordPress Integration**: Enhanced data retrieval with `context: 'edit'` for full meta access
- **Error Messages**: Much more informative debugging information for connection issues
- **Data Discovery**: Better handling of posts/pages that may not have Elementor data
- **Connection Setup**: Enhanced axios configuration with timeout and debug logging

### 🛠️ Fixed
- **404 Errors**: Better handling and diagnosis of "Request failed with status code 404"
- **Missing Elementor Data**: Improved detection and reporting of "No Elementor data found"
- **Post/Page Discovery**: Enhanced search and filtering capabilities
- **Connection Issues**: Better error messages for authentication and network problems

## [1.6.0] - Previous Release

### Features
- Modular configuration system (Essential → Standard → Advanced → Full)
- Complete Elementor page building capabilities
- Performance optimizations and caching
- Comprehensive WordPress operations
- Advanced element management tools

### Tools
- 34 total tools across different modes
- WordPress CRUD operations
- Elementor section/container creation
- Widget management and manipulation
- Performance and caching tools

## Previous Versions

See Git history for detailed information about earlier versions.

---

### Legend
- ✨ Added: New features
- 🔧 Improved: Enhanced existing features  
- 🛠️ Fixed: Bug fixes
- 📚 Documentation: Documentation changes
- 🧪 Testing: Test-related changes
- ⚠️ Breaking: Breaking changes (when applicable) 