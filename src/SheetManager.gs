/**
 * Sheet Manager Module
 * Handles all Google Sheets operations with idempotency and deduplication
 */

const SheetManager = {
  /**
   * Get or create a sheet with specified headers
   * @param {string} name - Sheet name
   * @param {Array<string>} headers - Column headers
   * @returns {GoogleAppsScript.Spreadsheet.Sheet} The sheet
   */
  getOrCreateSheet: function(name, headers) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(name);
    
    if (!sheet) {
      sheet = ss.insertSheet(name);
      if (headers && headers.length > 0) {
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      }
      Logger.info('SheetManager', `Created new sheet: ${name}`);
    }
    
    return sheet;
  },
  
  /**
   * Initialize all required sheets
   */
  initializeSheets: function() {
    this.getOrCreateSheet(CONFIG.SHEET_ACCELERATORS, ['website', 'name', 'country']);
    this.getOrCreateSheet(CONFIG.SHEET_STARTUPS, ['website', 'name', 'country', 'accelerator', 'value_proposition']);
    this.getOrCreateSheet(CONFIG.SHEET_LOGS, ['Timestamp', 'Level', 'Function', 'Message', 'Details']);
    Logger.info('SheetManager', 'All sheets initialized');
  },
  
  /**
   * Check if a URL already exists in a sheet
   * @param {string} sheetName - Name of the sheet
   * @param {string} url - URL to check
   * @returns {number} Row number if exists, -1 otherwise
   */
  findRowByUrl: function(sheetName, url) {
    const sheet = this.getOrCreateSheet(sheetName, null);
    const data = sheet.getDataRange().getValues();
    const normalizedUrl = normalizeUrl(url);
    
    for (let i = 1; i < data.length; i++) { // Skip header row
      if (normalizeUrl(data[i][0]) === normalizedUrl) {
        return i + 1; // Return 1-based row number
      }
    }
    
    return -1;
  },
  
  /**
   * Add or update an accelerator (idempotent)
   * @param {Object} accelerator - {website, name, country}
   * @returns {boolean} True if added/updated successfully
   */
  addAccelerator: function(accelerator) {
    try {
      if (!accelerator.website || !isValidUrl(accelerator.website)) {
        Logger.warning('SheetManager', 'Invalid accelerator URL', accelerator);
        return false;
      }
      
      const sheet = this.getOrCreateSheet(CONFIG.SHEET_ACCELERATORS, ['website', 'name', 'country']);
      const normalizedUrl = normalizeUrl(accelerator.website);
      const existingRow = this.findRowByUrl(CONFIG.SHEET_ACCELERATORS, normalizedUrl);
      
      if (existingRow > 0) {
        // Update existing row
        sheet.getRange(existingRow, 1, 1, 3).setValues([[
          normalizedUrl,
          accelerator.name || '',
          accelerator.country || ''
        ]]);
        Logger.info('SheetManager', 'Updated accelerator', {website: normalizedUrl});
      } else {
        // Add new row
        sheet.appendRow([
          normalizedUrl,
          accelerator.name || '',
          accelerator.country || ''
        ]);
        Logger.info('SheetManager', 'Added new accelerator', {website: normalizedUrl});
      }
      
      return true;
    } catch (e) {
      Logger.error('SheetManager', 'Failed to add accelerator', {error: e.message, accelerator: accelerator});
      return false;
    }
  },
  
  /**
   * Add or update a startup (idempotent)
   * @param {Object} startup - {website, name, country, accelerator, value_proposition}
   * @returns {boolean} True if added/updated successfully
   */
  addStartup: function(startup) {
    try {
      if (!startup.website || !isValidUrl(startup.website)) {
        Logger.warning('SheetManager', 'Invalid startup URL', startup);
        return false;
      }
      
      const sheet = this.getOrCreateSheet(CONFIG.SHEET_STARTUPS, 
        ['website', 'name', 'country', 'accelerator', 'value_proposition']);
      const normalizedUrl = normalizeUrl(startup.website);
      const existingRow = this.findRowByUrl(CONFIG.SHEET_STARTUPS, normalizedUrl);
      
      if (existingRow > 0) {
        // Update existing row (but don't overwrite existing value_proposition)
        const currentData = sheet.getRange(existingRow, 1, 1, 5).getValues()[0];
        const valueProp = currentData[4] || startup.value_proposition || '';
        
        sheet.getRange(existingRow, 1, 1, 5).setValues([[
          normalizedUrl,
          startup.name || currentData[1] || '',
          startup.country || currentData[2] || '',
          startup.accelerator || currentData[3] || '',
          valueProp
        ]]);
        Logger.info('SheetManager', 'Updated startup', {website: normalizedUrl});
      } else {
        // Add new row
        sheet.appendRow([
          normalizedUrl,
          startup.name || '',
          startup.country || '',
          startup.accelerator || '',
          startup.value_proposition || ''
        ]);
        Logger.info('SheetManager', 'Added new startup', {website: normalizedUrl});
      }
      
      return true;
    } catch (e) {
      Logger.error('SheetManager', 'Failed to add startup', {error: e.message, startup: startup});
      return false;
    }
  },
  
  /**
   * Update value proposition for a startup
   * @param {string} website - Startup website URL
   * @param {string} valueProp - Value proposition text
   * @returns {boolean} True if updated successfully
   */
  updateValueProposition: function(website, valueProp) {
    try {
      const sheet = this.getOrCreateSheet(CONFIG.SHEET_STARTUPS, null);
      const row = this.findRowByUrl(CONFIG.SHEET_STARTUPS, website);
      
      if (row > 0) {
        sheet.getRange(row, CONFIG.STARTUP_COL_VALUE_PROP + 1).setValue(valueProp);
        Logger.info('SheetManager', 'Updated value proposition', {website: normalizeUrl(website)});
        return true;
      } else {
        Logger.warning('SheetManager', 'Startup not found for value prop update', {website: website});
        return false;
      }
    } catch (e) {
      Logger.error('SheetManager', 'Failed to update value proposition', {error: e.message, website: website});
      return false;
    }
  },
  
  /**
   * Get all accelerators
   * @returns {Array<Object>} Array of accelerator objects
   */
  getAllAccelerators: function() {
    try {
      const sheet = this.getOrCreateSheet(CONFIG.SHEET_ACCELERATORS, ['website', 'name', 'country']);
      const data = sheet.getDataRange().getValues();
      const accelerators = [];
      
      for (let i = 1; i < data.length; i++) { // Skip header
        if (data[i][0]) { // Has website
          accelerators.push({
            website: data[i][0],
            name: data[i][1],
            country: data[i][2]
          });
        }
      }
      
      return accelerators;
    } catch (e) {
      Logger.error('SheetManager', 'Failed to get accelerators', {error: e.message});
      return [];
    }
  },
  
  /**
   * Get startups without value propositions
   * @returns {Array<Object>} Array of startup objects
   */
  getStartupsWithoutValueProp: function() {
    try {
      const sheet = this.getOrCreateSheet(CONFIG.SHEET_STARTUPS, null);
      const data = sheet.getDataRange().getValues();
      const startups = [];
      
      for (let i = 1; i < data.length; i++) { // Skip header
        const valueProp = data[i][CONFIG.STARTUP_COL_VALUE_PROP];
        if (data[i][0] && (!valueProp || valueProp.trim() === '')) {
          startups.push({
            website: data[i][0],
            name: data[i][1],
            country: data[i][2],
            accelerator: data[i][3]
          });
        }
      }
      
      return startups;
    } catch (e) {
      Logger.error('SheetManager', 'Failed to get startups without value prop', {error: e.message});
      return [];
    }
  },
  
  /**
   * Get count of records in a sheet
   * @param {string} sheetName - Name of the sheet
   * @returns {number} Number of records (excluding header)
   */
  getRecordCount: function(sheetName) {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
      if (!sheet) return 0;
      return Math.max(0, sheet.getLastRow() - 1); // Exclude header
    } catch (e) {
      return 0;
    }
  }
};
