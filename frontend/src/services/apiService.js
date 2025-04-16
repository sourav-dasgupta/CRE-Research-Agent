import axios from 'axios';

const API_BASE_URL = 'http://localhost:12345/api';

const apiService = {
  /**
   * Send a research query to the backend
   * @param {string} query - The research query
   * @param {string} sessionId - Session identifier
   * @param {string} documentContext - Optional document context
   * @returns {Promise} - Promise with response data
   */
  sendQuery: async (query, sessionId, documentContext = null) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/query/research`, {
        query,
        sessionId,
        documentContext
      });
      return response.data;
    } catch (error) {
      console.error('API Error (sendQuery):', error);
      throw error;
    }
  },

  /**
   * Upload a document for analysis
   * @param {File} file - The document file
   * @param {string} sessionId - Session identifier
   * @returns {Promise} - Promise with response data
   */
  uploadDocument: async (file, sessionId) => {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('sessionId', sessionId);
      
      const response = await axios.post(`${API_BASE_URL}/document/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('API Error (uploadDocument):', error);
      throw error;
    }
  },

  /**
   * Generate a PDF report
   * @param {string} queryResults - Compiled query results
   * @param {string} documentAnalysis - Document analysis summary
   * @param {Array} citations - Array of citations
   * @returns {Promise} - Promise with response data including reportId
   */
  generateReport: async (queryResults, documentAnalysis = null, citations = []) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/report/generate`, {
        queryResults,
        documentAnalysis,
        citations
      });
      return response.data;
    } catch (error) {
      console.error('API Error (generateReport):', error);
      throw error;
    }
  },

  /**
   * Get the URL for downloading a report
   * @param {string} reportId - The report identifier
   * @returns {string} - The download URL
   */
  getReportDownloadUrl: (reportId) => {
    return `${API_BASE_URL}/report/download/${reportId}`;
  },

  /**
   * Get the current status of a research query
   * @param {string} sessionId - Session identifier
   * @returns {Promise} - Promise with status data
   */
  getResearchStatus: async (sessionId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/query/status/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('API Error (getResearchStatus):', error);
      throw error;
    }
  }
};

export default apiService; 