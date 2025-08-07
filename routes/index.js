import express from 'express';
import { getUserDashboard, getAdminDashboard } from '../controllers/index.js';
import { requireAuth, verifyPermission } from '../middleware/requireAuth.js';

const router = express.Router();

router.get('/dashboard', requireAuth, getUserDashboard);
router.get('/admin/dashboard', getAdminDashboard);

export default router;
