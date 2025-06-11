# SSL Certificate Support

## Overview

The Elementor MCP server includes intelligent SSL certificate handling to work seamlessly with both local development sites and production environments.

## How It Works

### 🔓 Local Development Sites (Self-Signed Certificates Allowed)

The MCP server automatically detects local development environments and allows self-signed certificates for these domains:

- `localhost`
- `127.0.0.1` 
- `*.local` (e.g., `mysite.local`, `joincollectiveos.local`)
- `*.dev` (e.g., `mysite.dev`)
- `*.test` (e.g., `mysite.test`)

When connecting to these domains, you'll see:
```
🔓 Allowing self-signed certificates for local development site: joincollectiveos.local
```

### 🔒 Production Sites (Valid Certificates Required)

For all other domains (production sites), the MCP server requires valid SSL certificates:

```
🔒 Requiring valid SSL certificates for production site: myproductionsite.com
```

## Benefits

1. **No Manual Configuration**: Automatic detection of local vs production environments
2. **Security**: Production sites still require valid SSL certificates
3. **Developer Experience**: Works out-of-the-box with popular local development tools:
   - Local by Flywheel (`*.local`)
   - Laravel Valet (`*.test`)
   - MAMP/XAMPP (localhost)
   - Docker setups (`*.local`, `*.dev`)

## Troubleshooting

### Still Getting SSL Errors?

If you're still encountering SSL certificate errors:

1. **Check your domain**: Ensure it ends with `.local`, `.dev`, or `.test`
2. **Restart the MCP server**: After changing domains, restart the server
3. **Check logs**: Look for SSL-related messages in the server output

### Custom Local Domain

If you're using a custom local domain not covered by the automatic detection, you can:

1. Add it to the `shouldRejectUnauthorized` method in `src/index.ts`
2. Or use one of the supported local domain patterns (`.local`, `.dev`, `.test`)

## Examples

### ✅ Automatically Supported Local Domains
- `https://mysite.local/`
- `https://localhost:8080/`
- `https://127.0.0.1:3000/`
- `https://myapp.dev/`
- `https://wordpress.test/`

### 🔒 Production Domains (Valid SSL Required)
- `https://myproductionsite.com/`
- `https://blog.mycompany.org/`
- `https://api.example.net/` 