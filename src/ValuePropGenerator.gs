/**
 * Value Proposition Generator Module
 * Generates value propositions for startups using LLM
 */

const ValuePropGenerator = {
  /**
   * Generate value propositions for startups that don't have them
   * @param {number} batchSize - Number of startups to process
   * @returns {Object} Results summary
   */
  generateValuePropositions: function(batchSize = CONFIG.VALUE_PROP_BATCH_SIZE) {
    Logger.info('ValuePropGenerator', `Starting value proposition generation (batch: ${batchSize})`);
    
    const results = {
      processed: 0,
      success: 0,
      failed: 0,
      skipped: 0
    };
    
    try {
      // Validate configuration
      validateConfig();
      
      // Get startups without value propositions
      const startups = SheetManager.getStartupsWithoutValueProp();
      Logger.info('ValuePropGenerator', `Found ${startups.length} startups without value propositions`);
      
      if (startups.length === 0) {
        Logger.info('ValuePropGenerator', 'No startups need value propositions');
        return results;
      }
      
      // Process batch
      const batch = startups.slice(0, batchSize);
      
      for (const startup of batch) {
        results.processed++;
        
        try {
          Logger.info('ValuePropGenerator', `Processing startup ${results.processed}/${batch.length}`, {
            website: startup.website
          });
          
          // Generate value proposition
          const valueProp = this.generateForStartup(startup);
          
          if (valueProp) {
            // Update in sheet
            if (SheetManager.updateValueProposition(startup.website, valueProp)) {
              results.success++;
              Logger.info('ValuePropGenerator', 'Successfully generated value proposition', {
                website: startup.website,
                valueProp: truncate(valueProp, 80)
              });
            } else {
              results.failed++;
            }
          } else {
            results.skipped++;
            Logger.warning('ValuePropGenerator', 'Could not generate value proposition', {
              website: startup.website
            });
          }
          
          // Delay between API calls to respect rate limits
          Utilities.sleep(CONFIG.API_DELAY_MS);
          
        } catch (e) {
          results.failed++;
          Logger.error('ValuePropGenerator', 'Error processing startup', {
            website: startup.website,
            error: e.message
          });
        }
      }
      
      Logger.info('ValuePropGenerator', 'Value proposition generation completed', results);
      return results;
      
    } catch (e) {
      Logger.error('ValuePropGenerator', 'Fatal error in value proposition generation', {
        error: e.message
      });
      throw e;
    }
  },
  
  /**
   * Generate value proposition for a single startup
   * @param {Object} startup - Startup object
   * @returns {string|null} Value proposition or null
   */
  generateForStartup: function(startup) {
    try {
      // Fetch startup website content
      const response = fetchWebContent(startup.website);
      
      if (!response.success) {
        Logger.warning('ValuePropGenerator', 'Failed to fetch startup website', {
          website: startup.website,
          error: response.error
        });
        return 'Website unavailable - manual review needed';
      }
      
      // Extract relevant text
      const text = extractTextFromHtml(response.content, 3000);
      
      if (!text || text.length < 50) {
        Logger.warning('ValuePropGenerator', 'Insufficient content from website', {
          website: startup.website
        });
        return 'Insufficient content - manual review needed';
      }
      
      // Generate value proposition using LLM
      const valueProp = this.callLLMForValueProp(startup, text);
      
      return valueProp;
      
    } catch (e) {
      Logger.error('ValuePropGenerator', 'Error generating value prop for startup', {
        website: startup.website,
        error: e.message
      });
      return null;
    }
  },
  
  /**
   * Call OpenAI API to generate value proposition
   * @param {Object} startup - Startup object
   * @param {string} websiteText - Extracted website text
   * @returns {string|null} Generated value proposition
   */
  callLLMForValueProp: function(startup, websiteText) {
    try {
      const apiKey = getOpenAIKey();
      
      // Prepare prompt
      const prompt = this.buildPrompt(startup, websiteText);
      
      // Call OpenAI API
      const url = 'https://api.openai.com/v1/chat/completions';
      const payload = {
        model: CONFIG.LLM_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a business analyst expert at creating concise value propositions. Follow the exact format requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: CONFIG.LLM_MAX_TOKENS,
        temperature: CONFIG.LLM_TEMPERATURE
      };
      
      const options = {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'Authorization': 'Bearer ' + apiKey
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
      
      const response = UrlFetchApp.fetch(url, options);
      const statusCode = response.getResponseCode();
      
      if (statusCode !== 200) {
        Logger.error('ValuePropGenerator', 'OpenAI API error', {
          statusCode: statusCode,
          response: response.getContentText()
        });
        return null;
      }
      
      const result = JSON.parse(response.getContentText());
      
      if (result.choices && result.choices.length > 0) {
        const valueProp = result.choices[0].message.content.trim();
        
        // Validate format
        if (this.validateValuePropFormat(valueProp)) {
          return valueProp;
        } else {
          Logger.warning('ValuePropGenerator', 'Invalid format from LLM', {
            valueProp: valueProp
          });
          // Try to extract or fix
          return this.fixValuePropFormat(valueProp);
        }
      }
      
      return null;
      
    } catch (e) {
      Logger.error('ValuePropGenerator', 'LLM API call failed', {
        error: e.message,
        startup: startup.website
      });
      return null;
    }
  },
  
  /**
   * Build prompt for LLM
   * @param {Object} startup - Startup object
   * @param {string} websiteText - Extracted text
   * @returns {string} Prompt
   */
  buildPrompt: function(startup, websiteText) {
    return `Analyze the following website content and generate a concise value proposition in this EXACT format:

"Startup [Company Name] helps [Target Audience] do [Main Activity] so that [Key Benefit]"

Website URL: ${startup.website}
Company Name: ${startup.name || 'Unknown'}

Website content:
${websiteText}

RULES:
1. Use the EXACT format specified above
2. Keep it under 120 characters total
3. Focus on the core value proposition
4. Be specific about the target audience and benefit
5. Use active voice
6. Do NOT add quotes around the output
7. Output ONLY the value proposition, nothing else

Value Proposition:`;
  },
  
  /**
   * Validate value proposition format
   * @param {string} valueProp - Value proposition to validate
   * @returns {boolean} True if valid format
   */
  validateValuePropFormat: function(valueProp) {
    if (!valueProp) return false;
    
    // Check for key components
    const hasStartup = valueProp.toLowerCase().includes('startup');
    const hasHelps = valueProp.toLowerCase().includes('helps');
    const hasSoThat = valueProp.toLowerCase().includes('so that');
    
    return hasStartup && hasHelps && hasSoThat;
  },
  
  /**
   * Try to fix value proposition format
   * @param {string} valueProp - Value proposition to fix
   * @returns {string} Fixed value proposition
   */
  fixValuePropFormat: function(valueProp) {
    // Remove quotes if present
    let fixed = valueProp.replace(/^["']|["']$/g, '');
    
    // If it doesn't start with "Startup", try to add it
    if (!fixed.toLowerCase().startsWith('startup')) {
      // This is a best-effort fix
      return fixed;
    }
    
    return fixed;
  }
};
