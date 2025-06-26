export const toolSchemas = {
  // WordPress Basic Operations
  get_page: {
    name: 'get_page',
    description: 'Get a specific WordPress page by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Page ID',
        },
      },
      required: ['id'],
    },
  },

  // Elementor Smart Tools
  get_elementor_data_smart: {
    name: 'get_elementor_data_smart',
    description: 'Get Elementor data with intelligent chunking for large pages - automatically handles nested structures and token limits',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
        element_index: {
          type: 'number',
          description: 'Zero-based index of top-level element to retrieve (default: 0)',
          default: 0,
        },
        max_depth: {
          type: 'number',
          description: 'Maximum nesting depth to include (default: 2 - sections and columns only)',
          default: 2,
        },
        include_widget_previews: {
          type: 'boolean',
          description: 'Include widget content previews (default: false)',
          default: false,
        },
      },
      required: ['post_id'],
    },
  },

  get_elementor_structure_summary: {
    name: 'get_elementor_structure_summary',
    description: 'Get a compact summary of the page structure without heavy content to understand layout quickly',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
        max_depth: {
          type: 'number',
          description: 'Maximum depth to analyze (default: 4)',
          default: 4,
        },
      },
      required: ['post_id'],
    },
  },

  // NEW: Temp file operations
  get_elementor_data_to_file: {
    name: 'get_elementor_data_to_file',
    description: 'Get complete Elementor data for a page and write to temp file (avoids token limits)',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
      },
      required: ['post_id'],
    },
  },

  get_page_structure_to_file: {
    name: 'get_page_structure_to_file',
    description: 'Get simplified page structure and write to temp file (avoids token limits)',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
        include_settings: {
          type: 'boolean',
          description: 'Include basic settings for each element (default: false)',
          default: false,
        },
      },
      required: ['post_id'],
    },
  },

  backup_elementor_data_to_file: {
    name: 'backup_elementor_data_to_file',
    description: 'Create backup of Elementor page data to temp file',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID to backup',
        },
        backup_name: {
          type: 'string',
          description: 'Optional name for the backup',
        },
      },
      required: ['post_id'],
    },
  },

  // Original schemas (keeping existing ones)
  get_elementor_data: {
    name: 'get_elementor_data',
    description: 'Get complete Elementor data for a page',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
      },
      required: ['post_id'],
    },
  },

  get_page_structure: {
    name: 'get_page_structure',
    description: 'Get a simplified overview of the page structure',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
        include_settings: {
          type: 'boolean',
          description: 'Include basic settings for each element (default: false)',
          default: false,
        },
      },
      required: ['post_id'],
    },
  },

  backup_elementor_data: {
    name: 'backup_elementor_data',
    description: 'Create a backup of Elementor page data',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID to backup',
        },
        backup_name: {
          type: 'string',
          description: 'Optional name for the backup',
        },
      },
      required: ['post_id'],
    },
  },

  // WordPress Basic Operations
  get_posts: {
    name: 'get_posts',
    description: 'Get WordPress posts with filtering options',
    inputSchema: {
      type: 'object',
      properties: {
        per_page: {
          type: 'number',
          description: 'Number of posts to retrieve (default: 10)',
          default: 10,
        },
        status: {
          type: 'string',
          description: 'Post status (default: publish)',
          default: 'publish',
        },
        search: {
          type: 'string',
          description: 'Search term to filter posts',
        },
      },
    },
  },

  get_post: {
    name: 'get_post',
    description: 'Get a specific WordPress post by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Post ID',
        },
      },
      required: ['id'],
    },
  },

  create_post: {
    name: 'create_post',
    description: 'Create a new WordPress post',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Post title',
        },
        content: {
          type: 'string',
          description: 'Post content',
        },
        status: {
          type: 'string',
          description: 'Post status (default: draft)',
          default: 'draft',
        },
        excerpt: {
          type: 'string',
          description: 'Post excerpt',
        },
      },
      required: ['title', 'content'],
    },
  },

  update_post: {
    name: 'update_post',
    description: 'Update an existing WordPress post',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Post ID',
        },
        title: {
          type: 'string',
          description: 'Post title',
        },
        content: {
          type: 'string',
          description: 'Post content',
        },
        status: {
          type: 'string',
          description: 'Post status',
        },
        excerpt: {
          type: 'string',
          description: 'Post excerpt',
        },
      },
      required: ['id'],
    },
  },

  get_pages: {
    name: 'get_pages',
    description: 'Get WordPress pages with filtering options',
    inputSchema: {
      type: 'object',
      properties: {
        per_page: {
          type: 'number',
          description: 'Number of pages to retrieve (default: 10)',
          default: 10,
        },
        status: {
          type: 'string',
          description: 'Page status (default: publish)',
          default: 'publish',
        },
      },
    },
  },

  list_all_content: {
    name: 'list_all_content',
    description: 'List all content (posts and pages) with Elementor status',
    inputSchema: {
      type: 'object',
      properties: {
        per_page: {
          type: 'number',
          description: 'Number of items per type to retrieve (default: 50)',
          default: 50,
        },
        include_all_statuses: {
          type: 'boolean',
          description: 'Include all statuses including drafts and trash (default: false)',
          default: false,
        },
      },
    },
  },

  create_page: {
    name: 'create_page',
    description: 'Create a new WordPress page',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Page title',
        },
        content: {
          type: 'string',
          description: 'Page content',
        },
        status: {
          type: 'string',
          description: 'Page status (default: draft)',
          default: 'draft',
        },
        excerpt: {
          type: 'string',
          description: 'Page excerpt',
        },
        parent: {
          type: 'number',
          description: 'Parent page ID',
        },
      },
      required: ['title', 'content'],
    },
  },

  update_page: {
    name: 'update_page',
    description: 'Update an existing WordPress page',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Page ID',
        },
        title: {
          type: 'string',
          description: 'Page title',
        },
        content: {
          type: 'string',
          description: 'Page content',
        },
        status: {
          type: 'string',
          description: 'Page status',
        },
        excerpt: {
          type: 'string',
          description: 'Page excerpt',
        },
        parent: {
          type: 'number',
          description: 'Parent page ID',
        },
      },
      required: ['id'],
    },
  },

  // Media Operations
  get_media: {
    name: 'get_media',
    description: 'Get WordPress media files',
    inputSchema: {
      type: 'object',
      properties: {
        per_page: {
          type: 'number',
          description: 'Number of media items to retrieve (default: 10)',
          default: 10,
        },
        media_type: {
          type: 'string',
          description: 'Media type filter (image, video, audio, etc.)',
        },
      },
    },
  },

  upload_media: {
    name: 'upload_media',
    description: 'Upload media file to WordPress',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Local file path to upload',
        },
        title: {
          type: 'string',
          description: 'Media title',
        },
        alt_text: {
          type: 'string',
          description: 'Alt text for images',
        },
      },
      required: ['file_path'],
    },
  },

  // Elementor Extended Operations
  get_elementor_templates: {
    name: 'get_elementor_templates',
    description: 'Get Elementor templates',
    inputSchema: {
      type: 'object',
      properties: {
        per_page: {
          type: 'number',
          description: 'Number of templates to retrieve (default: 10)',
          default: 10,
        },
        type: {
          type: 'string',
          description: 'Template type',
        },
      },
    },
  },

  update_elementor_data: {
    name: 'update_elementor_data',
    description: 'Update Elementor data for a page/post',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
        elementor_data: {
          type: 'string',
          description: 'JSON string of Elementor data',
        },
      },
      required: ['post_id', 'elementor_data'],
    },
  },

  update_elementor_widget: {
    name: 'update_elementor_widget',
    description: 'Update a specific Elementor widget',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
        widget_id: {
          type: 'string',
          description: 'Widget ID',
        },
        widget_settings: {
          type: 'object',
          description: 'Widget settings to update',
        },
        widget_content: {
          type: 'string',
          description: 'Widget content to update',
        },
      },
      required: ['post_id', 'widget_id'],
    },
  },

  get_elementor_widget: {
    name: 'get_elementor_widget',
    description: 'Get a specific Elementor widget',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
        widget_id: {
          type: 'string',
          description: 'Widget ID',
        },
      },
      required: ['post_id', 'widget_id'],
    },
  },

  get_elementor_elements: {
    name: 'get_elementor_elements',
    description: 'Get all Elementor elements from a page',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
        include_content: {
          type: 'boolean',
          description: 'Include content previews (default: false)',
          default: false,
        },
      },
      required: ['post_id'],
    },
  },

  update_elementor_section: {
    name: 'update_elementor_section',
    description: 'Update multiple widgets in an Elementor section',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
        section_id: {
          type: 'string',
          description: 'Section ID',
        },
        widgets_updates: {
          type: 'array',
          description: 'Array of widget updates',
          items: {
            type: 'object',
            properties: {
              widget_id: {
                type: 'string',
                description: 'Widget ID',
              },
              widget_settings: {
                type: 'object',
                description: 'Widget settings',
              },
              widget_content: {
                type: 'string',
                description: 'Widget content',
              },
            },
            required: ['widget_id'],
          },
        },
      },
      required: ['post_id', 'section_id', 'widgets_updates'],
    },
  },

  // Section and Container Creation
  create_elementor_section: {
    name: 'create_elementor_section',
    description: 'Create a new Elementor section',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
        position: {
          type: 'number',
          description: 'Position to insert section',
        },
        columns: {
          type: 'number',
          description: 'Number of columns (default: 1)',
          default: 1,
        },
        section_settings: {
          type: 'object',
          description: 'Section settings',
        },
      },
      required: ['post_id'],
    },
  },

  create_elementor_container: {
    name: 'create_elementor_container',
    description: 'Create a new Elementor container',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
        position: {
          type: 'number',
          description: 'Position to insert container',
        },
        container_settings: {
          type: 'object',
          description: 'Container settings',
        },
      },
      required: ['post_id'],
    },
  },

  add_column_to_section: {
    name: 'add_column_to_section',
    description: 'Add columns to an existing Elementor section',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
        section_id: {
          type: 'string',
          description: 'Section ID',
        },
        columns_to_add: {
          type: 'number',
          description: 'Number of columns to add (default: 1)',
          default: 1,
        },
      },
      required: ['post_id', 'section_id'],
    },
  },

  duplicate_section: {
    name: 'duplicate_section',
    description: 'Duplicate an existing Elementor section',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
        section_id: {
          type: 'string',
          description: 'Section ID to duplicate',
        },
        position: {
          type: 'number',
          description: 'Position to insert duplicated section',
        },
      },
      required: ['post_id', 'section_id'],
    },
  },

  // Widget Addition Tools
  add_widget_to_section: {
    name: 'add_widget_to_section',
    description: 'Add a widget to an Elementor section or column',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
        widget_type: {
          type: 'string',
          description: 'Widget type (e.g., heading, text-editor, image)',
        },
        section_id: {
          type: 'string',
          description: 'Section ID',
        },
        column_id: {
          type: 'string',
          description: 'Column ID (optional, uses first column if not specified)',
        },
        position: {
          type: 'number',
          description: 'Position within column',
        },
        widget_settings: {
          type: 'object',
          description: 'Widget settings',
        },
      },
      required: ['post_id', 'widget_type'],
    },
  },

  insert_widget_at_position: {
    name: 'insert_widget_at_position',
    description: 'Insert a widget at a specific position relative to another element',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
        widget_type: {
          type: 'string',
          description: 'Widget type',
        },
        target_element_id: {
          type: 'string',
          description: 'Target element ID for positioning',
        },
        insert_position: {
          type: 'string',
          description: 'Position relative to target (before, after, inside)',
          default: 'after',
        },
        widget_settings: {
          type: 'object',
          description: 'Widget settings',
        },
      },
      required: ['post_id', 'widget_type', 'target_element_id'],
    },
  },

  clone_widget: {
    name: 'clone_widget',
    description: 'Clone an existing widget',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
        widget_id: {
          type: 'string',
          description: 'Widget ID to clone',
        },
        target_element_id: {
          type: 'string',
          description: 'Target element ID for positioning cloned widget',
        },
        insert_position: {
          type: 'string',
          description: 'Position relative to target (before, after, inside)',
          default: 'after',
        },
      },
      required: ['post_id', 'widget_id'],
    },
  },

  move_widget: {
    name: 'move_widget',
    description: 'Move a widget to a different location',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
        widget_id: {
          type: 'string',
          description: 'Widget ID to move',
        },
        target_section_id: {
          type: 'string',
          description: 'Target section ID',
        },
        target_column_id: {
          type: 'string',
          description: 'Target column ID',
        },
        position: {
          type: 'number',
          description: 'Position within target',
        },
      },
      required: ['post_id', 'widget_id'],
    },
  },

  // Element Management
  delete_elementor_element: {
    name: 'delete_elementor_element',
    description: 'Delete an Elementor element (section, column, or widget)',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
        element_id: {
          type: 'string',
          description: 'Element ID to delete',
        },
      },
      required: ['post_id', 'element_id'],
    },
  },

  reorder_elements: {
    name: 'reorder_elements',
    description: 'Reorder elements within a container',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
        container_id: {
          type: 'string',
          description: 'Container ID',
        },
        element_ids: {
          type: 'array',
          description: 'Array of element IDs in desired order',
          items: {
            type: 'string',
          },
        },
      },
      required: ['post_id', 'container_id', 'element_ids'],
    },
  },

  copy_element_settings: {
    name: 'copy_element_settings',
    description: 'Copy settings from one element to another',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
        source_element_id: {
          type: 'string',
          description: 'Source element ID',
        },
        target_element_id: {
          type: 'string',
          description: 'Target element ID',
        },
        settings_to_copy: {
          type: 'array',
          description: 'Specific settings to copy (default: all)',
          items: {
            type: 'string',
          },
        },
      },
      required: ['post_id', 'source_element_id', 'target_element_id'],
    },
  },

  // Page Structure Tools
  rebuild_page_structure: {
    name: 'rebuild_page_structure',
    description: 'Rebuild page structure (placeholder - not yet implemented)',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
      },
      required: ['post_id'],
    },
  },

  validate_elementor_data: {
    name: 'validate_elementor_data',
    description: 'Validate Elementor data structure',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'number',
          description: 'Post/Page ID',
        },
      },
      required: ['post_id'],
    },
  }
};