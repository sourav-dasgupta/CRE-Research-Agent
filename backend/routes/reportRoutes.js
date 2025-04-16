const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Route for generating and downloading PDF reports
router.post('/generate', reportController.generateReport);
router.get('/download/:id', reportController.downloadReport);

module.exports = router; 