# Elementor WordPress MCP Server v1.6.1

A powerful, modular Model Context Protocol (MCP) server for WordPress and Elementor. This server provides AI assistants with scalable capabilities—from basic content management to advanced page building—through an intelligent configuration system.

## 🆕 What's New in v1.6.1

- **Enhanced Error Handling**: Much more informative 404 and connection error messages with debugging information
- **New Content Discovery Tool**: `list_all_content` - Find all posts/pages with Elementor status indicators (✅/⚠️/❌)
- **Improved Debugging**: Console logging, connection diagnostics, and detailed request information
- **Better WordPress Integration**: Enhanced data retrieval with `context: 'edit'` for full meta access
- **Connection Troubleshooting**: Automatic timeout handling and enhanced error reporting
- **Comprehensive Test Suite**: Added credential testing with real WordPress connections

## ✨ Key Features

- **Modular Configuration**: Scale from 20 to 34 tools based on your needs
- **Complete Page Building**: Create sections, containers, widgets, and complex layouts
- **Performance Optimized**: Incremental updates, chunked data, smart caching
- **User-Centric Design**: Essential → Standard → Advanced → Full progression
- **True Elementor Integration**: Direct manipulation of sections, columns, and widgets
- **Universal Compatibility**: Works with posts, pages, and custom post types
- **Production Ready**: Type-safe, thoroughly tested, comprehensive documentation

## 🎯 Quick Start

Choose your complexity level:

```bash
# Essential Mode (20 tools) - Perfect for beginners
ELEMENTOR_MINIMAL_MODE=true npx wp-elementor-mcp

# Standard Mode (32 tools) - Great for most users (default)
npx wp-elementor-mcp

# Advanced Mode (34 tools) - For power users  
ELEMENTOR_MCP_MODE=advanced npx wp-elementor-mcp

# Full Mode (34 tools) - Everything enabled (requires Elementor Pro)
ELEMENTOR_ENABLE_ALL=true npx wp-elementor-mcp
```


## 📊 Configuration Modes

| Mode | Tools | Best For | Capabilities |
|------|-------|----------|--------------|
| **Essential** | 20 | Learning, basic tasks | WordPress CRUD + Basic Elementor |
| **Standard** | 32 | Most users | + Page building & element management |
| **Advanced** | 34 | Power users | + Performance tools & advanced operations |
| **Full** | 34 | Pro workflows | + Templates, global settings, revisions* |

_*Pro features require Elementor Pro license_

## 🛠️ Prerequisites

- Node.js 18+
- WordPress site with REST API enabled
- WordPress Application Password (not regular password)
- Elementor plugin (for page building features)
- Elementor Pro (optional, for template and global features)

## 📦 Installation

### Option 1: NPX (Recommended)
```bash
npx wp-elementor-mcp
```

### Option 2: Local Development
```bash
git clone https://github.com/Huetarded/wp-elementor-mcp.git
cd wp-elementor-mcp
npm install
npm run build
```

### Option 3: Global Installation
```bash
npm install -g wp-elementor-mcp
wp-elementor-mcp
```

## ⚙️ WordPress Setup

### 1. Create Application Password
1. WordPress Admin → Users → Profile
2. Scroll to Application Passwords
3. Add name: "MCP Server"
4. Copy the generated password immediately!

### 2. User Permissions
Ensure your WordPress user can:
- Create/edit/delete posts and pages
- Upload media files
- Access Elementor data

## 🔌 MCP Client Configuration

### Claude Desktop
```json
{
  "mcpServers": {
    "elementor-wordpress": {
      "command": "npx",
      "args": ["wp-elementor-mcp"],
      "env": {
        "ELEMENTOR_MCP_MODE": "standard",
        "WORDPRESS_BASE_URL": "https://yoursite.com",
        "WORDPRESS_USERNAME": "your-username",
        "WORDPRESS_APPLICATION_PASSWORD": "xxxx xxxx xxxx xxxx xxxx xxxx"
      }
    }
  }
}
```

