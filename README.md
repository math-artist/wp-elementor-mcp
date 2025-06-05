# Elementor WordPress MCP Server

A Model Context Protocol (MCP) server for interacting with WordPress and Elementor. This server provides AI assistants with the ability to manage WordPress content, posts, pages, media, and Elementor templates through the WordPress REST API.

## Features

- **WordPress Content Management**: Create, read, update posts and pages
- **Elementor Integration**: Get and update Elementor page data and templates
- **Media Management**: Upload and manage WordPress media library
- **Authentication**: Secure connection using WordPress application passwords
- **Type-Safe**: Built with TypeScript for better development experience

## Prerequisites

- Node.js 18 or higher
- WordPress site with REST API enabled
- WordPress Application Password (not regular password)
- Elementor plugin (for Elementor-specific features)

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the server:
   ```bash
   npm run build
   ```

## WordPress Setup

### Creating an Application Password

1. Log into your WordPress admin dashboard
2. Go to **Users** → **Profile** (or **Users** → **All Users** → Edit your user)
3. Scroll down to **Application Passwords** section
4. Enter a name for the application (e.g., "MCP Server")
5. Click **Add New Application Password**
6. **Important**: Copy the generated password immediately - you won't see it again!

### Required WordPress Permissions

Your WordPress user should have sufficient permissions to:
- Create, edit, and delete posts/pages
- Upload media files
- Access Elementor data (if using Elementor features)

## Usage

### Running the Server

```bash
npm start
```

### Connecting from MCP Clients

Add this configuration to your MCP client (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "elementor-wordpress": {
      "command": "node",
      "args": ["/path/to/your/elementor-wordpress-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

### First Time Setup

1. Start the MCP server
2. Use the `configure_wordpress` tool with your WordPress credentials:
   - **baseUrl**: Your WordPress site URL (e.g., `https://yoursite.com`)
   - **username**: Your WordPress username
   - **applicationPassword**: The application password you generated

## Available Tools

### WordPress Configuration
- `configure_wordpress` - Set up connection to your WordPress site

### Posts & Pages
- `get_posts` - Retrieve WordPress posts with filtering options
- `get_post` - Get a specific post by ID
- `create_post` - Create new posts
- `update_post` - Update existing posts
- `get_pages` - Retrieve WordPress pages

### Elementor
- `get_elementor_templates` - Get Elementor templates (requires Elementor Pro)
- `get_elementor_data` - Get Elementor page/post data
- `update_elementor_data` - Update Elementor page/post data

### Media
- `get_media` - Browse WordPress media library
- `upload_media` - Upload files to WordPress media library

## Example Usage

Here are some example commands you can use with an MCP client:

### Initial Setup
```
Use the configure_wordpress tool to connect to my WordPress site at https://mysite.com with username "admin" and application password "xxxx xxxx xxxx xxxx xxxx xxxx"
```

### Create a Post
```
Create a new WordPress post with title "Hello World" and content "<h1>Welcome to my blog!</h1><p>This is my first post created via MCP.</p>"
```

### Get Elementor Data
```
Get the Elementor data for post ID 123
```

### Upload Media
```
Upload the image file at /path/to/image.jpg to WordPress with title "My Image" and alt text "A beautiful image"
```

## Development

### Building
```bash
npm run build
```

### Development Mode (with auto-rebuild)
```bash
npm run dev
```

### Project Structure
```
├── src/
│   └── index.ts          # Main MCP server implementation
├── dist/                 # Compiled JavaScript output
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Troubleshooting

### Connection Issues
- Verify your WordPress site has the REST API enabled
- Check that your application password is correct
- Ensure your WordPress user has sufficient permissions
- Try accessing `https://yoursite.com/wp-json/wp/v2/` in your browser

### Elementor Issues
- Elementor template features require Elementor Pro
- Make sure Elementor is activated and up to date
- Some Elementor endpoints may not be available depending on your setup

### Permission Errors
- Verify your WordPress user role has necessary capabilities
- Check if any security plugins are blocking REST API access
- Ensure proper authentication headers are being sent

## Security Notes

- Never share your application passwords
- Use HTTPS for your WordPress site in production
- Consider IP restrictions for sensitive operations
- Regularly rotate application passwords

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve this MCP server.

## License

MIT License - see LICENSE file for details. 