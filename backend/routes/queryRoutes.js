const express = require('express');
const QueryController = require('../controllers/queryController');

const router = express.Router();

/**
 * @route POST /api/query/research
 * @desc Process a research query
 * @access Public
 */
router.post('/research', QueryController.handleResearchQuery);

/**
 * @route GET /api/query/status/:sessionId
 * @desc Get status of a research query
 * @access Public
 */
router.get('/status/:sessionId', QueryController.getResearchStatus);

module.exports = router; 