### Continue.dev
```json
{
  "name": "elementor-wordpress",
  "command": "npx",
  "args": ["wp-elementor-mcp"],
  "env": {
    "ELEMENTOR_MCP_MODE": "advanced",
    "WORDPRESS_BASE_URL": "https://yoursite.com",
    "WORDPRESS_USERNAME": "your-username", 
    "WORDPRESS_APPLICATION_PASSWORD": "xxxx xxxx xxxx xxxx xxxx xxxx"
  }
}
```

### Environment Variables

#### Mode Selection
```bash
# Primary mode setting
ELEMENTOR_MCP_MODE=essential    # 20 tools - Basic WordPress + Elementor
ELEMENTOR_MCP_MODE=standard     # 32 tools - + Page building (default)
ELEMENTOR_MCP_MODE=advanced     # 34 tools - + Performance tools
ELEMENTOR_MCP_MODE=full         # 34 tools - + Pro features (stubs)

# Quick mode shortcuts
ELEMENTOR_MINIMAL_MODE=true     # Same as essential mode
ELEMENTOR_ENABLE_ALL=true       # Same as full mode
```

#### WordPress Connection
```bash
WORDPRESS_BASE_URL=https://yoursite.com
WORDPRESS_USERNAME=your-username
WORDPRESS_APPLICATION_PASSWORD=xxxx xxxx xxxx xxxx
```

#### Individual Feature Toggles (optional)
```bash
ELEMENTOR_ENABLE_TEMPLATES=true
ELEMENTOR_ENABLE_PERFORMANCE=true
```

## 🎛️ Available Tools by Mode

### Always Available (1 tool)
- `configure_wordpress` - Manual WordPress connection setup

### Essential Mode (+19 tools)
**WordPress Operations:**
- `get_posts`, `get_post`, `create_post`, `update_post`
- `get_pages`, `create_page`, `update_page`
- `get_media`, `upload_media`
- `list_all_content` - Content discovery with Elementor status

**Basic Elementor:**
- `get_elementor_templates`, `get_elementor_data`, `update_elementor_data`
- `get_elementor_widget`, `update_elementor_widget`, `get_elementor_elements`
- `update_elementor_section`, `get_elementor_data_chunked`
- `backup_elementor_data`, `clear_elementor_cache`

### Standard Mode (+12 tools)
**Section & Container Creation:**
- `create_elementor_section` - Create sections with columns
- `create_elementor_container` - Create Flexbox containers
- `add_column_to_section` - Add columns to sections
- `duplicate_section` - Clone sections with content

**Widget Management:**
- `add_widget_to_section` - Add widgets to containers
- `insert_widget_at_position` - Insert at specific positions
- `clone_widget` - Duplicate widgets
- `move_widget` - Move widgets between containers

**Element Operations:**
- `delete_elementor_element` - Remove elements safely
- `reorder_elements` - Change element order
- `copy_element_settings` - Copy settings between elements

**Page Analysis:**
- `get_page_structure` - Get simplified page overview

### Advanced Mode (+2 tools)
**Performance:**
- `clear_elementor_cache_by_page` - Page-specific cache clearing

**Advanced Operations:**
- `find_elements_by_type` - Search elements by type

### Full Mode (+0 new tools, enables Pro features)
*Currently implemented as stubs - requires Elementor Pro integration*
- Template management capabilities
- Global color and font settings
- Custom field integration  
- Revision and history features

## 💡 Example Usage

### Basic Content Management
```text
Create a new WordPress page titled "About Us" with a professional layout
```

### Elementor Page Building
```text
Create a new section in page ID 123 with 3 columns, then add a heading widget to the first column with the text "Welcome to Our Site"
```

### Advanced Layout Creation
```text
Duplicate the hero section from page 45, then move the call-to-action button widget to the second column and change its text to "Get Started Today"
```

### Performance-Optimized Updates
```text
Update only the HTML widget with ID "abc123" in page 67 to show our latest promotion, without loading the entire page data
```

### Element Discovery
```text
Show me all the text and heading widgets on page 89 so I can update the content
```

## 🚀 Development & Testing

### NPM Scripts
```bash
npm run build                    # Build TypeScript
npm run start                    # Standard mode
npm run start:essential          # Essential mode  
npm run start:advanced           # Advanced mode
npm run start:full              # Full mode
npm run test:config             # Test configuration system
```

### Comprehensive Testing Suite

**Quick Server Test**:
```bash
npm test                         # Basic connectivity test
```

