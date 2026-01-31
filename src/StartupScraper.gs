/**
 * Startup Scraper Module
 * Discovers startups by visiting Accelerator websites
 */

const StartupScraper = {
  /**
   * Discover startups by scraping accelerator websites
   * @param {number} limit - Max number of accelerators to process per run
   */
  updateStartupsFromAccelerators: function(limit = 3) {
    Logger.info('StartupScraper', 'Inizio scouting dai siti degli acceleratori');
    const results = { acceleratorsProcessed: 0, startupsAdded: 0, startupsFailed: 0 };
    
    try {
      // 1. Get Accelerators
      const accelerators = SheetManager.getAllAccelerators();
      if (accelerators.length === 0) {
        Logger.warning('StartupScraper', 'Nessun acceleratore trovato nel database.');
        return results;
      }
      
      // Randomize to vary scraping targets or pick first N
      // Use random sort to avoid getting stuck on the same ones if time limits hit
      const targetAccelerators = accelerators.sort(() => 0.5 - Math.random()).slice(0, limit);
      
      for (const accelerator of targetAccelerators) {
        try {
          Logger.info('StartupScraper', `Scraping sito: ${accelerator.name} (${accelerator.website})`);
          
          const foundStartups = this.scrapeAcceleratorSite(accelerator);
          
          if (foundStartups.length > 0) {
            results.acceleratorsProcessed++;
            Logger.info('StartupScraper', `Trovate ${foundStartups.length} startup per ${accelerator.name}`);
            
            for (const startup of foundStartups) {
              if (SheetManager.addStartup(startup)) {
                results.startupsAdded++;
              } else {
                results.startupsFailed++;
              }
            }
          } else {
             Logger.info('StartupScraper', `Nessuna startup trovata su ${accelerator.name} (o sito non accessibile)`);
          }
           
          // Respect API/Scraping etiquette
          Utilities.sleep(CONFIG.SCRAPING_DELAY_MS);
          
        } catch (e) {
          Logger.error('StartupScraper', `Errore processando ${accelerator.name}`, { error: e.toString() });
        }
      }
      
      SheetManager.optimizeSheet(CONFIG.SHEET_STARTUPS);
      return results;
      
    } catch (e) {
      Logger.error('StartupScraper', 'Errore generale scouting', {error: e.message});
      throw e;
    }
  },
  
  /**
   * Visit accelerator site and use AI to extract startups
   */
  scrapeAcceleratorSite: function(accelerator) {
    try {
      // 1. Fetch Content
      const response = fetchWebContent(accelerator.website);
      if (!response.success) {
        Logger.warning('StartupScraper', `Sito irraggiungibile: ${accelerator.website}`, { status: response.statusCode });
        return [];
      }
      
      // 2. Extract Text & Links
      // We pass a generous amount of text to the LLM
      const text = extractTextFromHtml(response.content, 15000); 
      if (!text || text.length < 100) return [];
      
      // 3. Ask AI to identify startups
      const apiKey = getApiKey();
      
      const prompt = `You are a data extraction engine. 
      Analyze the text below from the website of "${accelerator.name}".
      Identify startups that are part of their portfolio/batch/alumni.
      
      Return a JSON array of objects:
      [{"name": "Startup Name", "website": "https://startup.com", "sector": "Sector", "description": "Short description"}]
      
      Rules:
      - Only include companies that look like startups.
      - Try to find their website URL if present in the text (or infer it if obvious, otherwise leave empty).
      - If no startups are found, return [].
      - Output ONLY JSON.
      
      TEXT:
      ${text.substring(0, 12000)}`; // Truncate to avoid token limits
      
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
      
      const llmRes = UrlFetchApp.fetch(CONFIG.LLM_ENDPOINT, options);
      if (llmRes.getResponseCode() !== 200) {
        Logger.error('StartupScraper', 'Errore LLM', { body: llmRes.getContentText() });
        return [];
      }
      
      // 4. Parse Response
      const body = llmRes.getContentText();
      const cleaned = body.replace(/```json|```/g, '').trim();
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) return [];
      
      const startups = JSON.parse(jsonMatch[0]);
      
      // 5. Post-process
      return startups.map(s => ({
        ...s,
        accelerator: accelerator.name, // Link to the accelerator
        website: normalizeUrl(s.website)
      })).filter(s => s.name && s.name.length > 1);
      
    } catch (e) {
      Logger.error('StartupScraper', `Errore scraping ${accelerator.name}`, { error: e.toString() });
      return [];
    }
  }
};
