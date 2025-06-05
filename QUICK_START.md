# Quick Start Guide

Get your Elementor WordPress MCP server running in 5 minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] WordPress site with admin access
- [ ] MCP client (like Claude Desktop) installed

## Step 1: Setup the Server

```bash
# Clone or download this repository
cd wp-elementor-mcp

# Run the automated setup
./setup.sh
```

The setup script will:
- Install dependencies
- Build the project
- Configure client settings
- Test the server

## Step 2: Create WordPress Application Password

1. Log into your WordPress admin dashboard
2. Navigate to **Users** → **Profile**
3. Scroll to **Application Passwords** section
4. Enter name: `MCP Server`
5. Click **Add New Application Password**
6. **COPY THE PASSWORD IMMEDIATELY** (you can't see it again!)

## Step 3: Configure Your MCP Client

### For Claude Desktop:

1. Open Claude Desktop settings
2. Find the MCP servers configuration
3. Copy content from `client-config.json` into your config
4. Save and restart Claude Desktop

### For Other MCP Clients:

Use the configuration from `client-config.json` and adapt it for your client.

## Step 4: Start the Server

```bash
npm start
```

Your server is now running and ready to accept connections!

## Step 5: First Connection Test

In your MCP client, try this command:

```
Configure WordPress connection with:
- Base URL: https://yoursite.com
- Username: your_username  
- Application Password: AbCd EfGh IjKl MnOp QrSt UvWx
```

If successful, you'll see a connection confirmation message.

## Quick Commands to Try

Once connected, test these commands:

```
Get all published posts from my WordPress site
```

```
Create a draft post titled "Test Post" with content "This post was created via MCP!"
```

```
Show me all pages on my WordPress site
```

```
Get all images from my media library
```

## Troubleshooting

### "Connection Failed"
- Check your WordPress URL (include https://)
- Verify application password is correct
- Ensure REST API is enabled

### "Permission Denied"
- Make sure your WordPress user has admin privileges
- Check if security plugins are blocking API access

### "Server Not Found"
- Verify the path in your client config is correct
- Make sure you ran `npm run build`
- Check that Node.js is in your PATH

## Next Steps

- Read `README.md` for detailed documentation
- Check `examples/example-usage.md` for practical scenarios
- Explore all available tools and features

## Support

If you encounter issues:
1. Check the troubleshooting section in `README.md`
2. Verify your WordPress REST API is accessible at `https://yoursite.com/wp-json/wp/v2/`
3. Test your application password with a REST API client like Postman

Happy WordPress automating! 🚀 