/**
 * Sheet Manager Module
 * Handles all Google Sheets operations with idempotency and deduplication
 */

const SheetManager = {
  getOrCreateSheet: function(name, headers) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      if (headers) {
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
        sheet.setFrozenRows(1);
      }
    }
    return sheet;
  },
  
  initializeSheets: function() {
    this.getOrCreateSheet(CONFIG.SHEET_ACCELERATORS, ['ID', 'Nome Acceleratore', 'Paese', 'Focus', 'URL', 'Descrizione']);
    this.getOrCreateSheet(CONFIG.SHEET_STARTUPS, ['ID', 'Nome', 'Paese', 'Settore', 'URL', 'Descrizione', 'Acceleratore', 'Value Proposition']);
    // this.getOrCreateSheet(CONFIG.SHEET_VALUE_PROPS, ['ID', 'Startup', 'Acceleratore', 'Match Score', 'Value proposition', 'Data generazione']);
    this.getOrCreateSheet(CONFIG.SHEET_LOGS, ['Timestamp', 'Level', 'Function', 'Message', 'Details']);
    Logger.info('SheetManager', 'Fogli inizializzati');
  },
  
  findRowByUrl: function(sheetName, url) {
    if (!url) return -1;
    const sheet = this.getOrCreateSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    const normalizedUrl = normalizeUrl(url);
    
    // Both Startups and Accelerators now have URL in Column E (index 4)
    const websiteCol = (sheetName === CONFIG.SHEET_ACCELERATORS) ? CONFIG.ACC_COL_WEBSITE : CONFIG.STARTUP_COL_WEBSITE;
    
    for (let i = 1; i < data.length; i++) {
      const cellValue = data[i][websiteCol];
      if (cellValue && typeof cellValue === 'string' && cellValue.includes('.')) {
        if (normalizeUrl(cellValue) === normalizedUrl) return i + 1;
      }
    }
    
    return -1;
  },
  
  addAccelerator: function(accelerator) {
    try {
      if (!accelerator.website) return false;
      const sheet = this.getOrCreateSheet(CONFIG.SHEET_ACCELERATORS);
      const url = normalizeUrl(accelerator.website);
      const row = this.findRowByUrl(CONFIG.SHEET_ACCELERATORS, url);
      
      const values = [
        0, // Temporary
        accelerator.name || '', 
        accelerator.country || '', 
        accelerator.focus || '', 
        url, 
        accelerator.description || ''
      ];
      
      if (row > 0) {
        values[0] = sheet.getRange(row, 1).getValue();
        sheet.getRange(row, 1, 1, 6).setValues([values]);
        Logger.info('SheetManager', 'Aggiornato acceleratore esistente', { name: accelerator.name });
      } else {
        sheet.appendRow(values);
        Logger.info('SheetManager', 'Aggiunto nuovo acceleratore', { name: accelerator.name });
      }
      
      this.optimizeSheet(CONFIG.SHEET_ACCELERATORS);
      return true;
    } catch (e) {
      Logger.error('SheetManager', 'Fallito addAccelerator', { error: e.toString() });
      return false;
    }
  },
  
  addStartup: function(startup) {
    try {
      if (!startup.website) return false;
      const sheet = this.getOrCreateSheet(CONFIG.SHEET_STARTUPS);
      const url = normalizeUrl(startup.website);
      const row = this.findRowByUrl(CONFIG.SHEET_STARTUPS, url);
      
      // ID, Nome, Paese, Settore, URL, Descrizione, Acceleratore, Value Proposition
      const values = [
        0, // Temporary ID, will be fixed by optimizeSheet
        startup.name || '', 
        startup.country || '', 
        startup.sector || '', 
        url, 
        startup.description || '',
        startup.accelerator || '',
        startup.value_proposition || ''
      ];
      
      if (row > 0) {
        // Reuse old ID
        values[0] = sheet.getRange(row, 1).getValue();
        // Preserve existing VP if new one is empty
        if (!values[7]) {
           const existingVP = sheet.getRange(row, 8).getValue();
           if (existingVP) values[7] = existingVP;
        }
        sheet.getRange(row, 1, 1, 8).setValues([values]);
        Logger.info('SheetManager', 'Aggiornata startup esistente', { name: startup.name });
      } else {
        sheet.appendRow(values);
        Logger.info('SheetManager', 'Aggiunta nuova startup', { name: startup.name });
      }
      
      this.optimizeSheet(CONFIG.SHEET_STARTUPS);
      return true;
    } catch (e) {
      Logger.error('SheetManager', 'Fallito addStartup', { error: e.toString() });
      return false;
    }
  },

  /**
   * Optimize sheet: remove empty rows, remove duplicates by URL, and re-sequence IDs
   */
  optimizeSheet: function(sheetName) {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
      if (!sheet) return;
      
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) return;
      
      const headers = data[0];
      const rows = data.slice(1);
      
      // 1. Filter out empty rows and duplicates
      const seenUrls = new Set();
      const cleanRows = [];
      
      // URL is in column E (index 4) for both sheets
      const urlIndex = (sheetName === CONFIG.SHEET_ACCELERATORS) ? CONFIG.ACC_COL_WEBSITE : CONFIG.STARTUP_COL_WEBSITE;
      
      for (const row of rows) {
        // Check if row is mostly empty
        const isNonEmpty = row.some(cell => cell !== null && cell !== '');
        if (!isNonEmpty) continue;
        
        const url = normalizeUrl(row[urlIndex]);
        if (url && !seenUrls.has(url)) {
          seenUrls.add(url);
          cleanRows.push(row);
        }
      }
      
      // 2. Re-sequence IDs (Column A / index 0)
      cleanRows.forEach((row, index) => {
        row[0] = index + 1;
      });
      
      // 3. Write back to sheet (Handling variable column width)
      sheet.clearContents();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      if (cleanRows.length > 0) {
        sheet.getRange(2, 1, cleanRows.length, headers.length).setValues(cleanRows);
      }
      
      Logger.info('SheetManager', `Ottimizzato foglio ${sheetName}`, { 
        original: rows.length, 
        optimized: cleanRows.length 
      });
    } catch (e) {
      Logger.error('SheetManager', `Errore ottimizzazione ${sheetName}`, { error: e.toString() });
    }
  },
  
  /**
   * Update the Value Proposition for a specific startup
   */
  updateStartupValueProp: function(website, valueProp) {
    try {
      const sheet = this.getOrCreateSheet(CONFIG.SHEET_STARTUPS);
      const row = this.findRowByUrl(CONFIG.SHEET_STARTUPS, website);
      
      if (row > 0) {
        // Column H (index 8, 1-based) is Value Proposition. 
        // CONFIG.STARTUP_COL_VALUE_PROP is 7 (0-based) -> Column 8
        sheet.getRange(row, 8).setValue(valueProp);
        Logger.info('SheetManager', 'VP salvata su Startup', { website });
        return true;
      }
      return false;
    } catch (e) {
      Logger.error('SheetManager', 'Errore updateStartupValueProp', { error: e.toString() });
      return false;
    }
  },

  addValueProposition: function(vpData) {
     // DEPRECATED COMPATIBILITY WRAPPER
     // If possible, map to updateStartupValueProp
     // Look up website by name? It's risky. Better to rely on new flow.
     Logger.warning('SheetManager', 'addValueProposition è deprecato. Uso updateStartupValueProp se possibile.');
     return false; 
  },

  updateValueProposition: function(website, valueProp) {
    return this.updateStartupValueProp(website, valueProp);
  },
  
  getAllAccelerators: function() {
    const data = this.getOrCreateSheet(CONFIG.SHEET_ACCELERATORS).getDataRange().getValues();
    return data.slice(1).map(r => ({ 
      website: r[CONFIG.ACC_COL_WEBSITE], 
      name: r[CONFIG.ACC_COL_NAME], 
      country: r[CONFIG.ACC_COL_COUNTRY],
      focus: r[CONFIG.ACC_COL_FOCUS],
      description: r[CONFIG.ACC_COL_DESCRIPTION]
    })).filter(r => r.website);
  },
  
  getStartupsWithoutValueProp: function() {
    const data = this.getOrCreateSheet(CONFIG.SHEET_STARTUPS).getDataRange().getValues();
    // Headers are row 0. Data starts row 1.
    // Column H (index 7) is VP.
    return data.slice(1).map((r, i) => ({
      rowIndex: i + 2, // 1-based index in sheet
      website: r[CONFIG.STARTUP_COL_WEBSITE], 
      name: r[CONFIG.STARTUP_COL_NAME], 
      country: r[CONFIG.STARTUP_COL_COUNTRY],
      sector: r[CONFIG.STARTUP_COL_SECTOR],
      description: r[CONFIG.STARTUP_COL_DESCRIPTION],
      accelerator: r[CONFIG.STARTUP_COL_ACCELERATOR],
      value_proposition: r[7] // Hardcoded for now based on array index
    })).filter(r => r.website && (!r.value_proposition || r.value_proposition === ''));
  },
  
  getRecordCount: function(name) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    return sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;
  }
};
