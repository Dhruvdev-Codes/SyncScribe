import { Router } from 'express';
import {
  getActivities,
  createActivity,
  getDevActivities,
  recordDevTask,
  getProjectStats,
  getProjectDetails,
  exportProjectData,
} from '../controllers/devController';

const router = Router();

router.get('/activities', getActivities);
router.post('/activities', createActivity);
router.get('/tasks', getDevActivities);
router.post('/tasks', recordDevTask);
router.get('/stats', getProjectStats);
router.get('/details', getProjectDetails);
router.get('/export', exportProjectData);

export default router;
