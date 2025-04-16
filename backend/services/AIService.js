const axios = require('axios');
const systemPrompt = require('../config/systemPrompt');

/**
 * Service for communicating with AI providers
 */
class AIService {
  /**
   * Process a research query using the AI agent
   * @param {string} query - The user's research query
   * @param {Array} researchResults - Results from various research services
   * @param {Object} documentAnalysis - Analysis of uploaded documents (optional)
   * @param {string} sessionId - Session identifier
   * @returns {Object} - AI response with processed research
   */
  static async processResearch(query, researchResults, documentAnalysis = null, sessionId) {
    try {
      console.log(`Processing research query with AI: ${query}`);
      
      if (sessionId && global.researchStatus[sessionId]) {
        global.researchStatus[sessionId].push({
          step: "Summarizing research findings",
          source: "AI Service",
          timestamp: new Date().toISOString()
        });
      }
      
      // Flatten research results (because they are nested arrays)
      const flattenedResults = researchResults.flat().filter(Boolean);
      
      // Log the found sources
      if (sessionId && global.researchStatus[sessionId]) {
        global.researchStatus[sessionId].push({
          step: `Found ${flattenedResults.length} relevant sources for research`,
          source: "Research Aggregator",
          timestamp: new Date().toISOString()
        });
      }
      
      // Prepare the AI message with flattened results
      const messages = this.prepareMessages(query, flattenedResults, documentAnalysis);
      
      // Get provider and API key from environment variables
      const provider = process.env.AI_PROVIDER || 'openai';
      const apiKey = this.getApiKey(provider);
      
      if (!apiKey) {
        throw new Error(`AI provider API key not configured for ${provider}`);
      }
      
      if (sessionId && global.researchStatus[sessionId]) {
        global.researchStatus[sessionId].push({
          step: `Querying AI model (${provider})`,
          source: provider === 'openai' ? 'OpenAI' : (provider === 'anthropic' ? 'Anthropic' : provider),
          timestamp: new Date().toISOString()
        });
      }
      
      // Call the appropriate AI provider
      let response;
      switch (provider.toLowerCase()) {
        case 'openai':
          response = await this.callOpenAI(messages, apiKey);
          break;
        case 'anthropic':
          response = await this.callAnthropic(messages, apiKey);
          break;
        case 'local':
          // For development/testing without an external API
          response = this.getLocalResponse(messages);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }
      
      if (sessionId && global.researchStatus[sessionId]) {
        global.researchStatus[sessionId].push({
          step: "AI analysis complete, generating final response",
          source: provider === 'openai' ? 'OpenAI' : (provider === 'anthropic' ? 'Anthropic' : provider),
          timestamp: new Date().toISOString()
        });
      }
      
      // Save conversation to session history
      // In a real implementation, you would store this in a database
      console.log(`AI response generated for session ${sessionId}`);
      
      return {
        response: response,
        citations: flattenedResults.map(result => ({
          title: result.title,
          authors: result.authors,
          source: result.source,
          link: result.link,
          date: result.date
        }))
      };
    } catch (error) {
      console.error('AI service error:', error);
      
      if (sessionId && global.researchStatus[sessionId]) {
        global.researchStatus[sessionId].push({
          step: "Error in AI processing: " + error.message,
          source: "AI Service",
          timestamp: new Date().toISOString()
        });
      }
      
      throw new Error(`Failed to process research with AI: ${error.message}`);
    }
  }
  
