/**
 * Configuration Module
 * Manages API keys, constants, and configuration settings
 */

const CONFIG = {
  // Batch sizes
  ACCELERATORS_BATCH_SIZE: 10,
  STARTUPS_PER_ACCELERATOR: 20,
  VALUE_PROP_BATCH_SIZE: 10,
  
  // Timeouts and delays
  REQUEST_TIMEOUT: 15000, 
  API_DELAY_MS: 1500, 
  SCRAPING_DELAY_MS: 500, 
  
  // LLM Settings (Groq)
  LLM_ENDPOINT: 'https://api.groq.com/openai/v1/chat/completions',
  LLM_MODEL: 'llama-3.3-70b-versatile', 
  LLM_MAX_TOKENS: 500,
  LLM_TEMPERATURE: 0.3, 
  
  // Sheet names (Aligned with User's existing sheets)
  SHEET_ACCELERATORS: 'Database Acceleratori',
  SHEET_STARTUPS: 'Database Startup',
  // SHEET_VALUE_PROPS: 'Value Propositions', // Deprecated
  SHEET_CONFIG: 'Config',
  SHEET_LOGS: 'Logs',
  
  // Column indices (0-based) - Aligned with user's specific requirements
  ACC_COL_ID: 0,
  ACC_COL_NAME: 1,
  ACC_COL_COUNTRY: 2,
  ACC_COL_FOCUS: 3,
  ACC_COL_WEBSITE: 4,
  ACC_COL_DESCRIPTION: 5,
  
  STARTUP_COL_ID: 0,
  STARTUP_COL_NAME: 1,
  STARTUP_COL_COUNTRY: 2,
  STARTUP_COL_SECTOR: 3,
  STARTUP_COL_WEBSITE: 4,
  STARTUP_COL_DESCRIPTION: 5,
  STARTUP_COL_ACCELERATOR: 6,
  STARTUP_COL_VALUE_PROP: 7, // New column for VP

  // OLD VP Columns - Deprecated
  // VP_COL_ID: 0,
  // VP_COL_STARTUP: 1,
  // VP_COL_ACCELERATOR: 2,
  // VP_COL_MATCH_SCORE: 3,
  // VP_COL_VALUE_PROP: 4,
  // VP_COL_DATE: 5,
  
  // European accelerators seed data
  SEED_ACCELERATORS: [
    { website: 'https://seedcamp.com', name: 'Seedcamp', country: 'United Kingdom' },
    { website: 'https://www.techstars.com', name: 'Techstars', country: 'Multiple' },
    { website: 'https://stationf.co', name: 'Station F', country: 'France' },
    { website: 'https://www.joinef.com', name: 'Entrepreneur First', country: 'United Kingdom' },
    { website: 'https://500.co', name: '500 Global', country: 'Multiple' },
    { website: 'https://www.antler.co', name: 'Antler', country: 'Multiple' },
    { website: 'https://www.rockstart.com', name: 'Rockstart', country: 'Netherlands' },
    { website: 'https://www.wayra.com', name: 'Wayra', country: 'Spain' },
    { website: 'https://www.startupbootcamp.org', name: 'Startupbootcamp', country: 'Netherlands' },
    { website: 'https://www.founders-factory.com', name: 'Founders Factory', country: 'United Kingdom' }
  ]
};

/**
 * Get API key from Config sheet or Script Properties
 * @returns {string} API key
 */
function getApiKey() {
  // First try Config sheet (B1 as per user's script)
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName(CONFIG.SHEET_CONFIG);
    if (configSheet) {
      const keyValue = configSheet.getRange("B1").getValue();
      if (keyValue && String(keyValue).trim().length > 20) {
        // Logger.info('Config', 'API Key letta dal foglio Config');
        return String(keyValue).trim();
      }
    }
  } catch (e) {}

  // Fallback to script properties
  const key = PropertiesService.getScriptProperties().getProperty('GROQ_API_KEY');
  if (!key) {
    throw new Error('API Key NON trovata! Inseriscila nel foglio Config cella B1.');
  }
  return key;
}

/**
 * Set Groq API key
 */
function setGroqKey(key) {
  PropertiesService.getScriptProperties().setProperty('GROQ_API_KEY', key);
  Logger.info('Config', 'Groq API key configurata con successo');
}

/**
 * Validate configuration
 */
function validateConfig() {
  try {
    getApiKey();
    return true;
  } catch (e) {
    Logger.error('Config', 'Validazione fallita', {error: e.message});
    throw e;
  }
}
