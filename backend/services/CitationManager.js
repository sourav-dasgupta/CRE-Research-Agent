class CitationManager {
  /**
   * Process research results and format with proper citations
   * @param {Array} results - Array of research results
   * @returns {Object} - Formatted response with citations
   */
  static async processResults(results) {
    if (!results || results.length === 0) {
      return {
        response: "I couldn't find any relevant information for your query. Would you like to try a different search term or approach?",
        citations: []
      };
    }
    
    // Format the response text
    let responseText = "Based on my research, I found the following information:\n\n";
    
    // Generate formatted citations
    const citations = [];
    
    results.forEach((result, index) => {
      // Add content from the result to the response
      responseText += `${index + 1}. **${result.title}**\n`;
      
      if (result.summary) {
        responseText += `${result.summary}\n\n`;
      }
      
      // Create citation reference
      const citationNumber = index + 1;
      responseText += `[${citationNumber}]\n\n`;
      
      // Format the citation for the references section
      const citation = this.formatCitation(result, citationNumber);
      citations.push(citation);
    });
    
    // Add references section
    responseText += "\n**References:**\n";
    citations.forEach(citation => {
      responseText += `${citation}\n`;
    });
    
    return {
      response: responseText,
      citations: citations
    };
  }
  
  /**
   * Format a citation based on the result type
   * @param {Object} result - A research result
   * @param {number} index - Citation number
   * @returns {string} - Formatted citation
   */
  static formatCitation(result, index) {
    const { title, authors, date, source, link, type } = result;
    
    let citation = `[${index}] `;
    
    switch (type) {
      case 'academic_paper':
        citation += `${authors} (${date}). "${title}". ${source}. Available at: ${link}`;
        break;
      case 'market_report':
        citation += `${source} (${date}). "${title}". Available at: ${link}`;
        break;
      case 'web_content':
        citation += `${source} (${date}). "${title}". Retrieved on ${new Date().toLocaleDateString()} from ${link}`;
        break;
      case 'certification_data':
        citation += `${source} (${date}). "${title}". Available at: ${link}`;
        break;
      default:
        citation += `${authors ? authors + '.' : ''} "${title}". ${source}. ${date}. ${link}`;
    }
    
    return citation;
  }
}

module.exports = CitationManager; 