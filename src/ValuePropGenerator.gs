/**
 * Value Proposition Generator Module
 * Generates value propositions for startups by visiting their websites
 */

const ValuePropGenerator = {
  /**
   * Generate value propositions for startups that don't have them
   * @param {number} batchSize - Number of startups to process
   */
  generateValuePropositions: function(batchSize = 10) {
    Logger.info('ValuePropGenerator', `Inizio generazione VP (batch: ${batchSize})`);
    
    const results = { processed: 0, success: 0, failed: 0, skipped: 0 };
    
    try {
      // 1. Get targets
      const startups = SheetManager.getStartupsWithoutValueProp();
      
      if (startups.length === 0) {
        Logger.info('ValuePropGenerator', 'Nessuna startup senza VP trovata.');
        return results;
      }
      
      const batch = startups.slice(0, batchSize);
      
      // 2. Process batch
      for (const startup of batch) {
        results.processed++;
        
        try {
          if (!startup.website) {
            results.skipped++;
            continue;
          }

          Logger.info('ValuePropGenerator', `Analisi sito per: ${startup.name} (${startup.website})`);
          const vp = this.generateForStartup(startup);
          
          if (vp) {
            if (SheetManager.updateValueProposition(startup.website, vp)) {
              results.success++;
              Logger.info('ValuePropGenerator', `VP salvata per ${startup.name}`);
            } else {
              results.failed++;
            }
          } else {
            results.failed++;
             // Mark as failed in logs? Or maybe write "N/A" to avoid retry loop?
             // For now, we skip saving so it retries later or user fixes URL.
          }
          
          // Respect rate limits
          Utilities.sleep(CONFIG.API_DELAY_MS);
          
        } catch (e) {
          results.failed++;
          Logger.error('ValuePropGenerator', `Errore su ${startup.name}`, { error: e.toString() });
        }
      }
      
      return results;
      
    } catch (e) {
      Logger.error('ValuePropGenerator', 'Errore fatale generazione', {error: e.message});
      throw e;
    }
  },
  
  /**
   * Visit startup website and generate VP with LLM
   */
  generateForStartup: function(startup) {
    try {
      // 1. Fetch
      const response = fetchWebContent(startup.website);
      
      if (!response.success) {
        Logger.warning('ValuePropGenerator', `Sito irraggiungibile: ${startup.website}`);
        // Return a placeholder so we don't loop forever? 
        // Or return null to retry? Let's return a note.
        return 'ERR: Sito non raggiungibile';
      }
      
      // 2. Extract Text
      const text = extractTextFromHtml(response.content, 4000);
      if (!text || text.length < 50) {
        return 'ERR: Contenuto insufficiente';
      }
      
      // 3. Prompt LLM
      const apiKey = getApiKey();
      const prompt = `Startups Value Proposition Generator.
      
      Task: Create a concise value proposition in ITALIAN for the startup described below.
      Format: "Startup [Name] aiuta [Target] a [Azione] così che [Risultato]"
      
      STARTUP: ${startup.name}
      WEBSITE CONTENT:
      ${text}
      
      Rules:
      - STRICTLY follow the format.
      - Output ONLY the sentence. No quotes, no intro.
      - If you cannot determine what they do, output "N/A".
      `;
      
      const payload = {
        model: CONFIG.LLM_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 150
      };
      
      const options = {
        method: 'post',
        contentType: 'application/json',
        headers: { 'Authorization': 'Bearer ' + apiKey },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
      
      const apiRes = UrlFetchApp.fetch(CONFIG.LLM_ENDPOINT, options);
      if (apiRes.getResponseCode() !== 200) return null;
      
      let vp = JSON.parse(apiRes.getContentText()).choices[0].message.content.trim();
      
      // Cleanup cleanup
      vp = vp.replace(/^"|"$/g, ''); 
      if (vp.includes('N/A')) return 'N/A: Contenuto non chiaro';
      
      return vp;
      
    } catch (e) {
      Logger.error('ValuePropGenerator', `Generazione fallita per ${startup.name}`, { error: e.toString() });
      return null;
    }
  }
};
