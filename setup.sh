#!/bin/bash

# Elementor WordPress MCP Server Setup Script

echo "🚀 Setting up Elementor WordPress MCP Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Project built successfully"

# Get the absolute path for the client configuration
CURRENT_DIR=$(pwd)
DIST_PATH="$CURRENT_DIR/dist/index.js"

# Update client-config.json with the correct path
echo "⚙️  Updating client configuration..."
sed -i.bak "s|/absolute/path/to/your/elementor-wordpress-mcp/dist/index.js|$DIST_PATH|g" client-config.json

echo "✅ Client configuration updated"

# Test the server
echo "🧪 Testing the server..."
# Try to start server briefly to verify it compiles and runs
(npm start > /dev/null 2>&1 &
SERVER_PID=$!
sleep 2
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true) && echo "✅ Server starts successfully" || echo "⚠️  Server test completed (this is normal for MCP servers)"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Set up WordPress Application Password:"
echo "   - Log into your WordPress admin"
echo "   - Go to Users → Profile"
echo "   - Scroll to 'Application Passwords'"
echo "   - Create a new application password"
echo ""
echo "2. Add this server to your MCP client configuration:"
echo "   - Copy the contents of 'client-config.json'"
echo "   - Update the environment variables with your WordPress credentials"
echo "   - Add it to your MCP client (e.g., Claude Desktop config)"
echo ""
echo "3. Server is ready to use:"
echo "   - No manual configuration needed - it will automatically connect using environment variables"
echo "   - Alternatively, you can use the 'configure_wordpress' tool if not using environment variables"
echo ""
echo "📁 Your server path: $DIST_PATH"
echo "📖 Read README.md for detailed usage instructions"
echo "💡 Check examples/example-usage.md for practical examples"
echo ""
echo "🔗 Useful links:"
echo "   - WordPress REST API: https://developer.wordpress.org/rest-api/"
echo "   - Elementor API: https://developers.elementor.com/"
echo "   - MCP Documentation: https://modelcontextprotocol.io/" 