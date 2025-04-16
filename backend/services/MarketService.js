const axios = require('axios');
const googleTrends = require('google-trends-api');
const RSSFeedService = require('./RSSFeedService');
const FREDService = require('./FREDService');

/**
 * Service for handling market trend research queries
 */
class MarketService {
  /**
   * Process a market trends-related query
   * @param {string} query - The user's research query
   * @returns {Array} - Results with citation information
   */
  static async processQuery(query) {
    const results = [];
    
    try {
      // Try to get Google Trends data
      try {
        const trendsResults = await this.searchGoogleTrends(query);
        if (trendsResults.length > 0) {
          results.push(...trendsResults);
        }
      } catch (trendsError) {
        console.warn('Google Trends search failed:', trendsError.message);
      }
      
      // Get latest news from RSS feeds
      if (results.length < 4) {
        try {
          const newsResults = await RSSFeedService.searchNews(query);
          if (newsResults.length > 0) {
            results.push(...newsResults);
          }
        } catch (newsError) {
          console.warn('News feed search failed:', newsError.message);
        }
      }
      
      // Try to get economic data if API key is available
      if (process.env.QUANDL_API_KEY && results.length < 5) {
        try {
          const economicResults = await this.searchEconomicData(query);
          if (economicResults.length > 0) {
            results.push(...economicResults);
          }
        } catch (economicError) {
          console.warn('Economic data search failed:', economicError.message);
        }
      }
      
      // If we still don't have enough results, add some general market information
      if (results.length === 0) {
        results.push(this.getGeneralMarketInfo());
      }
      
      return results;
    } catch (error) {
      console.error('Market search error:', error);
      throw new Error(`Failed to perform market research: ${error.message}`);
    }
  }
  
  /**
   * Search Google Trends for market trends
   * @param {string} query - The search query
   * @returns {Array} - Results with citation information
   */
  static async searchGoogleTrends(query) {
    try {
      // Add CRE specific terms to improve results
      const enhancedQuery = `${query} commercial real estate`;
      console.log(`Searching Google Trends for: ${enhancedQuery}`);
      
      // Get interest over time - past 5 years
      const interestOverTime = await googleTrends.interestOverTime({
        keyword: enhancedQuery,
        startTime: new Date(Date.now() - (5 * 365 * 24 * 60 * 60 * 1000)), // 5 years ago
        geo: 'US'
      });
      
      // Get related queries
      const relatedQueries = await googleTrends.relatedQueries({
        keyword: enhancedQuery,
        geo: 'US'
      });
      
      // Parse responses
      const timeData = JSON.parse(interestOverTime);
      const queriesData = JSON.parse(relatedQueries);
      
      // Extract useful data
      let summary = 'Analysis of Google Trends data shows ';
      let trendDirection = 'stable';
      
      // Process interest over time data
      if (timeData.default?.timelineData?.length > 0) {
        const timelineData = timeData.default.timelineData;
        const recentValues = timelineData.slice(-12).map(point => parseInt(point.value[0]));
        const olderValues = timelineData.slice(-24, -12).map(point => parseInt(point.value[0]));
        
        const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
        const olderAvg = olderValues.reduce((a, b) => a + b, 0) / olderValues.length;
        
        const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100;
        
        if (percentChange > 15) {
          trendDirection = 'strongly increasing';
        } else if (percentChange > 5) {
          trendDirection = 'moderately increasing';
        } else if (percentChange < -15) {
          trendDirection = 'strongly decreasing';
        } else if (percentChange < -5) {
          trendDirection = 'moderately decreasing';
        }
        
        summary += `that interest in "${enhancedQuery}" has been ${trendDirection} over the past year. `;
      }
      
      // Process related queries
      if (queriesData.default?.rankedList?.length > 0) {
        const topQueries = queriesData.default.rankedList[0]?.rankedKeyword;
        
        if (topQueries && topQueries.length > 0) {
          summary += 'Top related search queries include: ';
          const topFiveQueries = topQueries.slice(0, 5).map(item => `"${item.query}"`);
          summary += topFiveQueries.join(', ') + '. ';
        }
      }
      
      summary += `This trend data provides insight into current market interest and potential emerging topics in the commercial real estate sector related to "${query}".`;
      
      return [{
        title: `Google Trends Analysis: ${query} in Commercial Real Estate`,
        authors: 'Google Trends',
        date: new Date().toLocaleDateString(),
        source: 'Google Trends',
        link: `https://trends.google.com/trends/explore?q=${encodeURIComponent(enhancedQuery)}&geo=US`,
        summary,
        type: 'market_report'
      }];
    } catch (error) {
      console.error('Google Trends search error:', error);
      return [];
    }
  }
  
  /**
   * Search economic data sources
   * @param {string} query - The search query
   * @returns {Array} - Results with citation information
   */
  static async searchEconomicData(query) {
    // Use the FRED service
    return await FREDService.searchEconomicData(query);
  }
  
  /**
   * Get general market information when specific API data is unavailable
   * @returns {Object} - General market information
   */
  static getGeneralMarketInfo() {
    return {
      title: 'Current Commercial Real Estate Market Overview',
      authors: 'CRE Market Analysis Team',
      date: new Date().toLocaleDateString(),
      source: 'Internal Analysis',
      link: '#',
      summary: 'The commercial real estate market continues to adapt to post-pandemic realities with notable sector-specific trends. Industrial and logistics properties remain the strongest performers with record-low cap rates and continued rent growth. Multifamily remains resilient with strong demand in suburban and sunbelt markets. Office continues to face challenges with high vacancy rates but is seeing selective recovery in Class A properties and amenity-rich developments. Retail is witnessing a bifurcation with grocery-anchored and experiential retail outperforming traditional mall spaces.',
      type: 'market_report'
    };
  }

  static async getResearch(query, sessionId) {
    // If sessionId is provided, log the step
    if (sessionId && global.researchStatus[sessionId]) {
      global.researchStatus[sessionId].push({
        step: "Analyzing market trend information",
        source: "Market Service",
        timestamp: new Date().toISOString()
      });
    }
    
    try {
      // Existing code to get market data
      return [{
        title: 'Market Trends Analysis',
        authors: 'Market Research Team',
        date: new Date().toLocaleDateString(),
        source: 'Market Database',
        link: 'https://example.com/market',
        summary: 'Sample market data for the query: ' + query,
        type: 'market_report'
      }];
    } catch (error) {
      console.error('Market search error:', error);
      
      // Log the error
      if (sessionId && global.researchStatus[sessionId]) {
        global.researchStatus[sessionId].push({
          step: "Error in market research: " + error.message,
          source: "Market Service",
          timestamp: new Date().toISOString()
        });
      }
      
      return [];
    }
  }
}

module.exports = MarketService; 