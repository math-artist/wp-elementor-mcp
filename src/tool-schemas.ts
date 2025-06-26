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
  }
};