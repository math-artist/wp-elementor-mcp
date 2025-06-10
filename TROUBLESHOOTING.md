# Elementor MCP Troubleshooting Guide

This guide helps diagnose and fix common issues when using the Elementor WordPress MCP.

## Common Error Messages

### 1. "Request failed with status code 404"

**Symptoms:**
- `AxiosError: Request failed with status code 404`
- Unable to fetch posts, pages, or Elementor data

**Possible Causes:**
1. **Incorrect WordPress URL**: The base URL might be wrong
2. **WordPress API disabled**: REST API might be disabled
3. **Permalink issues**: WordPress permalinks not set to "Post name"
4. **Authentication issues**: Invalid credentials
5. **Plugin conflicts**: Security or caching plugins blocking API access

**Solutions:**

#### Check WordPress URL
```bash
# Test if WordPress REST API is accessible
curl "https://yoursite.com/wp-json/wp/v2/"
```

#### Verify WordPress Settings
1. Go to **Settings → Permalinks** in WordPress admin
2. Select "Post name" structure
3. Click "Save Changes"

#### Check REST API Status
Add this to your theme's `functions.php` temporarily:
```php
add_action('rest_api_init', function() {
    error_log('REST API is working');
});
```

#### Test Authentication
```bash
# Test with your application password
curl -u "username:application_password" "https://yoursite.com/wp-json/wp/v2/users/me"
```

### 2. "No Elementor data found for post/page ID XXX"

**Symptoms:**
- Error message about missing Elementor data
- Can create pages but can't access existing Elementor content

**Diagnostic Steps:**

#### Use the new debugging tool
```javascript
// First, list all content to see what's available
await mcp.listAllContent({ include_all_statuses: true });

// Then check a specific post/page
await mcp.getElementorData({ post_id: YOUR_ID });
```

**Possible Causes:**

1. **Page doesn't use Elementor**: The page was created with classic editor
2. **Empty Elementor page**: Page uses Elementor but has no content
3. **Permission issues**: User doesn't have access to edit the page
4. **Cache issues**: Elementor cache preventing data access
5. **Database corruption**: Elementor meta data corrupted

**Solutions:**

#### Check if page uses Elementor
- Look for `Edit Mode: builder` in the debug output
- Pages without Elementor will show `Edit Mode: None`

#### Clear Elementor cache
Try the cache clearing functions:
```javascript
await mcp.clearElementorCacheByPage({ post_id: YOUR_ID });
```

#### Verify user permissions
Make sure the application password user has:
- `edit_posts` capability
- `edit_pages` capability  
- `edit_others_posts` capability (for other users' content)

### 3. "WordPress connection not configured"

**Symptoms:**
- Error about missing WordPress connection
- MCP tools not working

**Solutions:**

#### Set Environment Variables
Create a `.env` file or set environment variables:
```bash
export WORDPRESS_BASE_URL="https://yoursite.com"
export WORDPRESS_USERNAME="your_username"
export WORDPRESS_APPLICATION_PASSWORD="xxxx xxxx xxxx xxxx xxxx xxxx"
```

#### Use Manual Configuration
```javascript
await mcp.configureWordPress({
  baseUrl: "https://yoursite.com",
  username: "your_username", 
  applicationPassword: "xxxx xxxx xxxx xxxx xxxx xxxx"
});
```

## Debugging Workflow

### Step 1: Test Basic Connection
```javascript
// Configure connection (if not using env vars)
await mcp.configureWordPress({
  baseUrl: "https://yoursite.com",
  username: "your_username",
  applicationPassword: "your_app_password"
});
```

### Step 2: List All Content
```javascript
// Get overview of all posts and pages
await mcp.listAllContent({ 
  per_page: 50, 
  include_all_statuses: true 
});
```

### Step 3: Check Specific Content
```javascript
// Test with a known post/page ID from step 2
await mcp.getElementorData({ post_id: 123 });
```

### Step 4: Test Elementor Operations
```javascript
// Try to get page structure
await mcp.getPageStructure({ post_id: 123 });

// Try to get Elementor elements list
await mcp.getElementorElements({ post_id: 123 });
```

## WordPress Requirements

### Minimum Requirements
- WordPress 5.0+
- Elementor 3.0+
- REST API enabled
- Permalinks set to "Post name"

### Required Plugins
- **Elementor** (free or pro)
- **Application Passwords** (WordPress 5.6+ built-in)

### User Permissions
The user account needs these capabilities:
- `read`
- `edit_posts`
- `edit_pages`  
- `edit_others_posts` (for other users' content)
- `upload_files` (for media operations)
- `manage_options` (for some advanced operations)

## Common WordPress Configuration Issues

### Permalink Structure
If permalinks are not set correctly:
1. Go to **Settings → Permalinks**
2. Select "Post name"
3. Click "Save Changes"

### Security Plugins
Some security plugins block REST API access:

#### Wordfence
1. Go to **Wordfence → Firewall → Rate Limiting**
2. Add your IP to whitelist
3. Or disable rate limiting for REST API

#### Security plugins in general
Look for settings that block:
- REST API access
- JSON endpoints
- External API calls

### Caching Plugins
Caching can interfere with real-time updates:

#### WP Rocket
1. Go to **WP Rocket → Settings**
2. Exclude `/wp-json/` from caching

#### W3 Total Cache
1. Go to **Performance → Page Cache**
2. Add `/wp-json/` to "Never cache the following pages"

## Application Password Setup

### Creating Application Password
1. Go to **Users → Your Profile** in WordPress admin
2. Scroll to "Application Passwords"
3. Enter name (e.g., "Elementor MCP")
4. Click "Add New Application Password"
5. Copy the generated password (format: `xxxx xxxx xxxx xxxx xxxx xxxx`)

### Testing Application Password
```bash
curl -u "username:xxxx xxxx xxxx xxxx xxxx xxxx" \
  "https://yoursite.com/wp-json/wp/v2/users/me"
```

## Advanced Debugging

### Enable WordPress Debug Logging
Add to `wp-config.php`:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

### Check WordPress Error Logs
Look for errors in:
- `/wp-content/debug.log`
- Server error logs
- Browser developer console

### Test REST API Manually
```bash
# List posts
curl "https://yoursite.com/wp-json/wp/v2/posts"

# Get specific post with meta
curl -u "user:pass" "https://yoursite.com/wp-json/wp/v2/posts/123?context=edit"

# List pages  
curl "https://yoursite.com/wp-json/wp/v2/pages"
```

## Getting Help

When reporting issues, please include:

1. **WordPress version**
2. **Elementor version** 
3. **Error messages** (full text)
4. **Output from `listAllContent`** command
5. **WordPress URL structure** (domain.com vs domain.com/wordpress)
6. **Active security/caching plugins**
7. **User role and capabilities**

### Example Debug Report
```
WordPress: 6.4.1
Elementor: 3.18.3
Error: "Request failed with status code 404"
URL: https://mysite.com
Permalinks: Post name
Security: Wordfence enabled
Cache: WP Rocket enabled
User role: Administrator
```

This information helps identify the root cause quickly. 