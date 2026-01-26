/**
 * Startup Scraper Module
 * Extracts startups from accelerator websites
 */

const StartupScraper = {
  /**
   * Common patterns for portfolio/alumni pages
   */
  PORTFOLIO_PATTERNS: [
    '/portfolio', '/companies', '/startups', '/alumni',
    '/investments', '/ventures', '/ecosystem'
  ],
  
  /**
   * Update startups from all accelerators
   * @returns {Object} Results summary
   */
  updateStartupsFromAccelerators: function() {
    Logger.info('StartupScraper', 'Starting startup update from accelerators');
    
    const results = {
      acceleratorsProcessed: 0,
      startupsFound: 0,
      startupsAdded: 0,
      startupsFailed: 0,
      acceleratorsFailed: 0
    };
    
    try {
      const accelerators = SheetManager.getAllAccelerators();
      Logger.info('StartupScraper', `Found ${accelerators.length} accelerators to process`);
      
      for (const accelerator of accelerators) {
        try {
          const startups = this.scrapeStartupsFromAccelerator(accelerator);
          results.acceleratorsProcessed++;
          results.startupsFound += startups.length;
          
          // Add startups to sheet
          for (const startup of startups) {
            if (SheetManager.addStartup(startup)) {
              results.startupsAdded++;
            } else {
              results.startupsFailed++;
            }
            
            // Small delay between operations
            Utilities.sleep(100);
          }
          
          // Delay between accelerators
          Utilities.sleep(CONFIG.SCRAPING_DELAY_MS);
          
        } catch (e) {
          Logger.error('StartupScraper', 'Failed to process accelerator', {
            accelerator: accelerator.name,
            error: e.message
          });
          results.acceleratorsFailed++;
        }
      }
      
      Logger.info('StartupScraper', 'Startup update completed', results);
      return results;
      
    } catch (e) {
      Logger.error('StartupScraper', 'Fatal error in startup update', {error: e.message});
      throw e;
    }
  },
  
  /**
   * Scrape startups from a specific accelerator
   * @param {Object} accelerator - Accelerator object
   * @returns {Array<Object>} Array of startup objects
   */
  scrapeStartupsFromAccelerator: function(accelerator) {
    Logger.info('StartupScraper', `Scraping startups from ${accelerator.name}`);
    const startups = [];
    
    try {
      // Try to find portfolio page
      const portfolioUrl = this.findPortfolioPage(accelerator.website);
      
      if (!portfolioUrl) {
        Logger.warning('StartupScraper', 'Could not find portfolio page', {
          accelerator: accelerator.name
        });
        return startups;
      }
      
      // Fetch portfolio page content
      const response = fetchWebContent(portfolioUrl);
      
      if (!response.success) {
        Logger.warning('StartupScraper', 'Failed to fetch portfolio page', {
          url: portfolioUrl,
          error: response.error
        });
        return startups;
      }
      
      // Extract startup URLs from the page
      const companyUrls = this.extractCompanyUrls(response.content, accelerator.website);
      Logger.info('StartupScraper', `Found ${companyUrls.length} potential startup URLs`, {
        accelerator: accelerator.name
      });
      
      // Limit to avoid very long processing times
      const limitedUrls = companyUrls.slice(0, CONFIG.STARTUPS_PER_ACCELERATOR);
      
      for (const url of limitedUrls) {
        try {
          const startup = {
            website: normalizeUrl(url),
            name: this.extractCompanyName(url),
            country: accelerator.country,
            accelerator: accelerator.website,
            value_proposition: ''
          };
          
          startups.push(startup);
          
        } catch (e) {
          Logger.warning('StartupScraper', 'Failed to process startup URL', {
            url: url,
            error: e.message
          });
        }
      }
      
    } catch (e) {
      Logger.error('StartupScraper', 'Error scraping accelerator', {
        accelerator: accelerator.name,
        error: e.message
      });
    }
    
    return startups;
  },
  
  /**
   * Try to find the portfolio/companies page
   * @param {string} baseUrl - Accelerator base URL
   * @returns {string|null} Portfolio page URL or null
   */
  findPortfolioPage: function(baseUrl) {
    // Try common portfolio page patterns
    for (const pattern of this.PORTFOLIO_PATTERNS) {
      const testUrl = normalizeUrl(baseUrl) + pattern;
      
      try {
        const response = fetchWebContent(testUrl, {retries: 0});
        if (response.success) {
          Logger.info('StartupScraper', 'Found portfolio page', {url: testUrl});
          return testUrl;
        }
      } catch (e) {
        // Continue to next pattern
      }
    }
    
    // Fallback to base URL
    Logger.info('StartupScraper', 'Using base URL as fallback', {url: baseUrl});
    return baseUrl;
  },
  
  /**
   * Extract company URLs from HTML content
   * @param {string} html - HTML content
   * @param {string} baseUrl - Base URL for context
   * @returns {Array<string>} Array of company URLs
   */
  extractCompanyUrls: function(html, baseUrl) {
    const urls = extractUrlsFromHtml(html);
    const companyUrls = [];
    const baseDomain = getDomain(baseUrl);
    
    for (const url of urls) {
      let fullUrl = url;
      
      // Convert relative URLs to absolute
      if (url.startsWith('/')) {
        fullUrl = normalizeUrl(baseUrl).replace(/\/$/, '') + url;
      } else if (!url.startsWith('http')) {
        continue;
      }
      
      // Skip URLs that are part of the accelerator's own domain
      if (getDomain(fullUrl) === baseDomain) {
        continue;
      }
      
      // Only keep likely company websites
      if (isLikelyCompanyWebsite(fullUrl) && isValidUrl(fullUrl)) {
        companyUrls.push(fullUrl);
      }
    }
    
    // Remove duplicates
    return [...new Set(companyUrls)];
  },
  
  /**
   * Extract company name from URL
   * @param {string} url - Company URL
   * @returns {string} Extracted company name
   */
  extractCompanyName: function(url) {
    const domain = getDomain(url);
    
    // Remove TLD
    const name = domain.replace(/\.(com|io|co|ai|net|org|app|tech|dev)$/i, '');
    
    // Capitalize first letter of each word
    return name.split(/[-.]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
};
