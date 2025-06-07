// Configuration for modular tool loading
export interface ServerConfig {
  mode: 'essential' | 'standard' | 'advanced' | 'full';
  
  // Feature flags for tool categories
  basicWordPressOperations: boolean;      // Posts, pages, media
  basicElementorOperations: boolean;      // Basic Elementor CRUD
  sectionContainerCreation: boolean;      // Creating sections/containers
  widgetAddition: boolean;               // Adding/moving widgets
  elementManagement: boolean;            // Delete, reorder, copy
  pageStructure: boolean;                // Page structure tools
  performanceOptimization: boolean;      // Cache and performance
  advancedElementOperations: boolean;    // Find, bulk operations
  templateManagement: boolean;           // Templates (Pro)
  globalSettings: boolean;               // Global colors/fonts (Pro)
  customFieldsIntegration: boolean;      // Custom fields (Pro)
  revisionHistory: boolean;              // Revisions (Pro)
  
  // Helper method
  getTotalEnabledFeatures(): number;
}

// Predefined configuration modes
export const CONFIGURATION_MODES = {
  essential: {
    mode: 'essential' as const,
    basicWordPressOperations: true,
    basicElementorOperations: true,
    sectionContainerCreation: false,
    widgetAddition: false,
    elementManagement: false,
    pageStructure: false,
    performanceOptimization: false,
    advancedElementOperations: false,
    templateManagement: false,
    globalSettings: false,
    customFieldsIntegration: false,
    revisionHistory: false,
  },
  
  standard: {
    mode: 'standard' as const,
    basicWordPressOperations: true,
    basicElementorOperations: true,
    sectionContainerCreation: true,
    widgetAddition: true,
    elementManagement: true,
    pageStructure: true,
    performanceOptimization: false,
    advancedElementOperations: false,
    templateManagement: false,
    globalSettings: false,
    customFieldsIntegration: false,
    revisionHistory: false,
  },
  
  advanced: {
    mode: 'advanced' as const,
    basicWordPressOperations: true,
    basicElementorOperations: true,
    sectionContainerCreation: true,
    widgetAddition: true,
    elementManagement: true,
    pageStructure: true,
    performanceOptimization: true,
    advancedElementOperations: true,
    templateManagement: false,
    globalSettings: false,
    customFieldsIntegration: false,
    revisionHistory: false,
  },
  
  full: {
    mode: 'full' as const,
    basicWordPressOperations: true,
    basicElementorOperations: true,
    sectionContainerCreation: true,
    widgetAddition: true,
    elementManagement: true,
    pageStructure: true,
    performanceOptimization: true,
    advancedElementOperations: true,
    templateManagement: true,
    globalSettings: true,
    customFieldsIntegration: true,
    revisionHistory: true,
  }
};

class ServerConfigImpl implements ServerConfig {
  mode: 'essential' | 'standard' | 'advanced' | 'full';
  basicWordPressOperations: boolean;
  basicElementorOperations: boolean;
  sectionContainerCreation: boolean;
  widgetAddition: boolean;
  elementManagement: boolean;
  pageStructure: boolean;
  performanceOptimization: boolean;
  advancedElementOperations: boolean;
  templateManagement: boolean;
  globalSettings: boolean;
  customFieldsIntegration: boolean;
  revisionHistory: boolean;

  constructor(baseConfig: any) {
    this.mode = baseConfig.mode;
    this.basicWordPressOperations = baseConfig.basicWordPressOperations;
    this.basicElementorOperations = baseConfig.basicElementorOperations;
    this.sectionContainerCreation = baseConfig.sectionContainerCreation;
    this.widgetAddition = baseConfig.widgetAddition;
    this.elementManagement = baseConfig.elementManagement;
    this.pageStructure = baseConfig.pageStructure;
    this.performanceOptimization = baseConfig.performanceOptimization;
    this.advancedElementOperations = baseConfig.advancedElementOperations;
    this.templateManagement = baseConfig.templateManagement;
    this.globalSettings = baseConfig.globalSettings;
    this.customFieldsIntegration = baseConfig.customFieldsIntegration;
    this.revisionHistory = baseConfig.revisionHistory;
  }

  getTotalEnabledFeatures(): number {
    return Object.entries(this)
      .filter(([key, value]) => typeof value === 'boolean' && value && key !== 'mode')
      .length;
  }
}

// Environment-based configuration
export function getServerConfig(): ServerConfig {
  let configMode: keyof typeof CONFIGURATION_MODES = 'standard';
  
  // Check environment variables for mode override
  const envMode = process.env.ELEMENTOR_MCP_MODE?.toLowerCase();
  if (envMode && envMode in CONFIGURATION_MODES) {
    configMode = envMode as keyof typeof CONFIGURATION_MODES;
  }
  
  // Special environment overrides
  if (process.env.ELEMENTOR_ENABLE_ALL === 'true') {
    configMode = 'full';
  } else if (process.env.ELEMENTOR_ENABLE_PRO === 'true') {
    configMode = 'advanced';
  } else if (process.env.ELEMENTOR_MINIMAL_MODE === 'true') {
    configMode = 'essential';
  }
  
  const baseConfig = CONFIGURATION_MODES[configMode];
  const config = new ServerConfigImpl(baseConfig);
  
  // Allow individual feature overrides via environment variables
  if (process.env.ELEMENTOR_ENABLE_TEMPLATES === 'true') {
    config.templateManagement = true;
  }
  if (process.env.ELEMENTOR_ENABLE_GLOBAL_SETTINGS === 'true') {
    config.globalSettings = true;
  }
  if (process.env.ELEMENTOR_ENABLE_CUSTOM_FIELDS === 'true') {
    config.customFieldsIntegration = true;
  }
  if (process.env.ELEMENTOR_ENABLE_REVISIONS === 'true') {
    config.revisionHistory = true;
  }
  if (process.env.ELEMENTOR_ENABLE_PERFORMANCE === 'true') {
    config.performanceOptimization = true;
  }
  
  return config;
} 