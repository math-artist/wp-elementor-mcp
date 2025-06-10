# Changelog

All notable changes to the WordPress Elementor MCP Server will be documented in this file.

## [1.6.1] - 2024-01-XX

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