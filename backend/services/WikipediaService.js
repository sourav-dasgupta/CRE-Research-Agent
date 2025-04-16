const axios = require('axios');

/**
 * Service for retrieving contextual information from Wikipedia
 */
class WikipediaService {
  /**
   * Search Wikipedia for information related to the query
   * @param {string} query - The search query
   * @returns {Array} - Results with citation information
   */
  static async searchWikipedia(query) {
    try {
      // Enhance the query with CRE context
      const enhancedQuery = `${query} commercial real estate`;
      console.log(`Searching Wikipedia for: ${enhancedQuery}`);
      
      // First search for relevant Wikipedia pages
      const searchUrl = 'https://en.wikipedia.org/w/api.php';
      const searchParams = {
        action: 'query',
        list: 'search',
        srsearch: enhancedQuery,
        format: 'json',
        srlimit: 3,
        origin: '*'
      };
      
      const searchResponse = await axios.get(searchUrl, { params: searchParams });
      const searchResults = searchResponse.data.query.search;
      
      if (!searchResults || searchResults.length === 0) {
        console.log('No Wikipedia results found');
        return [];
      }
      
      // Get the full content for the top result
      const pageId = searchResults[0].pageid;
      const contentUrl = 'https://en.wikipedia.org/w/api.php';
      const contentParams = {
        action: 'query',
        prop: 'extracts|info',
        exintro: true,
        explaintext: true,
        inprop: 'url',
        pageids: pageId,
        format: 'json',
        origin: '*'
      };
      
      const contentResponse = await axios.get(contentUrl, { params: contentParams });
      const page = contentResponse.data.query.pages[pageId];
      
      if (!page || !page.extract) {
        console.log('Failed to get Wikipedia content');
        return [];
      }
      
      // Clean up the extract
      let summary = page.extract;
      if (summary.length > 1000) {
        summary = summary.substring(0, 997) + '...';
      }
      
      return [{
        title: page.title,
        authors: 'Wikipedia Contributors',
        date: new Date().toLocaleDateString(),
        source: 'Wikipedia',
        link: page.fullurl,
        summary,
        type: 'knowledge_base'
      }];
    } catch (error) {
      console.error('Wikipedia search error:', error);
      return [];
    }
  }
}

module.exports = WikipediaService; 