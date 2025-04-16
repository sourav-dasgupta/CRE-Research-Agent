const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Map to store generated reports temporarily
const reportStore = new Map();

exports.generateReport = async (req, res) => {
  try {
    const { queryResults, documentAnalysis, citations } = req.body;
    
    if (!queryResults && !documentAnalysis) {
      return res.status(400).json({ error: 'No content provided for report generation' });
    }
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    
    // Add a page to the document
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 50;
    let currentY = height - margin;
    const lineHeight = 15;
    
    // Add title
    page.drawText('Commercial Real Estate Research Report', {
      x: margin,
      y: currentY,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    currentY -= lineHeight * 2;
    
    // Add date
    const currentDate = new Date().toLocaleDateString();
    page.drawText(`Generated on: ${currentDate}`, {
      x: margin,
      y: currentY,
      size: 12,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
    currentY -= lineHeight * 2;
    
    // Add query results section if available
    if (queryResults) {
      page.drawText('Research Results:', {
        x: margin,
        y: currentY,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      currentY -= lineHeight;
      
      // Add the query results text
      // In a real implementation, this would need to handle text wrapping and pagination
      page.drawText(queryResults, {
        x: margin,
        y: currentY,
        size: 12,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
        maxWidth: width - margin * 2,
      });
      currentY -= lineHeight * 10; // Adjust based on content length
    }
    
    // Add document analysis section if available
    if (documentAnalysis) {
      page.drawText('Document Analysis:', {
        x: margin,
        y: currentY,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      currentY -= lineHeight;
      
      // Add the document analysis text
      page.drawText(documentAnalysis, {
        x: margin,
        y: currentY,
        size: 12,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
        maxWidth: width - margin * 2,
      });
      currentY -= lineHeight * 10; // Adjust based on content length
    }
    
    // Add citations section if available
    if (citations && citations.length > 0) {
      page.drawText('Citations:', {
        x: margin,
        y: currentY,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      currentY -= lineHeight;
      
      // Add each citation
      for (const citation of citations) {
        page.drawText(`• ${citation}`, {
          x: margin,
          y: currentY,
          size: 10,
          font: timesRomanFont,
          color: rgb(0, 0, 0),
          maxWidth: width - margin * 2,
        });
        currentY -= lineHeight;
      }
    }
    
    // Serialize the PDF document to bytes
    const pdfBytes = await pdfDoc.save();
    
    // Generate a unique report ID
    const reportId = crypto.randomUUID();
    
    // Store the PDF bytes temporarily
    reportStore.set(reportId, pdfBytes);
    
    // Set a timeout to clean up the PDF after 30 minutes
    setTimeout(() => {
      reportStore.delete(reportId);
    }, 30 * 60 * 1000);
    
    res.status(200).json({
      message: 'Report generated successfully',
      reportId
    });
    
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ 
      error: 'An error occurred while generating the report',
      details: error.message 
    });
  }
};

exports.downloadReport = (req, res) => {
  try {
    const { id } = req.params;
    
    if (!reportStore.has(id)) {
      return res.status(404).json({ error: 'Report not found or expired' });
    }
    
    const pdfBytes = reportStore.get(id);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="cre-research-report.pdf"`);
    res.setHeader('Content-Length', pdfBytes.length);
    
    // Send the PDF file
    res.send(Buffer.from(pdfBytes));
    
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ 
      error: 'An error occurred while downloading the report',
      details: error.message 
    });
  }
}; 