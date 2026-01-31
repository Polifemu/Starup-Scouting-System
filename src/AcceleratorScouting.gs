const AcceleratorScouting = {
  scoutAccelerators: function(batchSize = 5) {
    const ui = SpreadsheetApp.getUi();
    const results = { success: 0, skipped: 0, failed: 0, total: 0 };
    
    try {
      SheetManager.initializeSheets();
      
      // Step 1: Chiamata AI
      ui.alert('🛠 Debug: Chiedo all\'AI di trovare acceleratori...');
      const newAccelerators = this.scoutWithAI(batchSize);
      
      if (!newAccelerators || newAccelerators.length === 0) {
        ui.alert('❌ Debug: L\'IA non ha restituito nessun acceleratore valido.');
        return results;
      }
      
      ui.alert('✅ Debug: Trovati ' + newAccelerators.length + ' acceleratori. Inizio a scriverli...');
      
      for (const accelerator of newAccelerators) {
        results.total++;
        try {
          if (SheetManager.findRowByUrl(CONFIG.SHEET_ACCELERATORS, accelerator.website) > 0) {
            results.skipped++;
            continue;
          }
          
          if (SheetManager.addAccelerator(accelerator)) {
            results.success++;
          } else {
            results.failed++;
          }
        } catch (e) {
          results.failed++;
        }
      }
      
      return results;
    } catch (e) {
      ui.alert('❌ ERRORE CRITICO: ' + e.toString());
      throw e;
    }
  },

  scoutWithAI: function(limit) {
    try {
      const apiKey = getApiKey();
      // Prompt semplificato al massimo per evitare errori di parsing
      const prompt = `LIST 5 STARTUP ACCELERATORS IN EUROPE. 
      Output ONLY a JSON array. No text before or after.
      Format: [{"name": "Name", "website": "https://url.com", "country": "Country", "focus": "Tech/Biotech/etc", "description": "Brief description"}]`;
      
      const payload = {
        model: CONFIG.LLM_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1
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
      const body = response.getContentText();
      
      if (code !== 200) {
        throw new Error('Groq API Error (' + code + '): ' + body);
      }
      
      const jsonResponse = JSON.parse(body);
      let content = jsonResponse.choices[0].message.content.trim();
      
      // Pulizia aggressiva del contenuto
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const start = content.indexOf('[');
      const end = content.lastIndexOf(']');
      
      if (start === -1 || end === -1) {
        Logger.error('AcceleratorScouting', 'JSON non trovato nel testo AI', { text: content });
        return [];
      }
      
      const jsonStr = content.substring(start, end + 1);
      return JSON.parse(jsonStr);
      
    } catch (e) {
      Logger.error('AcceleratorScouting', 'scoutWithAI failed', { error: e.toString() });
      throw e;
    }
  }
};
