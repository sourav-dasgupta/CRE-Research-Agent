const pdfExtract = require('pdf.js-extract').PDFExtract;
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');
const DocumentAnalyzer = require('../services/DocumentAnalyzer');

const pdfExtractor = new pdfExtract();

exports.processDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document uploaded' });
    }
    
    const filePath = req.file.path;
    const fileExtension = path.extname(filePath).toLowerCase();
    let extractedText = '';
    
    // Extract text based on file type
    if (fileExtension === '.pdf') {
      const data = await pdfExtractor.extract(filePath);
      extractedText = data.pages.map(page => page.content.map(item => item.str).join(' ')).join('\n');
    } else if (['.docx', '.doc'].includes(fileExtension)) {
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value;
    } else {
      return res.status(400).json({ error: 'Unsupported file format' });
    }
    
    // Analyze the extracted text
    const analysis = await DocumentAnalyzer.analyze(extractedText);
    
    // Clean up the uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
    
    res.status(200).json({
      message: 'Document processed successfully',
      analysis
    });
    
  } catch (error) {
    console.error('Error processing document:', error);
    res.status(500).json({ 
      error: 'An error occurred while processing your document',
      details: error.message 
    });
  }
}; 