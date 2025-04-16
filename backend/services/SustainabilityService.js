const axios = require('axios');
const xml2js = require('xml2js');

class SustainabilityService {
  /**
   * Process a sustainability-related query
   * @param {string} query - The user's research query
   * @param {string} sessionId - The session ID for tracking research steps
   * @returns {Array} - Results with citation information
   */
  static async getResearch(query, sessionId) {
    // If sessionId is provided, log the step
    if (sessionId && global.researchStatus[sessionId]) {
      global.researchStatus[sessionId].push({
        step: "Searching academic papers on sustainability",
        source: "arXiv",
        timestamp: new Date().toISOString()
      });
    }
    
    try {
      // First try arXiv API for academic papers
      const arXivResults = await this.searchArXiv(query);
      let results = [];
      
      if (arXivResults.length > 0) {
        results.push(...arXivResults);
        
        // Log the found papers
        if (sessionId && global.researchStatus[sessionId]) {
          global.researchStatus[sessionId].push({
            step: `Found ${arXivResults.length} relevant academic papers on sustainability`,
            source: "arXiv",
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // If we have less than 3 results, try LEED/Energy Star APIs
      if (results.length < 3) {
        try {
          // Log the LEED search
          if (sessionId && global.researchStatus[sessionId]) {
            global.researchStatus[sessionId].push({
              step: "Searching LEED certification databases",
              source: "USGBC LEED Database",
              timestamp: new Date().toISOString()
            });
          }
          
          const leedResults = await this.searchLEED(query);
          if (leedResults.length > 0) {
            results.push(...leedResults);
            
            // Log the found LEED data
            if (sessionId && global.researchStatus[sessionId]) {
              global.researchStatus[sessionId].push({
                step: "Retrieved LEED certification data",
                source: "USGBC LEED Database",
                timestamp: new Date().toISOString()
              });
            }
          }
        } catch (leedError) {
          console.warn('LEED API search failed:', leedError.message);
          
          // Log the error
          if (sessionId && global.researchStatus[sessionId]) {
            global.researchStatus[sessionId].push({
              step: "LEED data search failed: " + leedError.message,
              source: "USGBC LEED Database",
              timestamp: new Date().toISOString()
            });
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error('Sustainability search error:', error);
      
      // Log the error
      if (sessionId && global.researchStatus[sessionId]) {
        global.researchStatus[sessionId].push({
          step: "Error in sustainability research: " + error.message,
          source: "Sustainability Service",
          timestamp: new Date().toISOString()
        });
      }
      
      return [];
    }
  }
  
  /**
   * Search arXiv for papers related to the query
   * @param {string} query - The search query
   * @returns {Array} - Results with citation information
   */
  static async searchArXiv(query) {
    try {
      // Prepare the arXiv API URL with relevant categories for sustainability in CRE
      const searchTerms = encodeURIComponent(`${query} AND (sustainability OR "green building" OR "energy efficiency")`);
      // Using categories relevant to CRE sustainability
      const categoryFilters = encodeURIComponent('cat:physics.geo-ph OR cat:econ.GN OR cat:q-fin.GN');
      const maxResults = 5;
      const url = `http://export.arxiv.org/api/query?search_query=${searchTerms}+AND+(${categoryFilters})&max_results=${maxResults}&sortBy=relevance`;
      
      console.log(`Calling arXiv API with URL: ${url}`);
      const response = await axios.get(url);
      
      // Parse the XML response using xml2js
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(response.data);
      
      // Check if we have entries
      if (!result.feed.entry) {
        console.log('No results found in arXiv');
        return [];
      }
      
      // Convert to array if only one result
      const entries = Array.isArray(result.feed.entry) ? result.feed.entry : [result.feed.entry];
      
      // Process each entry
      return entries.map(entry => {
        // Get the first author or set as unknown
        const firstAuthor = entry.author ? 
          (Array.isArray(entry.author) ? entry.author[0].name : entry.author.name) : 
          'Unknown Author';
        
        // Get all authors if there are multiple
        const authorsArray = Array.isArray(entry.author) ? 
          entry.author.map(author => author.name) : 
          [firstAuthor];
          
        const authors = authorsArray.join(', ');
        
        // Get the link to the PDF or abstract
        const link = Array.isArray(entry.link) ? 
          entry.link.find(link => link.$.title === 'pdf')?.$.href || entry.id : 
          entry.id;
          
        return {
          title: entry.title.trim(),
          authors,
          date: new Date(entry.published).toLocaleDateString(),
          source: 'arXiv',
          link,
          summary: entry.summary ? entry.summary.trim() : 'No summary available',
          type: 'academic_paper'
        };
      });
    } catch (error) {
      console.error('arXiv search error:', error);
      return [];
    }
  }
  
  /**
   * Search LEED database for sustainability certifications
   * @param {string} query - The search query
   * @returns {Array} - Results with citation information
   */
  static async searchLEED(query) {
    // This is a placeholder for LEED API integration
    // In a real implementation, you would call an actual API
    return [{
      title: 'LEED Certification Data (Placeholder)',
      authors: 'U.S. Green Building Council',
      date: new Date().toLocaleDateString(),
      source: 'LEED Database',
      link: 'https://www.usgbc.org/projects',
      summary: 'This is a placeholder for LEED certification data. In a production implementation, this would contain actual data from the LEED API.',
      type: 'certification_data'
    }];
  }
}

module.exports = SustainabilityService; 