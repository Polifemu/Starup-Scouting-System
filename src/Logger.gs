/**
 * Logging Module
 * Structured logging system with persistence to Google Sheets
 */

const Logger = {
  /**
   * Log levels
   */
  LEVELS: {
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR'
  },
  
  /**
   * Get or create logs sheet
   * @returns {GoogleAppsScript.Spreadsheet.Sheet} Logs sheet
   */
  getLogsSheet: function() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEET_LOGS);
    
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_LOGS);
      sheet.appendRow(['Timestamp', 'Level', 'Function', 'Message', 'Details']);
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    }
    
    return sheet;
  },
  
  /**
   * Write a log entry
   * @param {string} level - Log level
   * @param {string} functionName - Name of the function logging
   * @param {string} message - Log message
   * @param {Object} details - Additional details object
   */
  log: function(level, functionName, message, details = {}) {
    try {
      const timestamp = new Date();
      const detailsStr = Object.keys(details).length > 0 ? JSON.stringify(details) : '';
      
      const sheet = this.getLogsSheet();
      sheet.appendRow([timestamp, level, functionName, message, detailsStr]);
      
      // Also log to console for debugging
      console.log(`[${level}] ${functionName}: ${message}`, details);
    } catch (e) {
      // Fallback to console if sheet logging fails
      console.error('Logger failed:', e.message);
      console.log(`[${level}] ${functionName}: ${message}`, details);
    }
  },
  
  /**
   * Log info message
   * @param {string} functionName - Name of the function
   * @param {string} message - Log message
   * @param {Object} details - Additional details
   */
  info: function(functionName, message, details = {}) {
    this.log(this.LEVELS.INFO, functionName, message, details);
  },
  
  /**
   * Log warning message
   * @param {string} functionName - Name of the function
   * @param {string} message - Log message
   * @param {Object} details - Additional details
   */
  warning: function(functionName, message, details = {}) {
    this.log(this.LEVELS.WARNING, functionName, message, details);
  },
  
  /**
   * Log error message
   * @param {string} functionName - Name of the function
   * @param {string} message - Log message
   * @param {Object} details - Additional details
   */
  error: function(functionName, message, details = {}) {
    this.log(this.LEVELS.ERROR, functionName, message, details);
  },
  
  /**
   * Clear old logs (keep last N entries)
   * @param {number} keepLast - Number of recent logs to keep
   */
  cleanup: function(keepLast = 1000) {
    try {
      const sheet = this.getLogsSheet();
      const lastRow = sheet.getLastRow();
      
      if (lastRow > keepLast + 1) { // +1 for header
        sheet.deleteRows(2, lastRow - keepLast - 1);
        this.info('Logger', 'Cleaned up old logs', {kept: keepLast});
      }
    } catch (e) {
      console.error('Failed to cleanup logs:', e.message);
    }
  }
};