**Schema & Structure Validation** (No WordPress required):
```bash
npm run test:validate           # Validate all tool schemas
```
- ✅ 100% validation rate achieved
- Tests all 120 tools across 4 modes
- Validates naming conventions and descriptions
- Checks input schema integrity

**Full Functionality Test** (WordPress credentials required):
```bash
npm run test:comprehensive      # Test actual functionality
```
- Tests tool execution and response handling
- Performance analysis and timing
- Error handling validation
- Requires WORDPRESS_URL, WORDPRESS_USERNAME, WORDPRESS_PASSWORD

**Complete Test Report**:
```bash
npm run test:summary           # Detailed project analysis
```
- Project overview and build status
- Tool coverage breakdown (11/11 categories)
- Configuration mode analysis
- Performance metrics and recommendations

**Run All Tests**:
```bash
npm run test:all               # Complete test suite
```

### Test Results Overview
- **Total Tools Tested**: 120 (across all modes)
- **Schema Validation**: 100% ✅
- **Tool Categories**: 11/11 covered ✅
- **Configuration Modes**: 4 different modes ✅
- **Performance**: Average 1ms validation time ✅

### Project Structure
```
├── src/
│   ├── index.ts              # Main server implementation
│   └── server-config.ts      # Configuration system
├── dist/                     # Compiled output
├── CONFIGURATION.md          # Complete config guide
└── test-simple.js           # Configuration testing
```

## ⚡ Performance Features

### Smart Data Handling
- Incremental Updates: Change individual widgets without full page reloads
- Chunked Loading: Process large pages in manageable pieces  
- Element Discovery: Lightweight element ID and type listing
- Automatic Caching: Intelligent cache invalidation after updates

### Memory Optimization
- Modular Loading: Only load tools you actually use
- Selective Features: Environment-based feature toggling
- Efficient Data Transfer: Minimal payloads for maximum performance

## 🔍 Troubleshooting

⚠️ **Having issues with 404 errors or "No Elementor data found"?** See our comprehensive [TROUBLESHOOTING.md](TROUBLESHOOTING.md) guide for detailed debugging steps and solutions.

### Quick Diagnostic Tools
```javascript
// New! List all posts and pages with Elementor status
await mcp.listAllContent({ include_all_statuses: true });

// Debug specific post/page issues
await mcp.getElementorData({ post_id: 123 });
```

### Connection Issues
```bash
# Test your WordPress connection
curl https://yoursite.com/wp-json/wp/v2/posts
```

### Tool Count Issues
```bash
# Check your current configuration
npm run test:config

# Start with fewer tools
ELEMENTOR_MINIMAL_MODE=true npx wp-elementor-mcp
```

### Performance Issues
- Use Essential or Standard mode for basic tasks
- Enable Advanced mode only when needed
- Use incremental updates for large pages
- Monitor tool usage and adjust configuration accordingly

### Permission Errors
- Verify application password is correct
- Check WordPress user permissions
- Ensure REST API is enabled
- Test with a different user account

## 🛡️ Security Best Practices

- Use HTTPS for WordPress sites in production
- Rotate application passwords regularly
- Limit user permissions to minimum required
- Monitor API usage for unusual activity
- Keep WordPress and Elementor updated

## 📈 Migration Guide

### From Previous Versions
```bash
# Old way - all tools always loaded
npx wp-elementor-mcp@1.4.0

# New way - choose your level  
ELEMENTOR_MCP_MODE=standard npx wp-elementor-mcp
```

### Recommended Upgrade Path
1. Start Essential: Get familiar with core features
2. Move to Standard: Add page building capabilities
3. Try Advanced: Include performance tools
4. Use Full: Only with Elementor Pro license

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Update documentation
5. Submit a pull request

### Development Setup
```bash
git clone https://github.com/Huetarded/wp-elementor-mcp.git
cd wp-elementor-mcp
npm install
npm run dev  # Watch mode
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/Huetarded/wp-elementor-mcp)
- [Issue Tracker](https://github.com/Huetarded/wp-elementor-mcp/issues)
- [NPM Package](https://www.npmjs.com/package/wp-elementor-mcp)

---

Transform your WordPress workflow with intelligent, modular MCP tools that scale with your needs! 