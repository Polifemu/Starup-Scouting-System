/**
 * Configuration Module
 * Manages API keys, constants, and configuration settings
 */

const CONFIG = {
  // Batch sizes
  ACCELERATORS_BATCH_SIZE: 10,
  STARTUPS_PER_ACCELERATOR: 20,
  VALUE_PROP_BATCH_SIZE: 5,
  
  // Timeouts and delays
  REQUEST_TIMEOUT: 10000, // 10 seconds
  API_DELAY_MS: 1000, // 1 second between API calls
  SCRAPING_DELAY_MS: 500, // 0.5 seconds between scrape requests
  
  // LLM Settings
  LLM_MODEL: 'gpt-4o-mini', // More cost-effective than gpt-4
  LLM_MAX_TOKENS: 150,
  LLM_TEMPERATURE: 0.3, // Lower for more consistent output
  
  // Sheet names
  SHEET_ACCELERATORS: 'accelerators',
  SHEET_STARTUPS: 'startups',
  SHEET_LOGS: 'logs',
  
  // Column indices (0-based)
  ACC_COL_WEBSITE: 0,
  ACC_COL_NAME: 1,
  ACC_COL_COUNTRY: 2,
  
  STARTUP_COL_WEBSITE: 0,
  STARTUP_COL_NAME: 1,
  STARTUP_COL_COUNTRY: 2,
  STARTUP_COL_ACCELERATOR: 3,
  STARTUP_COL_VALUE_PROP: 4,
  
  // European accelerators seed data
  SEED_ACCELERATORS: [
    {
      website: 'https://seedcamp.com',
      name: 'Seedcamp',
      country: 'United Kingdom'
    },
    {
      website: 'https://www.techstars.com',
      name: 'Techstars',
      country: 'Multiple'
    },
    {
      website: 'https://stationf.co',
      name: 'Station F',
      country: 'France'
    },
    {
      website: 'https://www.joinef.com',
      name: 'Entrepreneur First',
      country: 'United Kingdom'
    },
    {
      website: 'https://500.co',
      name: '500 Global',
      country: 'Multiple'
    },
    {
      website: 'https://www.antler.co',
      name: 'Antler',
      country: 'Multiple'
    },
    {
      website: 'https://www.rockstart.com',
      name: 'Rockstart',
      country: 'Netherlands'
    },
    {
      website: 'https://www.wayra.com',
      name: 'Wayra',
      country: 'Spain'
    },
    {
      website: 'https://www.startupbootcamp.org',
      name: 'Startupbootcamp',
      country: 'Netherlands'
    },
    {
      website: 'https://www.founders-factory.com',
      name: 'Founders Factory',
      country: 'United Kingdom'
    }
  ]
};

/**
 * Get OpenAI API key from script properties
 * @returns {string} API key
 */
function getOpenAIKey() {
  const key = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  if (!key) {
    throw new Error('OPENAI_API_KEY not configured. Please set it in Script Properties.');
  }
  return key;
}

/**
 * Set OpenAI API key (helper function for setup)
 * @param {string} key - The API key to set
 */
function setOpenAIKey(key) {
  PropertiesService.getScriptProperties().setProperty('OPENAI_API_KEY', key);
  Logger.info('Config', 'OpenAI API key configured successfully');
}

/**
 * Validate configuration before running operations
 * @returns {boolean} True if configuration is valid
 */
function validateConfig() {
  try {
    getOpenAIKey();
    Logger.info('Config', 'Configuration validated successfully');
    return true;
  } catch (e) {
    Logger.error('Config', 'Configuration validation failed', {error: e.message});
    throw new Error('Please configure OpenAI API key using setOpenAIKey("your-key-here")');
  }
}
