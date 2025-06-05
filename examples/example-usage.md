# Example Usage Scenarios

This document provides practical examples of how to use the Elementor WordPress MCP server.

## Initial Setup

Before using any other tools, you need to configure the WordPress connection:

```
Configure WordPress connection:
- Base URL: https://mywordpresssite.com
- Username: my_username
- Application Password: AbCd EfGh IjKl MnOp QrSt UvWx
```

## Content Management Examples

### Creating Blog Posts

```
Create a new blog post:
- Title: "10 Tips for Better Web Design"
- Content: "<h2>Introduction</h2><p>Web design is crucial for user experience...</p><h2>Tip 1: Keep it Simple</h2><p>Simplicity is key...</p>"
- Status: draft
- Excerpt: "Discover essential web design tips that will improve your website's user experience and conversion rates."
```

### Bulk Content Operations

```
Get all published posts from the last month and show me their titles, publish dates, and excerpt lengths
```

```
Find all posts containing the word "tutorial" in the title or content
```

### Content Migration

```
Get the content from post ID 45 and create a new post with the same content but updated title "Updated: [Original Title]"
```

## Elementor Integration Examples

### Template Management

```
Show me all Elementor page templates and their details
```

```
Get the Elementor data for the homepage (post ID 2) so I can analyze its structure
```

### Page Building

```
Update the Elementor data for post ID 123 with this new section data: [paste Elementor JSON data]
```

### Template Analysis

```
Compare the Elementor structure between two pages (ID 10 and ID 15) and tell me what's different
```

## Media Management Examples

### File Uploads

```
Upload the image at /Users/john/Desktop/hero-image.jpg to WordPress with:
- Title: "Homepage Hero Image"
- Alt text: "Modern office space with natural lighting"
```

### Media Organization

```
Show me all images in the media library uploaded in the last 30 days
```

```
Get all video files from the media library and show their file sizes and URLs
```

## Advanced Workflows

### Content Publishing Pipeline

1. **Draft Creation**:
   ```
   Create a draft post titled "New Product Launch" with placeholder content
   ```

2. **Content Development**:
   ```
   Update post ID [X] with the final content including images and proper formatting
   ```

3. **Publishing**:
   ```
   Change the status of post ID [X] from draft to publish
   ```

### Elementor Page Optimization

1. **Analysis**:
   ```
   Get the Elementor data for post ID 50 and analyze its performance impact
   ```

2. **Optimization**:
   ```
   Update the Elementor data to remove unused widgets and optimize image sizes
   ```

### Bulk Media Processing

```
Get all images larger than 2MB from the media library and list them with their file sizes
```

## Site Maintenance Examples

### Content Audit

```
Get all posts with status "draft" that are older than 6 months
```

```
Find all posts that don't have featured images set
```

### SEO Optimization

```
Get all posts and pages, then identify which ones are missing meta descriptions (excerpt field)
```

### Performance Monitoring

```
Get the Elementor data for all pages and identify which ones have the most widgets/elements
```

## Integration with Other Tools

### Backup Creation

```
Get the complete content and Elementor data for post ID 25 and format it as a backup file
```

### Content Migration Between Sites

```
Get all the data for post ID 10 including title, content, Elementor data, and featured image, then prepare it for migration to another site
```

## Error Handling Examples

### Connection Issues

```
Test the WordPress connection and show me the current user details
```

### Permission Problems

```
Try to create a post and if it fails due to permissions, show me what user role is needed
```

## Best Practices

1. **Always start with configuration**: Use `configure_wordpress` before any other operations
2. **Test with drafts**: Create posts as drafts first, then publish after review
3. **Backup before changes**: Get existing data before making updates
4. **Use appropriate permissions**: Ensure your WordPress user has necessary capabilities
5. **Handle errors gracefully**: Check responses and handle API limitations

## Pro Tips

- Use the `search` parameter in `get_posts` to find specific content quickly
- Always specify `per_page` to control how many results you get back
- When working with Elementor data, validate JSON structure before updating
- Use meaningful titles and alt text for uploaded media for better SEO
- Check post status before making updates (published posts may have different requirements)

These examples should help you get started with the Elementor WordPress MCP server and understand its capabilities for managing WordPress content programmatically. 