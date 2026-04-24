import { Router } from 'express';
import {
  handleListBugs,
  handleGetBugById,
  handleCreateBug,
  handleUpdateBug,
  handleDeleteBug,
} from './bug.controller';

const router = Router();

router.get('/',     handleListBugs);
router.post('/',    handleCreateBug);
router.get('/:id',  handleGetBugById);
router.put('/:id',  handleUpdateBug);
router.delete('/:id', handleDeleteBug);

export default router;
