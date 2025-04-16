const axios = require('axios');

/**
 * Service for accessing Federal Reserve Economic Data (FRED)
 * Note: FRED requires registration but is free to use
 * To use this service fully, register at https://fred.stlouisfed.org/docs/api/api_key.html
 */
class FREDService {
  /**
   * Search for economic data related to commercial real estate
   * @param {string} query - The search query
   * @returns {Array} - Results with citation information
   */
  static async searchEconomicData(query) {
    try {
      // Map of CRE-related economic indicators in FRED
      const creIndicators = {
        'office': 'OFFVACUSQ176N',  // US Office Vacancy Rate
        'retail': 'RETAILIRSA',     // Retail Sales Index
        'industrial': 'INDPRO',     // Industrial Production Index
        'construction': 'TTLCONS',  // Total Construction Spending
        'mortgage': 'MORTGAGE30US', // 30-Year Fixed Rate Mortgage Average
        'commercial mortgage': 'DRTSCIS',  // Delinquency Rate on Commercial Real Estate Loans
        'property price': 'BOGZ1FL075035503Q' // Commercial Real Estate Loans
      };
      
      // If we have an API key, use it, otherwise provide mockup data
      const apiKey = process.env.FRED_API_KEY;
      
      // Find relevant indicators based on query
      const relevantIndicators = [];
      for (const [keyword, seriesId] of Object.entries(creIndicators)) {
        if (query.toLowerCase().includes(keyword)) {
          relevantIndicators.push({ keyword, seriesId });
        }
      }
      
      // If no specific indicators match, use some general ones
      if (relevantIndicators.length === 0) {
        relevantIndicators.push(
          { keyword: 'office', seriesId: 'OFFVACUSQ176N' },
          { keyword: 'construction', seriesId: 'TTLCONS' }
        );
      }
      
      if (!apiKey) {
        // Return mockup data if no API key
        return [{
          title: 'Commercial Real Estate Economic Indicators',
          authors: 'Federal Reserve Economic Data (FRED)',
          date: new Date().toLocaleDateString(),
          source: 'FRED',
          link: 'https://fred.stlouisfed.org/',
          summary: `Economic indicators relevant to "${query}" in commercial real estate show varied trends. Without a FRED API key, we can't provide real-time data. Register for a free API key at https://fred.stlouisfed.org/docs/api/api_key.html to enable this functionality.`,
          type: 'economic_data'
        }];
      }
      
      // Prepare result array
      const results = [];
      
      // Fetch data for each relevant indicator
      for (const { keyword, seriesId } of relevantIndicators) {
        const url = 'https://api.stlouisfed.org/fred/series';
        
        // Get series information
        const seriesResponse = await axios.get(url, {
          params: {
            series_id: seriesId,
            api_key: apiKey,
            file_type: 'json'
          }
        });
        
        if (!seriesResponse.data || !seriesResponse.data.seriess || !seriesResponse.data.seriess[0]) {
          continue;
        }
        
        const series = seriesResponse.data.seriess[0];
        
        // Get the most recent observations
        const observationsUrl = 'https://api.stlouisfed.org/fred/series/observations';
        const observationsResponse = await axios.get(observationsUrl, {
          params: {
            series_id: seriesId,
            api_key: apiKey,
            file_type: 'json',
            sort_order: 'desc',
            limit: 12 // Last 12 observations
          }
        });
        
        if (!observationsResponse.data || !observationsResponse.data.observations) {
          continue;
        }
        
        const observations = observationsResponse.data.observations;
        
        // Calculate trend
        let trend = 'stable';
        if (observations.length > 1) {
          const latest = parseFloat(observations[0].value);
          const previous = parseFloat(observations[observations.length - 1].value);
          
          if (!isNaN(latest) && !isNaN(previous) && previous !== 0) {
            const percentChange = ((latest - previous) / previous) * 100;
            
            if (percentChange > 10) {
              trend = 'significantly increased';
            } else if (percentChange > 2) {
              trend = 'increased';
            } else if (percentChange < -10) {
              trend = 'significantly decreased';
            } else if (percentChange < -2) {
              trend = 'decreased';
            }
          }
        }
        
        // Create a summary with the latest value and trend
        const latestValue = observations[0].value;
        const latestDate = new Date(observations[0].date).toLocaleDateString();
        
        let summary = `${series.title} has ${trend} to ${latestValue} as of ${latestDate}. `;
        summary += `This indicator is relevant to commercial real estate ${keyword} trends and provides insight into current market conditions.`;
        
        results.push({
          title: series.title,
          authors: 'Federal Reserve Economic Data (FRED)',
          date: new Date().toLocaleDateString(),
          source: 'FRED',
          link: `https://fred.stlouisfed.org/series/${seriesId}`,
          summary,
          type: 'economic_data'
        });
      }
      
      return results;
    } catch (error) {
      console.error('FRED data search error:', error);
      return [];
    }
  }
}

module.exports = FREDService; 