/**
 * Main Entry Point
 * Creates menu and coordinates main operations
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 Scouting AI')
    .addItem('📊 Inizializza Fogli', 'initializeSheets')
    .addSeparator()
    .addItem('🔍 Scopri Acceleratori (AI)', 'scoutAccelerators')
    .addItem('🏢 Scopri Startup (IA Indipendente)', 'updateStartupsFromAccelerators')
    .addItem('💡 Matching e Value Prop', 'generateValuePropositions')
    .addSeparator()
    .addItem('🧪 Test Connessione (Debug)', 'testConnessione')
    .addItem('📈 Mostra Statistiche', 'showStatistics')
    .addItem('🧹 Pulisci Logs', 'clearLogs')
    .addItem('🔧 Sincronizza Nomi Fogli', 'fixSheetNames')
    .addToUi();
  
  Logger.info('Main', 'Menu creato con successo');
}

/**
 * Funzione di debug per testare la connessione a Groq
 */
function testConnessione() {
  const ui = SpreadsheetApp.getUi();
  ui.alert('⏳ Test in corso... Verifico API Key e connessione a Groq.');
  
  try {
    const apiKey = getApiKey();
    ui.alert('✅ API Key trovata correttamente.');
    
    const payload = {
      model: CONFIG.LLM_MODEL,
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 10
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + apiKey },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(CONFIG.LLM_ENDPOINT, options);
    const code = response.getResponseCode();
    
    if (code === 200) {
      ui.alert('✅ CONNESSIONE GROQ OK!\n\nL\'API risponde correttamente. Il sistema è pronto.');
    } else {
      ui.alert('❌ ERRORE GROQ (Codice ' + code + '):\n' + response.getContentText().substring(0, 200));
    }
    
  } catch (e) {
    ui.alert('❌ ERRORE CONFIGURAZIONE:\n' + e.message);
  }
}

function initializeSheets() {
  try {
    SheetManager.initializeSheets();
    SheetManager.optimizeSheet(CONFIG.SHEET_ACCELERATORS);
    SheetManager.optimizeSheet(CONFIG.SHEET_STARTUPS);
    SheetManager.optimizeSheet(CONFIG.SHEET_VALUE_PROPS);
    SpreadsheetApp.getUi().alert('Successo', 'Fogli inizializzati e ottimizzati correttamente!', SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    Logger.error('Main', 'Errore inizializzazione', {error: e.message});
  }
}

function scoutAccelerators() {
  try {
    const toast = SpreadsheetApp.getActiveSpreadsheet();
    toast.toast('Scouting acceleratori...', 'In corso', -1);
    const results = AcceleratorScouting.scoutAccelerators(CONFIG.ACCELERATORS_BATCH_SIZE);
    
    const msg = `Scouting Acceleratori Completato!\n\n` +
                `• Nuovi aggiunti: ${results.success}\n` +
                `• Già presenti: ${results.skipped}\n` +
                `• Errori: ${results.failed}`;
    
    SpreadsheetApp.getUi().alert(msg);
    toast.toast(`✓ Aggiunti: ${results.success}`, 'Completato', 5);
  } catch (e) {
    Logger.error('Main', 'Scouting fallito', {error: e.message});
    SpreadsheetApp.getUi().alert('ERRORE CRITICO:\n' + e.message);
  }
}

function updateStartupsFromAccelerators() {
  try {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert('Aggiorna Startup', 'Vuoi cercare nuove startup dai siti degli acceleratori? (Sperimentale AI)', ui.ButtonSet.YES_NO);
    if (response !== ui.Button.YES) return;

    const toast = SpreadsheetApp.getActiveSpreadsheet();
    toast.toast('Analisi siti acceleratori...', 'In corso', -1);
    const results = StartupScraper.updateStartupsFromAccelerators();
    
    const msg = `Aggiornamento Startup Completato!\n\n` +
                `• Acceleratori processati: ${results.acceleratorsProcessed}\n` +
                `• Nuove startup aggiunte: ${results.startupsAdded}\n` +
                `• Errori: ${results.startupsFailed}`;
    
    ui.alert(msg);
    toast.toast(`✓ Startup aggiunte: ${results.startupsAdded}`, 'Completato', 5);
  } catch (e) {
    Logger.error('Main', 'Aggiornamento startup fallito', {error: e.message});
    SpreadsheetApp.getUi().alert('ERRORE CRITICO:\n' + e.message);
  }
}

function generateValuePropositions() {
  try {
    validateConfig();
    const toast = SpreadsheetApp.getActiveSpreadsheet();
    toast.toast('Generazione Value Propositions...', 'In corso', -1);
    const results = ValuePropGenerator.generateValuePropositions(CONFIG.VALUE_PROP_BATCH_SIZE);
    toast.toast(`✓ VP Generate: ${results.success} | ✗ Fallite: ${results.failed}`, 'Generazione completata', 5);
  } catch (e) {
    Logger.error('Main', 'Generazione VP fallita', {error: e.message});
    SpreadsheetApp.getUi().alert('Configurazione richiesta: assicurati di avere la API Key in Config B1');
  }
}

function showStatistics() {
  try {
    const accCount = SheetManager.getRecordCount(CONFIG.SHEET_ACCELERATORS);
    const stCount = SheetManager.getRecordCount(CONFIG.SHEET_STARTUPS);
    const vpCount = stCount - SheetManager.getStartupsWithoutValueProp().length;
    
    const message = `📊 Statistiche Database:\n\n` +
      `• Acceleratori: ${accCount}\n` +
      `• Startup: ${stCount}\n` +
      `• Value Prop generate: ${vpCount}\n` +
      `• Copertura: ${stCount > 0 ? Math.round((vpCount / stCount) * 100) : 0}%`;
    
    SpreadsheetApp.getUi().alert('Statistiche', message, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    Logger.error('Main', 'Errore statistiche', {error: e.message});
  }
}

function clearLogs() {
  Logger.cleanup(50);
  SpreadsheetApp.getUi().alert('Logs puliti.');
}

/**
 * Pulisce i nomi delle schede da spazi bianchi extra
 */
function fixSheetNames() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  let count = 0;
  sheets.forEach(s => {
    const oldName = s.getName();
    const newName = oldName.trim();
    if (oldName !== newName) {
      s.setName(newName);
      count++;
    }
  });
  SpreadsheetApp.getUi().alert('Pulizia completata! Rinominate ' + count + ' schede.');
}
