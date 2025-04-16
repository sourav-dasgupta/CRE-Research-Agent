const axios = require('axios');
const xml2js = require('xml2js');

/**
 * Service for retrieving news from RSS feeds
 */
class RSSFeedService {
  // List of CRE news RSS feeds
  static feedSources = [
    {
      name: 'Commercial Property Executive',
      url: 'https://www.commercialsearch.com/news/feed/',
      source: 'CPE'
    },
    {
      name: 'GlobeSt',
      url: 'https://www.globest.com/feed/',
      source: 'GlobeSt'
    },
    {
      name: 'NAIOP',
      url: 'https://www.naiop.org/feed',
      source: 'NAIOP'
    }
  ];
  
  /**
   * Search for news relevant to the query
   * @param {string} query - The search query
   * @returns {Array} - Results with citation information
   */
  static async searchNews(query) {
    const results = [];
    const queryTerms = query.toLowerCase().split(' ');
    
    // Function to score article relevance
    const scoreRelevance = (title, description) => {
      let score = 0;
      const text = (title + ' ' + description).toLowerCase();
      
      // Score based on query term matches
      queryTerms.forEach(term => {
        if (text.includes(term)) {
          score += 1;
        }
      });
      
      // Bonus score for commercial real estate mentions
      if (text.includes('commercial real estate') || text.includes('cre')) {
        score += 2;
      }
      
      return score;
    };
    
    try {
      console.log(`Searching CRE news feeds for: ${query}`);
      
      // Process each feed source
      for (const feed of this.feedSources) {
        try {
          const response = await axios.get(feed.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; CRE Research Agent Bot/1.0)'
            },
            timeout: 5000 // 5 second timeout
          });
          
          // Parse XML
          const parser = new xml2js.Parser({ explicitArray: false });
          const result = await parser.parseStringPromise(response.data);
          
          let items = [];
          if (result.rss && result.rss.channel) {
            items = Array.isArray(result.rss.channel.item) ? 
              result.rss.channel.item : 
              (result.rss.channel.item ? [result.rss.channel.item] : []);
          } else if (result.feed && result.feed.entry) {
            items = Array.isArray(result.feed.entry) ? 
              result.feed.entry : 
              (result.feed.entry ? [result.feed.entry] : []);
          }
          
          // Score and filter items
          const scoredItems = items.map(item => {
            const title = item.title || '';
            const description = item.description || item.summary || '';
            const score = scoreRelevance(title, description);
            
            return { item, score };
          }).filter(({ score }) => score > 0);
          
          // Sort by relevance
          scoredItems.sort((a, b) => b.score - a.score);
          
          // Take top 2 items
          const topItems = scoredItems.slice(0, 2);
          
          // Format and add to results
          topItems.forEach(({ item }) => {
            const pubDate = item.pubDate || item.published || new Date().toISOString();
            const link = item.link?.$?.href || item.link || '#';
            const authors = item.author?.name || item.creator || feed.name;
            
            results.push({
              title: item.title,
              authors: typeof authors === 'string' ? authors : 'News Staff',
              date: new Date(pubDate).toLocaleDateString(),
              source: feed.source,
              link: typeof link === 'string' ? link : '#',
              summary: item.description || item.summary || 'No description available',
              type: 'news_article'
            });
          });
        } catch (feedError) {
          console.warn(`Error fetching ${feed.name} feed:`, feedError.message);
        }
      }
      
      return results;
    } catch (error) {
      console.error('RSS feed search error:', error);
      return [];
    }
  }
}

module.exports = RSSFeedService; 