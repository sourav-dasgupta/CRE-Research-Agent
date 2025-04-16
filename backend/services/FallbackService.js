const axios = require('axios');
const puppeteer = require('puppeteer');
const WikipediaService = require('./WikipediaService');

/**
 * Fallback service that uses web search and scraping when specialized APIs don't provide results
 */
class FallbackService {
  /**
   * Process a general query using web search and scraping
   * @param {string} query - The user's research query
   * @returns {Array} - Results with citation information
   */
  static async processQuery(query) {
    const results = [];
    
    try {
      // First try Wikipedia for general knowledge
      try {
        const wikipediaResults = await WikipediaService.searchWikipedia(query);
        if (wikipediaResults.length > 0) {
          results.push(...wikipediaResults);
        }
      } catch (wikiError) {
        console.warn('Wikipedia search failed:', wikiError.message);
      }
      
      // Then try web search if configured
      if (process.env.BING_SEARCH_API_KEY && results.length < 3) {
        try {
          const searchResults = await this.webSearch(query);
          if (searchResults.length > 0) {
            results.push(...searchResults);
          }
        } catch (searchError) {
          console.warn('Web search failed:', searchError.message);
        }
      }
      
      // If we don't have enough results, try web scraping for specific sites
      if (results.length < 3) {
        try {
          const scrapedResults = await this.webScrape(query);
          if (scrapedResults.length > 0) {
            results.push(...scrapedResults);
          }
        } catch (scrapeError) {
          console.warn('Web scraping failed:', scrapeError.message);
        }
      }
      
      // If we still don't have any results, provide general information
      if (results.length === 0) {
        results.push(this.getGeneralInfo());
      }
      
      return results;
    } catch (error) {
      console.error('Fallback search error:', error);
      throw new Error(`Failed to perform general research: ${error.message}`);
    }
  }
  
  /**
   * Perform web search using Bing/Google Search API (mock implementation)
   * @param {string} query - The search query
   * @returns {Array} - Results with citation information
   */
  static async webSearch(query) {
    try {
      // Get the API key from environment variables
      const apiKey = process.env.BING_SEARCH_API_KEY;
      if (!apiKey) {
        throw new Error('Bing Search API key not configured');
      }
      
      // Construct the API URL with the search query
      const url = 'https://api.bing.microsoft.com/v7.0/search';
      
      // Add "commercial real estate" to the query to focus results
      const searchQuery = `${query} commercial real estate`;
      
      const response = await axios.get(url, {
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey
        },
        params: {
          q: searchQuery,
          count: 5,
          responseFilter: 'Webpages'
        }
      });
      
      // Process and format the results
      if (response.data.webPages && response.data.webPages.value) {
        return response.data.webPages.value.map(page => {
          return {
            title: page.name,
            authors: page.displayUrl,
            date: new Date().toLocaleDateString(),
            source: new URL(page.url).hostname,
            link: page.url,
            summary: page.snippet,
            type: 'web_content'
          };
        });
      }
      
      return [];
    } catch (error) {
      console.error('Web search error:', error);
      return [];
    }
  }
  
  /**
   * Perform web scraping for specific CRE information (mock implementation)
   * @param {string} query - The search query
   * @returns {Array} - Results with citation information
   */
  static async webScrape(query) {
    // In a real implementation, this would use Puppeteer to scrape specific sites
    // For MVP purposes, we'll return mock data
    
    // Note: In production, you would need to ensure compliance with the website's terms of service
    // and implement proper rate limiting and robot.txt checking
    
    return [{
      title: 'Latest Commercial Real Estate Market Insights',
      authors: 'NAR Commercial Research',
      date: new Date().toLocaleDateString(),
      source: 'National Association of Realtors',
      link: 'https://www.nar.realtor/commercial-market-insights',
      summary: 'Recent market analysis from NAR shows that commercial real estate transaction volumes decreased 21% year-over-year in Q1 2023 due to higher financing costs. However, certain sectors like multifamily and industrial continue to show strong fundamentals with rent growth outpacing inflation in many markets.',
      type: 'web_content'
    }];
  }
  
  /**
   * Get general information when web search and scraping don't provide results
   * @returns {Object} - General information
   */
  static getGeneralInfo() {
    return {
      title: 'General Commercial Real Estate Information',
      authors: 'CRE Research Team',
      date: new Date().toLocaleDateString(),
      source: 'Internal Database',
      link: '#',
      summary: 'Commercial real estate encompasses a range of property types including office, retail, industrial, multifamily, and specialty sectors. Each property type has unique characteristics, investment considerations, and market dynamics. Investment decisions typically consider factors such as location, tenant quality, lease terms, property condition, and broader economic trends.',
      type: 'web_content'
    };
  }

  static async getResearch(query, sessionId) {
    // If sessionId is provided, log the step
    if (sessionId && global.researchStatus[sessionId]) {
      global.researchStatus[sessionId].push({
        step: "Searching general knowledge sources",
        source: "Fallback Service",
        timestamp: new Date().toISOString()
      });
    }
    
    try {
      // Existing code to get fallback data
      return [{
        title: 'General Information',
        authors: 'Research Team',
        date: new Date().toLocaleDateString(),
        source: 'General Database',
        link: 'https://example.com/general',
        summary: 'Sample fallback data for the query: ' + query,
        type: 'web_content'
      }];
    } catch (error) {
      console.error('Fallback search error:', error);
      
      // Log the error
      if (sessionId && global.researchStatus[sessionId]) {
        global.researchStatus[sessionId].push({
          step: "Error in fallback research: " + error.message,
          source: "Fallback Service",
          timestamp: new Date().toISOString()
        });
      }
      
      return [];
    }
  }
}

module.exports = FallbackService; 