import React, { useCallback, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  CircularProgress,
  Alert
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

function DocumentUpload({ sessionId, onProcessingStart, onProcessingComplete }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }
    
    // Check file type
    if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      setError('Only PDF and Word documents are supported');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    onProcessingStart();
    
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('sessionId', sessionId);
      
      const response = await axios.post(`${API_BASE_URL}/document/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      onProcessingComplete(response.data.analysis);
    } catch (error) {
      console.error('Error uploading document:', error);
      setError(error.response?.data?.error || 'Failed to upload document');
      onProcessingComplete(null);
    } finally {
      setIsUploading(false);
    }
  }, [sessionId, onProcessingStart, onProcessingComplete]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
    disabled: isUploading
  });
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Document Upload
      </Typography>
      
      <Paper
        {...getRootProps()}
        variant="outlined"
        sx={{
          p: 3,
          borderStyle: 'dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          bgcolor: isDragActive ? 'rgba(25, 118, 210, 0.04)' : 'background.paper',
          textAlign: 'center',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.01)'
          }
        }}
      >
        <input {...getInputProps()} />
        
        <UploadFileIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
        
        {isUploading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress size={24} sx={{ mb: 1 }} />
            <Typography variant="body2">Uploading document...</Typography>
          </Box>
        ) : (
          <Typography>
            {isDragActive
              ? 'Drop your document here...'
              : 'Drag & drop a document here, or click to select one'}
          </Typography>
        )}
        
        <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
          Supported formats: PDF, DOC, DOCX (Max 10MB)
        </Typography>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Button
          variant="contained"
          component="label"
          disabled={isUploading}
        >
          Browse Files
          <input
            type="file"
            hidden
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onDrop([e.target.files[0]]);
              }
            }}
          />
        </Button>
      </Box>
    </Box>
  );
}

export default DocumentUpload; 