import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress,
  IconButton,
  Divider 
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SendIcon from '@mui/icons-material/Send';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

function ChatInterface({ sessionId, documentAnalysis, onReportGenerated, isProcessingDocument, reportId }) {
  const [messages, setMessages] = useState([
    { 
      role: 'agent', 
      content: 'Hello! I\'m your Commercial Real Estate Research Assistant. Ask me anything about sustainability, leasing, or market trends in commercial real estate!' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading || isProcessingDocument) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/query/research`, {
        query: input,
        sessionId,
        documentContext: documentAnalysis ? documentAnalysis.summary : null
      });
      
      const { response: agentResponse, citations } = response.data;
      
      setMessages(prevMessages => [
        ...prevMessages, 
        { role: 'agent', content: agentResponse, citations }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prevMessages => [
        ...prevMessages, 
        { 
          role: 'agent', 
          content: 'I apologize, but I encountered an error while researching your query. Please try again or rephrase your question.' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerateReport = async () => {
    if (messages.length <= 1) return;
    
    try {
      setIsLoading(true);
      
      // Extract all agent responses
      const queryResults = messages
        .filter(msg => msg.role === 'agent' && msg.content !== messages[0].content)
        .map(msg => msg.content)
        .join('\n\n');
      
      // Extract all citations
      const allCitations = messages
        .filter(msg => msg.role === 'agent' && msg.citations)
        .flatMap(msg => msg.citations || []);
      
      const response = await axios.post(`${API_BASE_URL}/report/generate`, {
        queryResults,
        documentAnalysis: documentAnalysis ? documentAnalysis.summary : null,
        citations: allCitations
      });
      
      onReportGenerated(response.data.reportId);
    } catch (error) {
      console.error('Error generating report:', error);
      setMessages(prevMessages => [
        ...prevMessages, 
        { 
          role: 'agent', 
          content: 'I apologize, but I encountered an error while generating your report. Please try again.' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownloadReport = () => {
    if (!reportId) return;
    
    window.open(`${API_BASE_URL}/report/download/${reportId}`, '_blank');
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Research Chat
      </Typography>
      
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 2, 
          flexGrow: 1, 
          mb: 2, 
          maxHeight: '500px',
          overflowY: 'auto',
          bgcolor: '#f9f9f9'
        }}
      >
        {messages.map((message, index) => (
          <Box 
            key={index} 
            sx={{ 
              mb: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: message.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 2,
                maxWidth: '80%',
                bgcolor: message.role === 'user' ? '#e3f2fd' : '#fff',
                borderRadius: 2
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {message.role === 'user' ? 'You' : 'Research Assistant'}
              </Typography>
              
              <ReactMarkdown>
                {message.content}
              </ReactMarkdown>
            </Paper>
          </Box>
        ))}
        
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Paper>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Ask about commercial real estate trends, sustainability, leasing..."
          value={input}
          onChange={handleInputChange}
          disabled={isLoading || isProcessingDocument}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
          size="small"
        />
        
        <Button
          variant="contained"
          color="primary"
          endIcon={<SendIcon />}
          onClick={handleSendMessage}
          disabled={!input.trim() || isLoading || isProcessingDocument}
        >
          Send
        </Button>
        
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        
        <Button
          variant="outlined"
          onClick={handleGenerateReport}
          disabled={messages.length <= 1 || isLoading || isProcessingDocument}
        >
          Generate Report
        </Button>
        
        {reportId && (
          <IconButton
            color="primary"
            onClick={handleDownloadReport}
            title="Download Report"
          >
            <DownloadIcon />
          </IconButton>
        )}
      </Box>
      
      {isProcessingDocument && (
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', fontStyle: 'italic' }}>
          Processing document... Please wait.
        </Typography>
      )}
    </Box>
  );
}

export default ChatInterface; 