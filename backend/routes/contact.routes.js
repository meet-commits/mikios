import express from 'express';
import * as contactController from '../controllers/contact.controller.js';

const router = express.Router();

// POST /api/contact/sales - Send contact sales inquiry
router.post('/sales', contactController.sendContactEmail);

// POST /api/contact/demo - Request instant demo video link
router.post('/demo', contactController.requestDemoLink);

export default router;