  /**
   * Prepare messages for the AI provider
   * @param {string} query - The user's query
   * @param {Array} researchResults - Results from various services
   * @param {Object} documentAnalysis - Document analysis (optional)
   * @returns {Array} - Messages formatted for the AI provider
   */
  static prepareMessages(query, researchResults, documentAnalysis) {
    // Format research results for the AI
    const formattedResearch = researchResults.map((result, index) => {
      return `
Source [${index + 1}]: ${result.title}
Authors: ${result.authors}
Date: ${result.date}
Source Type: ${result.source}
URL: ${result.link}
Summary: ${result.summary}
------------------
`;
    }).join('\n');
    
    // Format document analysis if available
    let documentContext = '';
    if (documentAnalysis) {
      documentContext = `
## Document Analysis
Summary: ${documentAnalysis.summary}
Topics: ${documentAnalysis.topics ? documentAnalysis.topics.join(', ') : 'None identified'}
Word Count: ${documentAnalysis.wordCount || 'N/A'}
------------------
`;
    }
    
    // Construct the user message with all the context
    const userMessage = `
# Research Query
${query}

# Research Results
${formattedResearch}

${documentContext}

Based on the above research, please provide a comprehensive response to the query. 
Format your response with the following structure:
1. Start with a clear summary of the findings (1-2 paragraphs)
2. Use headings (## Heading) to organize different aspects of the answer
3. Use bullet points or numbered lists for key points under each heading
4. Include relevant statistics and figures where available
5. End with a brief conclusion or recommendation section

IMPORTANT: Cite your sources throughout the response using source numbers, e.g., [1], [2], etc. 
At the end of your response, include a "## Sources" section that lists all cited sources.

Your response should be well-structured with clear headings and bullet points where relevant.
`;
    
    // Return messages in the format expected by AI providers
    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];
  }
  
  /**
   * Get the API key for the specified provider
   * @param {string} provider - The AI provider name
   * @returns {string} - The API key
   */
  static getApiKey(provider) {
    switch (provider.toLowerCase()) {
      case 'openai':
        return process.env.OPENAI_API_KEY;
      case 'anthropic':
        return process.env.ANTHROPIC_API_KEY;
      case 'local':
        return 'mock-key'; // No real key needed for local development
      default:
        return null;
    }
  }
  
  /**
   * Call the OpenAI API
   * @param {Array} messages - The messages to send to the API
   * @param {string} apiKey - The OpenAI API key
   * @returns {string} - The AI response
   */
  static async callOpenAI(messages, apiKey) {
    const endpoint = 'https://api.openai.com/v1/chat/completions';
    
    const response = await axios.post(endpoint, {
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages,
      temperature: 0.3,
      max_tokens: 2500
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    return response.data.choices[0].message.content;
  }
  
  /**
   * Call the Anthropic API
   * @param {Array} messages - The messages to send to the API
   * @param {string} apiKey - The Anthropic API key
   * @returns {string} - The AI response
   */
  static async callAnthropic(messages, apiKey) {
    const endpoint = 'https://api.anthropic.com/v1/messages';
    
    // Convert to Anthropic's format
    const anthropicMessages = messages.map(msg => {
      return {
        role: msg.role === 'system' ? 'assistant' : msg.role,
        content: msg.content
      };
    });
    
    const response = await axios.post(endpoint, {
      model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
      messages: anthropicMessages,
      temperature: 0.3,
      max_tokens: 2500
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    });
    
    return response.data.content[0].text;
  }
  
  /**
   * Generate a local mock response (for development without API keys)
   * @param {Array} messages - The messages to process
   * @returns {string} - The mock AI response
   */
  static getLocalResponse(messages) {
    // Extract the query from the messages
    const userMessage = messages.find(msg => msg.role === 'user');
    const query = userMessage.content.split('# Research Query')[1].split('#')[0].trim();
    
    return `
# Research on ${query}

Based on the research results provided, here are the key findings:

## Market Overview
- The commercial real estate market for ${query} shows a mixed picture with some segments performing better than others.
- Recent trends indicate changes in demand patterns, particularly in urban vs. suburban locations.

## Key Insights
1. Sustainability considerations are increasingly important in commercial real estate decisions.
2. Technology integration continues to be a differentiating factor for premium properties.
3. Economic indicators suggest cautious optimism for the sector overall.

## Recommendations
- Investors should consider diversifying across property types to mitigate risk.
- Long-term strategies should account for changing work patterns and consumer preferences.
- Sustainability features are likely to command premium pricing in the coming years.

## Sources
The information above is based on data from multiple sources including market reports, economic data, and industry analyses cited in the research results.
`;
  }
}

module.exports = AIService; 