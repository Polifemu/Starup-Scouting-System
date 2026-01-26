/**
 * Main Entry Point
 * Creates menu and coordinates main operations
 */

/**
 * Creates custom menu when spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 Startup Scouting AI')
    .addItem('📊 Initialize Sheets', 'initializeSheets')
    .addSeparator()
    .addItem('🔍 Scout Accelerators', 'scoutAccelerators')
    .addItem('🏢 Update Startups from Accelerators', 'updateStartupsFromAccelerators')
    .addItem('💡 Generate Value Propositions', 'generateValuePropositions')
    .addSeparator()
    .addItem('⚙️ Configure API Key', 'showApiKeyDialog')
    .addItem('📈 Show Statistics', 'showStatistics')
    .addItem('🧹 Clear Logs', 'clearLogs')
    .addToUi();
  
  Logger.info('Main', 'Menu created successfully');
}

/**
 * Initialize all required sheets
 */
function initializeSheets() {
  try {
    SheetManager.initializeSheets();
    SpreadsheetApp.getUi().alert(
      'Success',
      'All sheets have been initialized successfully!',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (e) {
    Logger.error('Main', 'Failed to initialize sheets', {error: e.message});
    SpreadsheetApp.getUi().alert(
      'Error',
      'Failed to initialize sheets: ' + e.message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Scout new accelerators - Menu command
 */
function scoutAccelerators() {
  try {
    const ui = SpreadsheetApp.getUi();
    
    // Show progress
    const toast = SpreadsheetApp.getActiveSpreadsheet();
    toast.toast('Scouting accelerators...', 'In Progress', -1);
    
    const results = AcceleratorScouting.scoutAccelerators(CONFIG.ACCELERATORS_BATCH_SIZE);
    
    toast.toast(
      `✓ Added: ${results.success} | ⊘ Skipped: ${results.skipped} | ✗ Failed: ${results.failed}`,
      'Accelerator Scouting Complete',
      10
    );
    
    ui.alert(
      'Scouting Complete',
      `Results:\n` +
      `• Total processed: ${results.total}\n` +
      `• Successfully added: ${results.success}\n` +
      `• Already existed (skipped): ${results.skipped}\n` +
      `• Failed: ${results.failed}\n\n` +
      `Check the '${CONFIG.SHEET_LOGS}' sheet for detailed logs.`,
      ui.ButtonSet.OK
    );
    
  } catch (e) {
    Logger.error('Main', 'Accelerator scouting failed', {error: e.message});
    SpreadsheetApp.getUi().alert(
      'Error',
      'Accelerator scouting failed: ' + e.message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Update startups from accelerators - Menu command
 */
function updateStartupsFromAccelerators() {
  try {
    const ui = SpreadsheetApp.getUi();
    
    // Confirm action
    const response = ui.alert(
      'Update Startups',
      'This will scrape startup information from all accelerators in your database. This may take several minutes. Continue?',
      ui.ButtonSet.YES_NO
    );
    
    if (response !== ui.Button.YES) {
      return;
    }
    
    // Show progress
    const toast = SpreadsheetApp.getActiveSpreadsheet();
    toast.toast('Updating startups from accelerators...', 'In Progress', -1);
    
    const results = StartupScraper.updateStartupsFromAccelerators();
    
    toast.toast(
      `✓ ${results.startupsAdded} startups added from ${results.acceleratorsProcessed} accelerators`,
      'Update Complete',
      10
    );
    
    ui.alert(
      'Update Complete',
      `Results:\n` +
      `• Accelerators processed: ${results.acceleratorsProcessed}\n` +
      `• Accelerators failed: ${results.acceleratorsFailed}\n` +
      `• Startups found: ${results.startupsFound}\n` +
      `• Startups added: ${results.startupsAdded}\n` +
      `• Startups failed: ${results.startupsFailed}\n\n` +
      `Check the '${CONFIG.SHEET_LOGS}' sheet for detailed logs.`,
      ui.ButtonSet.OK
    );
    
  } catch (e) {
    Logger.error('Main', 'Startup update failed', {error: e.message});
    SpreadsheetApp.getUi().alert(
      'Error',
      'Startup update failed: ' + e.message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Generate value propositions - Menu command
 */
function generateValuePropositions() {
  try {
    const ui = SpreadsheetApp.getUi();
    
    // Check if API key is configured
    try {
      validateConfig();
    } catch (e) {
      ui.alert(
        'Configuration Required',
        'Please configure your OpenAI API key first using "Configure API Key" from the menu.',
        ui.ButtonSet.OK
      );
      return;
    }
    
    // Confirm action
    const response = ui.alert(
      'Generate Value Propositions',
      `This will generate value propositions for up to ${CONFIG.VALUE_PROP_BATCH_SIZE} startups using OpenAI API (this will incur costs). Continue?`,
      ui.ButtonSet.YES_NO
    );
    
    if (response !== ui.Button.YES) {
      return;
    }
    
    // Show progress
    const toast = SpreadsheetApp.getActiveSpreadsheet();
    toast.toast('Generating value propositions...', 'In Progress', -1);
    
    const results = ValuePropGenerator.generateValuePropositions(CONFIG.VALUE_PROP_BATCH_SIZE);
    
    toast.toast(
      `✓ Generated: ${results.success} | ⊘ Skipped: ${results.skipped} | ✗ Failed: ${results.failed}`,
      'Generation Complete',
      10
    );
    
    ui.alert(
      'Generation Complete',
      `Results:\n` +
      `• Total processed: ${results.processed}\n` +
      `• Successfully generated: ${results.success}\n` +
      `• Skipped: ${results.skipped}\n` +
      `• Failed: ${results.failed}\n\n` +
      `Check the '${CONFIG.SHEET_LOGS}' sheet for detailed logs.`,
      ui.ButtonSet.OK
    );
    
  } catch (e) {
    Logger.error('Main', 'Value proposition generation failed', {error: e.message});
    SpreadsheetApp.getUi().alert(
      'Error',
      'Value proposition generation failed: ' + e.message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Show API key configuration dialog
 */
function showApiKeyDialog() {
  const ui = SpreadsheetApp.getUi();
  
  const result = ui.prompt(
    'Configure OpenAI API Key',
    'Enter your OpenAI API key:\n(It will be stored securely in Script Properties)',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (result.getSelectedButton() === ui.Button.OK) {
    const apiKey = result.getResponseText().trim();
    
    if (apiKey) {
      try {
        setOpenAIKey(apiKey);
        ui.alert(
          'Success',
          'API key has been configured successfully!',
          ui.ButtonSet.OK
        );
      } catch (e) {
        ui.alert(
          'Error',
          'Failed to save API key: ' + e.message,
          ui.ButtonSet.OK
        );
      }
    } else {
      ui.alert(
        'Error',
        'API key cannot be empty.',
        ui.ButtonSet.OK
      );
    }
  }
}

/**
 * Show statistics about current data
 */
function showStatistics() {
  try {
    const acceleratorCount = SheetManager.getRecordCount(CONFIG.SHEET_ACCELERATORS);
    const startupCount = SheetManager.getRecordCount(CONFIG.SHEET_STARTUPS);
    const startupsWithoutValueProp = SheetManager.getStartupsWithoutValueProp().length;
    const startupsWithValueProp = startupCount - startupsWithoutValueProp;
    
    const message = 
      `📊 Database Statistics:\n\n` +
      `Accelerators: ${acceleratorCount}\n` +
      `Startups: ${startupCount}\n` +
      `  - With value propositions: ${startupsWithValueProp}\n` +
      `  - Without value propositions: ${startupsWithoutValueProp}\n\n` +
      `Coverage: ${startupCount > 0 ? Math.round((startupsWithValueProp / startupCount) * 100) : 0}%`;
    
    SpreadsheetApp.getUi().alert(
      'Statistics',
      message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (e) {
    Logger.error('Main', 'Failed to get statistics', {error: e.message});
    SpreadsheetApp.getUi().alert(
      'Error',
      'Failed to get statistics: ' + e.message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Clear old logs
 */
function clearLogs() {
  try {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      'Clear Logs',
      'This will keep only the most recent 100 log entries. Continue?',
      ui.ButtonSet.YES_NO
    );
    
    if (response === ui.Button.YES) {
      Logger.cleanup(100);
      ui.alert(
        'Success',
        'Logs have been cleared.',
        ui.ButtonSet.OK
      );
    }
  } catch (e) {
    SpreadsheetApp.getUi().alert(
      'Error',
      'Failed to clear logs: ' + e.message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}
