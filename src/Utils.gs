/**
 * Utility Functions Module
 * Reusable helper functions for URL handling, HTTP requests, and general utilities
 */

/**
 * Normalize a URL for consistent comparison and storage
 * @param {string} url - The URL to normalize
 * @returns {string} Normalized URL
 */
function normalizeUrl(url) {
  if (!url) return '';
  
  try {
    // Add protocol if missing
    if (!url.match(/^https?:\/\//i)) {
      url = 'https://' + url;
    }
    
    // Parse URL
    let normalized = url.toLowerCase().trim();
    
    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');
    
    // Remove www. for consistency
    normalized = normalized.replace(/^(https?:\/\/)www\./, '$1');
    
    return normalized;
  } catch (e) {
    Logger.warning('Utils', 'Failed to normalize URL', {url: url, error: e.message});
    return url.toLowerCase().trim();
  }
}

/**
 * Validate if a string is a valid URL
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid URL
 */
function isValidUrl(url) {
  if (!url) return false;
  
  const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  return urlPattern.test(url);
}

/**
 * Extract domain from URL
 * @param {string} url - The URL to extract domain from
 * @returns {string} Domain name
 */
function getDomain(url) {
  try {
    const normalized = normalizeUrl(url);
    const match = normalized.match(/^https?:\/\/([^\/]+)/);
    return match ? match[1] : '';
  } catch (e) {
    return '';
  }
}

/**
 * Fetch web content with retry logic and error handling
 * @param {string} url - URL to fetch
 * @param {Object} options - Optional fetch options
 * @returns {Object} Response object with {success, content, error}
 */
function fetchWebContent(url, options = {}) {
  const maxRetries = options.retries || 2;
  const timeout = options.timeout || CONFIG.REQUEST_TIMEOUT;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const fetchOptions = {
        'muteHttpExceptions': true,
        'headers': {
          'User-Agent': 'Mozilla/5.0 (compatible; ScoutingBot/1.0)'
        }
      };
      
      if (timeout) {
        // Apps Script doesn't support timeout directly, but we can catch errors
      }
      
      const response = UrlFetchApp.fetch(url, fetchOptions);
      const statusCode = response.getResponseCode();
      
      if (statusCode >= 200 && statusCode < 300) {
        return {
          success: true,
          content: response.getContentText(),
          statusCode: statusCode
        };
      } else if (statusCode >= 400 && statusCode < 500) {
        // Client error - don't retry
        return {
          success: false,
          error: `HTTP ${statusCode}`,
          statusCode: statusCode
        };
      } else {
        // Server error - might retry
        if (attempt < maxRetries) {
          Utilities.sleep(1000 * (attempt + 1)); // Exponential backoff
          continue;
        }
        return {
          success: false,
          error: `HTTP ${statusCode}`,
          statusCode: statusCode
        };
      }
    } catch (e) {
      if (attempt < maxRetries) {
        Utilities.sleep(1000 * (attempt + 1));
        continue;
      }
      return {
        success: false,
        error: e.message || 'Network error'
      };
    }
  }
  
  return {
    success: false,
    error: 'Max retries exceeded'
  };
}

/**
 * Extract clean text from HTML
 * @param {string} html - HTML content
 * @param {number} maxLength - Maximum length of extracted text
 * @returns {string} Clean text
 */
function extractTextFromHtml(html, maxLength = 5000) {
  try {
    // Remove script and style tags
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ')
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'");
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    // Truncate if needed
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + '...';
    }
    
    return text;
  } catch (e) {
    Logger.warning('Utils', 'Failed to extract text from HTML', {error: e.message});
    return '';
  }
}

/**
 * Extract URLs from HTML content matching a pattern
 * @param {string} html - HTML content
 * @param {RegExp} pattern - Optional pattern to filter URLs
 * @returns {Array<string>} Array of URLs
 */
function extractUrlsFromHtml(html, pattern = null) {
  try {
    const urlRegex = /href=["']([^"']+)["']/gi;
    const urls = [];
    let match;
    
    while ((match = urlRegex.exec(html)) !== null) {
      const url = match[1];
      
      // Skip anchors, javascript, mailto, etc.
      if (url.startsWith('#') || 
          url.startsWith('javascript:') || 
          url.startsWith('mailto:') ||
          url.startsWith('tel:')) {
        continue;
      }
      
      // Apply pattern filter if provided
      if (pattern && !pattern.test(url)) {
        continue;
      }
      
      urls.push(url);
    }
    
    return [...new Set(urls)]; // Remove duplicates
  } catch (e) {
    Logger.warning('Utils', 'Failed to extract URLs from HTML', {error: e.message});
    return [];
  }
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  Utilities.sleep(ms);
}

/**
 * Truncate string to maximum length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
function truncate(str, maxLength = 100) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Check if URL is likely a company website (not social media, etc.)
 * @param {string} url - URL to check
 * @returns {boolean} True if likely a company website
 */
function isLikelyCompanyWebsite(url) {
  const socialDomains = [
    'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com',
    'youtube.com', 'tiktok.com', 'github.com', 'medium.com',
    'crunchbase.com', 'angellist.com'
  ];
  
  const domain = getDomain(url);
  return !socialDomains.some(social => domain.includes(social));
}
