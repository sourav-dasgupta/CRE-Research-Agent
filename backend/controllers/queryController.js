const SustainabilityService = require('../services/SustainabilityService');
const LeasingService = require('../services/LeasingService');
const MarketService = require('../services/MarketService');
const FallbackService = require('../services/FallbackService');
const AIService = require('../services/AIService');

/**
 * Controller for handling research queries
 */
class QueryController {
  /**
   * Handle a research query request
   * @param {Object} req - The HTTP request object
   * @param {Object} res - The HTTP response object
   */
  static async handleResearchQuery(req, res) {
    try {
      const { query, sessionId, documentContext } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: 'Query is required' });
      }
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }
      
      console.log(`Processing research query: ${query} (Session: ${sessionId})`);
      
      // Initialize or clear the research steps for this session
      global.researchStatus[sessionId] = [];
      global.researchComplete[sessionId] = false;
      
      // Log the first step
      global.researchStatus[sessionId].push({
        step: "Starting research query categorization",
        timestamp: new Date().toISOString()
      });
      
      // Categorize the query
      const category = QueryController.categorizeQuery(query);
      
      // Log category determination
      global.researchStatus[sessionId].push({
        step: `Query categorized as: ${category}`,
        timestamp: new Date().toISOString()
      });
      
      // Initialize results array
      const researchResults = [];
      
      // Call appropriate services based on category
      if (category === 'sustainability' || category === 'general') {
        global.researchStatus[sessionId].push({
          step: "Gathering sustainability research data",
          source: "Sustainability databases",
          timestamp: new Date().toISOString()
        });
        
        const sustainabilityData = await SustainabilityService.getResearch(query, sessionId);
        researchResults.push(sustainabilityData);
      }
      
      if (category === 'leasing' || category === 'general') {
        global.researchStatus[sessionId].push({
          step: "Analyzing leasing market information",
          source: "Leasing databases",
          timestamp: new Date().toISOString()
        });
        
        const leasingData = await LeasingService.getResearch(query, sessionId);
        researchResults.push(leasingData);
      }
      
      if (category === 'market' || category === 'general') {
        global.researchStatus[sessionId].push({
          step: "Retrieving market trend data",
          source: "Market analytics providers",
          timestamp: new Date().toISOString()
        });
        
        const marketData = await MarketService.getResearch(query, sessionId);
        researchResults.push(marketData);
      }
      
      // Always get fallback data for completeness
      global.researchStatus[sessionId].push({
        step: "Searching general knowledge sources",
        source: "Wikipedia and general databases",
        timestamp: new Date().toISOString()
      });
      
      const fallbackData = await FallbackService.getResearch(query, sessionId);
      researchResults.push(fallbackData);
      
      // Process document context if provided
      if (documentContext) {
        global.researchStatus[sessionId].push({
          step: "Analyzing uploaded document context",
          timestamp: new Date().toISOString()
        });
        
        // Add document analysis to results
        researchResults.push({ 
          source: 'Document Analysis',
          data: documentContext 
        });
      }
      
      // Process with AI
      global.researchStatus[sessionId].push({
        step: "Processing research with AI analysis",
        source: "OpenAI",
        timestamp: new Date().toISOString()
      });
      
      const aiResponse = await AIService.processResearch(query, researchResults, documentContext, sessionId);
      
      // Mark as complete
      global.researchComplete[sessionId] = true;
      
      // Return the AI-processed research
      res.json(aiResponse);
    } catch (error) {
      console.error('Error processing query:', error);
      res.status(500).json({ message: 'Error processing query', error: error.message });
    }
  }
  
  /**
   * Categorize the query type
   * @param {string} query - The user's query
   * @returns {string} - The query category
   */
  static categorizeQuery(query) {
    const queryLower = query.toLowerCase();
    
    // Sustainability-related keywords
    const sustainabilityKeywords = [
      'sustainability', 'sustainable', 'green', 'energy efficiency', 
      'renewable', 'leed', 'carbon', 'net zero', 'esg', 'environmental'
    ];
    
    // Leasing-related keywords
    const leasingKeywords = [
      'lease', 'leasing', 'tenant', 'landlord', 'rent', 'rental', 
      'occupancy', 'vacancy', 'square footage', 'office space'
    ];
    
    // Market trends-related keywords
    const marketKeywords = [
      'market', 'trend', 'forecast', 'growth', 'investment', 'cap rate',
      'yield', 'return', 'appreciation', 'property value', 'price'
    ];
    
    // Count matches for each category
    let sustainabilityMatches = 0;
    let leasingMatches = 0;
    let marketMatches = 0;
    
    // Check for keyword matches
    sustainabilityKeywords.forEach(keyword => {
      if (queryLower.includes(keyword)) sustainabilityMatches++;
    });
    
    leasingKeywords.forEach(keyword => {
      if (queryLower.includes(keyword)) leasingMatches++;
    });
    
    marketKeywords.forEach(keyword => {
      if (queryLower.includes(keyword)) marketMatches++;
    });
    
    // Determine the best category
    if (sustainabilityMatches > leasingMatches && sustainabilityMatches > marketMatches) {
      return 'sustainability';
    } else if (leasingMatches > sustainabilityMatches && leasingMatches > marketMatches) {
      return 'leasing';
    } else if (marketMatches > 0) {
      return 'market';
    } else {
      return 'general';
    }
  }

  /**
   * Get the status of a research query
   * @param {Object} req - The HTTP request object
   * @param {Object} res - The HTTP response object
   */
  static async getResearchStatus(req, res) {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return res.status(400).json({ message: 'Session ID is required' });
      }
      
      // Get the cached research steps for this session
      const researchSteps = global.researchStatus[sessionId] || [];
      const complete = global.researchComplete[sessionId] || false;
      
      res.json({ 
        sessionId, 
        steps: researchSteps,
        complete
      });
    } catch (error) {
      console.error('Error getting research status:', error);
      res.status(500).json({ message: 'Error retrieving research status' });
    }
  }
}

module.exports = QueryController; 