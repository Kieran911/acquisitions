import {
  deleteUser,
  fetchAllusers,
  getUserById,
  updateUser,
} from '#controllers/users.controller.js';
import { authenticateToken, requireRole } from '#middleware/auth.middleware.js';
import express from 'express';

const router = express.Router();

router.get('/', authenticateToken, fetchAllusers);
router.get('/:id', authenticateToken, getUserById);
router.put('/:id', authenticateToken, updateUser);
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteUser);

export default router;
