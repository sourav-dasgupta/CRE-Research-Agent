import React, { useState, useEffect } from 'react';
import './App.css';
import apiService from './services/apiService';
import ReactMarkdown from 'react-markdown';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId] = useState(`session-${Date.now()}`);
  const [researchSteps, setResearchSteps] = useState([]);
  const [pollingId, setPollingId] = useState(null);

  // Polling function to get research status updates
  const pollResearchStatus = async () => {
    try {
      console.log("Polling for research status...", sessionId);
      const status = await apiService.getResearchStatus(sessionId);
      console.log("Received status:", status);
      
      if (status && status.steps) {
        setResearchSteps(status.steps);
      }
      
      // If research is complete, stop polling
      if (status && status.complete) {
        console.log("Research complete, stopping polling");
        clearInterval(pollingId);
        setPollingId(null);
      }
    } catch (err) {
      console.error('Error polling research status:', err);
    }
  };

  // Start polling when research begins
  useEffect(() => {
    if (loading && !pollingId) {
      // Poll every 2 seconds
      const id = setInterval(pollResearchStatus, 2000);
      setPollingId(id);
    }
    
    // Cleanup interval when component unmounts or research completes
    return () => {
      if (pollingId) {
        clearInterval(pollingId);
      }
    };
  }, [loading, pollingId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    // Reset research steps to show only the initial step
    setResearchSteps([{ 
      step: "Starting research process", 
      timestamp: new Date().toISOString() 
    }]);
    
    // Start polling immediately
    const id = setInterval(pollResearchStatus, 2000);
    setPollingId(id);
    
    try {
      console.log("Sending query to API:", query, sessionId);
      const response = await apiService.sendQuery(query, sessionId);
      console.log("Received API response:", response);
      setResults(response);
      // Add final research step
      setResearchSteps(prevSteps => [...prevSteps, { 
        step: "Research complete", 
        timestamp: new Date().toISOString() 
      }]);
    } catch (err) {
      console.error('Error submitting query:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(`Failed to get research results: ${err.response?.data?.message || err.message}. Please try again.`);
    } finally {
      setLoading(false);
      // Stop polling when done
      if (pollingId) {
        clearInterval(pollingId);
        setPollingId(null);
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>CRE Research Agent</h1>
        <p>Your AI-powered commercial real estate research agent</p>
      </header>
      
      <main>
        <form onSubmit={handleSubmit} className="query-form">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about commercial real estate trends, markets, properties..."
            className="query-input"
          />
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Researching...' : 'Research'}
          </button>
        </form>
        
        {error && <div className="error-message">{error}</div>}
        
        {/* Research Steps Section */}
        {researchSteps.length > 0 && (
          <div className="research-steps">
            <h3>Research Process</h3>
            <div className="steps-container">
              {researchSteps.map((step, index) => (
                <div key={index} className="research-step">
                  <div className="step-timestamp">
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="step-content">
                    {step.step}
                    {step.source && <div className="step-source">Source: {step.source}</div>}
                  </div>
                </div>
              ))}
              {loading && <div className="step-loading">Researching...</div>}
            </div>
          </div>
        )}
        
        {results && !loading && (
          <div className="results">
            <h2>Research Results</h2>
            <div className="result-content markdown-content">
              <ReactMarkdown>
                {results.response}
              </ReactMarkdown>
            </div>
            
            {/* Only show the citations section if it's not already included in the response */}
            {results.citations && results.citations.length > 0 && 
             !results.response.toLowerCase().includes('## sources') && 
             !results.response.toLowerCase().includes('## references') && (
              <div className="citations">
                <h3>Sources</h3>
                <ol>
                  {results.citations.map((citation, index) => (
                    <li key={index}>
                      <strong>{citation.title}</strong>
                      {citation.authors && <span> - {citation.authors}</span>}
                      {citation.date && <span> ({citation.date})</span>}
                      {citation.source && <span> from {citation.source}</span>}
                      {citation.link && citation.link !== '#' && (
                        <span> - <a href={citation.link} target="_blank" rel="noopener noreferrer">
                          View Source
                        </a></span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App; 