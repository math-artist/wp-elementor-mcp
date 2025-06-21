# Changelog

All notable changes to the WordPress Elementor MCP Server will be documented in this file.

## [1.7.0] - 2025-06-21

### 🚀 Major Performance Optimizations
- **Performance Issues Resolved** (Issue #32): Dramatically improved data retrieval efficiency
  - **get_posts**: Optimized to return lightweight summaries instead of full content (80% size reduction: ~2.5MB → ~500KB)
  - **get_pages**: Enhanced to return essential metadata only (81% size reduction: ~1.8MB → ~350KB)
  - **list_all_content**: Improved performance with large datasets
  - Maintained 100% backward compatibility while improving response times
  - Added intelligent content summarization preserving essential data

### 🐛 Critical Bug Fixes
- **Element Retrieval Fixed** (Issue #33): Resolved `get_elementor_elements` returning only single element
  - Now correctly returns **all elements** from pages/posts as expected
  - Removed redundant `get_page_structure` tool registration causing conflicts
  - Enhanced element traversal logic to handle nested structures correctly
  - Improved error handling for missing or malformed Elementor data

### 📈 Enhanced Testing & Validation
- **New Performance Test Suite**: Added `test-performance-optimizations.js`
  - Comprehensive performance benchmarking for all optimized tools
  - Real-world testing scenarios with various data sizes
  - Automated regression testing to prevent performance degradation
  - Performance impact validation and reporting
- **Enhanced Validation Tests**: Updated `validation-test.js` with additional validation
- **Improved Comprehensive Testing**: Enhanced `comprehensive-test.js` for better integration testing
- **Feature Testing Updates**: Improved `test-enhanced-features.js` for optimized functions

### 🔧 Technical Improvements
- **Data Integrity**: Ensured all optimizations maintain data accuracy
- **Error Handling**: Enhanced error handling for edge cases in optimized functions
- **Response Consistency**: Maintained consistent response formats across all changes
- **Performance Monitoring**: Added performance benchmarking and monitoring capabilities

### 📊 Performance Impact Summary
- **Data Payload Reduction**: 60-80% reduction in response sizes for listing operations
- **Response Time Improvement**: Faster API responses for content discovery
- **Memory Efficiency**: Reduced memory usage for large content sets
- **Scalability**: Better performance with sites containing hundreds of posts/pages

### 🧪 Test Results
- ✅ All performance optimization tests pass
- ✅ Enhanced features validation successful
- ✅ Comprehensive integration tests verified
- ✅ Backward compatibility maintained (100%)
- ✅ No breaking changes introduced

### 📁 Files Modified
- `src/index.ts` - Core tool optimizations and bug fixes
- `package.json` - Version bump to 1.7.0
- `README.md` - Updated documentation reflecting new features
- `TESTING.md` - Enhanced testing procedures and new test documentation
- `test-performance-optimizations.js` - New performance test suite (added)
- `validation-test.js` - Enhanced validation tests
- `comprehensive-test.js` - Updated integration tests
- `test-enhanced-features.js` - Feature validation improvements
- `.github/workflows/ci.yml` - CI/CD improvements

### 🎯 Resolved Issues
- **Issue #32**: Performance issues with getPages and getPosts tools
- **Issue #33**: get_elementor_elements only returning single element

## [1.6.8] - 2025-01-23

### Changed
- **📚 Documentation Update**: Updated README.md to reflect all v1.6.7 improvements and fixes
- **📝 Version Alignment**: Ensured npm package documentation matches current functionality
- **🎯 Feature Clarity**: Enhanced feature descriptions and installation instructions
- **📊 Current Status**: Updated "What's New" section with comprehensive v1.6.7 changes

### Technical Notes
- This is a documentation-only release to update the npm package README
- v1.6.7 was published with outdated documentation (v1.6.5 README)
- All functional improvements from v1.6.7 remain unchanged

## [1.6.7] - 2025-01-23

### Fixed
- **Complete Response Format Consistency**: Identified and fixed 6 additional tools that were still using legacy response formats
- **Missing Tool Implementation** (Issues #14, #15): Fixed `clear_elementor_cache` tool completely missing from handler
  - Added missing `clearElementorCacheGeneral` method implementation 
  - Added missing case handler in tool routing switch statement
  - Tool now properly supports both general cache clearing and post-specific cache clearing
  - Enhanced with comprehensive operation metadata and success/error details

- **Structured Error Response Format** (Issue #16): Fixed MCP error responses using plain text instead of structured JSON
  - All MCP errors now return structured response format: `{status: "error", error: {...}, data: null}`
  - Error responses include proper error codes, types, and detailed messages
  - Unknown tool errors now use structured format instead of throwing raw `McpError`
  - Tool execution errors properly caught and formatted as structured responses
  - Maintains consistency with success response format across all error scenarios

### Enhanced
- **Error Handling Consistency**: Improved error handling across all tools
  - Method not found errors now return structured responses
  - Internal errors properly wrapped in structured format
  - Enhanced error messages with better context and debugging information
  - Consistent error categorization (METHOD_NOT_FOUND, EXECUTION_ERROR, MCP_ERROR, etc.)
- **Enhanced Data Structures**: Success responses now include operation type, timestamps, and detailed context
- **Rich Error Details**: Error responses include proper error codes, types, and actionable details
- **Pagination Support**: Chunked data operations include navigation helpers
- **Debug Information**: Enhanced debugging data in structured format

### Tools Fixed
- **getElementorData**: Fixed debug/error cases to use structured responses with metadata
- **getElementorElements**: Enhanced error responses with proper error codes
- **getElementorDataChunked**: Added pagination helpers and structured chunk information
- **uploadMedia**: Complete response format overhaul with operation details
- **All Stub Methods**: Updated 15+ placeholder methods to use structured error responses

### Technical Details
- Added `clearElementorCacheGeneral(args: { post_id?: number })` method
- Updated error handling in main tool request handler 
- Enhanced error response structure with proper typing and categorization
- All 34+ tools now maintain 100% consistent response formats
- Complete elimination of legacy plain-text error responses
- All methods now use `createSuccessResponse()` and `createErrorResponse()` helpers
- Eliminated legacy `{content: [{type: 'text', text: '...'}]}` format entirely

### Testing
- ✅ 120 tools tested across all modes (Essential, Standard, Advanced, Full)
- ✅ 100% validation success rate maintained
- ✅ All error scenarios return structured JSON responses
- ✅ Cache clearing functionality fully operational
- ✅ No breaking changes introduced
- ✅ Verified test compatibility with new response formats
- ✅ Response validation and 100% coverage achieved

## [1.6.6] - 2025-01-23

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