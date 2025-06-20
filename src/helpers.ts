import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

export class ResponseHelpers {
  static createSuccessResponse(data: any, message: string) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message,
          data
        }, null, 2)
      }]
    };
  }

  static createErrorResponse(message: string, toolName: string, errorType: string, details: string) {
    return {
      content: [{
        type: 'text',
        text: `❌ **${errorType}** - ${toolName}\n\n${message}\n\n**Details:** ${details}`
      }],
      isError: true
    };
  }
}

export class ElementorHelpers {
  static async clearElementorCache(postId?: number): Promise<void> {
    // In a real implementation, this would clear Elementor cache
    // For now, this is a placeholder that logs the action
    console.error(`🧹 Clearing Elementor cache${postId ? ` for post ${postId}` : ' (global)'}`);
  }

  static generateElementorId(): string {
    return Math.random().toString(36).substr(2, 8);
  }

  static updateWidgetContent(element: any, content: string): void {
    if (!element.widgetType) return;

    switch (element.widgetType) {
      case 'html':
        element.settings.html = content;
        break;
      case 'text-editor':
        element.settings.editor = content;
        break;
      case 'heading':
        element.settings.title = content;
        break;
      default:
        // For other widget types, try common content properties
        if (element.settings.content) {
          element.settings.content = content;
        } else if (element.settings.text) {
          element.settings.text = content;
        }
    }
  }

  static findElementRecursive(elements: any[], elementId: string): any | null {
    for (const element of elements) {
      if (element.id === elementId) {
        return element;
      }
      
      if (element.elements && element.elements.length > 0) {
        const found = this.findElementRecursive(element.elements, elementId);
        if (found) return found;
      }
    }
    return null;
  }

  static createElementorColumn(columnSize: number = 50): any {
    return {
      id: this.generateElementorId(),
      elType: 'column',
      isInner: false,
      settings: {
        _column_size: columnSize,
        _inline_size: null
      },
      elements: [],
      widgetType: null
    };
  }

  static createElementorSection(columns: number = 1, settings: any = {}): any {
    const columnElements = [];
    const columnSize = Math.floor(100 / columns);
    
    for (let i = 0; i < columns; i++) {
      columnElements.push(this.createElementorColumn(columnSize));
    }

    return {
      id: this.generateElementorId(),
      elType: 'section',
      isInner: false,
      settings,
      elements: columnElements,
      widgetType: null
    };
  }
}