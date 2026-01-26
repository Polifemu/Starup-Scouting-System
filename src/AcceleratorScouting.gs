/**
 * Accelerator Scouting Module
 * Discovers and adds European accelerators to the database
 */

const AcceleratorScouting = {
  /**
   * Scout accelerators and add them to the sheet
   * @param {number} batchSize - Number of accelerators to add
   * @returns {Object} Results summary
   */
  scoutAccelerators: function(batchSize = CONFIG.ACCELERATORS_BATCH_SIZE) {
    Logger.info('AcceleratorScouting', `Starting accelerator scouting (batch: ${batchSize})`);
    
    const results = {
      success: 0,
      skipped: 0,
      failed: 0,
      total: 0
    };
    
    try {
      // Initialize sheets if needed
      SheetManager.initializeSheets();
      
      // Get seed accelerators
      const seedAccelerators = CONFIG.SEED_ACCELERATORS.slice(0, batchSize);
      
      for (const accelerator of seedAccelerators) {
        results.total++;
        
        try {
          // Check if already exists
          if (SheetManager.findRowByUrl(CONFIG.SHEET_ACCELERATORS, accelerator.website) > 0) {
            Logger.info('AcceleratorScouting', 'Accelerator already exists, skipping', {name: accelerator.name});
            results.skipped++;
            continue;
          }
          
          // Add to sheet
          if (SheetManager.addAccelerator(accelerator)) {
            results.success++;
            Logger.info('AcceleratorScouting', 'Successfully added accelerator', {name: accelerator.name});
          } else {
            results.failed++;
          }
          
          // Small delay to avoid rate limiting
          Utilities.sleep(CONFIG.SCRAPING_DELAY_MS);
          
        } catch (e) {
          Logger.error('AcceleratorScouting', 'Error processing accelerator', {
            name: accelerator.name,
            error: e.message
          });
          results.failed++;
        }
      }
      
      Logger.info('AcceleratorScouting', 'Scouting completed', results);
      return results;
      
    } catch (e) {
      Logger.error('AcceleratorScouting', 'Fatal error in scouting', {error: e.message});
      throw e;
    }
  },
  
  /**
   * Add custom accelerator manually
   * @param {string} website - Accelerator website
   * @param {string} name - Accelerator name
   * @param {string} country - Country
   * @returns {boolean} Success status
   */
  addCustomAccelerator: function(website, name, country) {
    try {
      if (!isValidUrl(website)) {
        Logger.error('AcceleratorScouting', 'Invalid URL provided', {website: website});
        return false;
      }
      
      const accelerator = {
        website: website,
        name: name || getDomain(website),
        country: country || 'Unknown'
      };
      
      const result = SheetManager.addAccelerator(accelerator);
      
      if (result) {
        Logger.info('AcceleratorScouting', 'Manually added accelerator', accelerator);
      }
      
      return result;
    } catch (e) {
      Logger.error('AcceleratorScouting', 'Failed to add custom accelerator', {
        error: e.message,
        website: website
      });
      return false;
    }
  },
  
  /**
   * Verify accelerator website is accessible
   * @param {string} url - Accelerator URL
   * @returns {boolean} True if accessible
   */
  verifyAcceleratorAccess: function(url) {
    try {
      const response = fetchWebContent(url);
      return response.success;
    } catch (e) {
      return false;
    }
  }
};
