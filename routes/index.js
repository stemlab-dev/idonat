import express from 'express';
import { getUserDashboard } from '../controllers/index.js';
import { requireAuth, verifyPermission } from '../middleware/requireAuth.js';

const router = express.Router();

router.get('/dashboard', requireAuth, getUserDashboard);
// router.get('/admin/dashboard', getUserDashboard);

export default router;
