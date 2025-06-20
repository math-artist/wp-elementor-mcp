export const toolSchemas = {
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