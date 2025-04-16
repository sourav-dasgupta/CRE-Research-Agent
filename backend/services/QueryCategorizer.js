class QueryCategorizer {
  // Keywords for category identification
  static sustainabilityKeywords = [
    'sustainability', 'sustainable', 'green', 'eco', 'environmental', 'energy', 
    'efficiency', 'leed', 'certification', 'carbon', 'footprint', 'renewable', 
    'solar', 'climate', 'emissions', 'energy star'
  ];
  
  static leasingKeywords = [
    'lease', 'leasing', 'rent', 'rental', 'tenant', 'landlord', 'occupancy', 
    'vacancy', 'square foot', 'sq ft', 'commercial space', 'office space', 
    'retail space', 'industrial space', 'warehouse', 'contract', 'agreement'
  ];
  
  static marketTrendsKeywords = [
    'market', 'trend', 'analysis', 'forecast', 'outlook', 'prediction', 
    'projection', 'growth', 'decline', 'demand', 'supply', 'investment', 
    'cap rate', 'yield', 'return', 'value', 'price', 'pricing', 'economic'
  ];
  
  /**
   * Categorize a query into one of the main research categories
   * @param {string} query - The user's research query
   * @returns {string} - The identified category
   */
  static async categorize(query) {
    const queryLower = query.toLowerCase();
    
    // Check for sustainability keywords
    const hasSustainabilityTerms = this.sustainabilityKeywords.some(keyword => 
      queryLower.includes(keyword)
    );
    
    // Check for leasing keywords
    const hasLeasingTerms = this.leasingKeywords.some(keyword => 
      queryLower.includes(keyword)
    );
    
    // Check for market trends keywords
    const hasMarketTerms = this.marketTrendsKeywords.some(keyword => 
      queryLower.includes(keyword)
    );
    
    // Count keyword matches for each category
    const sustainabilityScore = this.countKeywordMatches(queryLower, this.sustainabilityKeywords);
    const leasingScore = this.countKeywordMatches(queryLower, this.leasingKeywords);
    const marketScore = this.countKeywordMatches(queryLower, this.marketTrendsKeywords);
    
    // Determine the category with the highest score
    if (sustainabilityScore > leasingScore && sustainabilityScore > marketScore) {
      return 'sustainability';
    } else if (leasingScore > sustainabilityScore && leasingScore > marketScore) {
      return 'leasing';
    } else if (marketScore > sustainabilityScore && marketScore > leasingScore) {
      return 'market_trends';
    } else {
      // Default to general if no clear category or tie
      return 'general';
    }
  }
  
  /**
   * Count the number of keyword matches in a query
   * @param {string} query - The lowercase query
   * @param {Array<string>} keywords - Array of keywords to check
   * @returns {number} - The count of keyword matches
   */
  static countKeywordMatches(query, keywords) {
    return keywords.reduce((count, keyword) => {
      return count + (query.includes(keyword) ? 1 : 0);
    }, 0);
  }
}

module.exports = QueryCategorizer; 