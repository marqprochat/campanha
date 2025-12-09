import { Router } from 'express';
import { upload, uploadImage } from '../controllers/uploadController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Generic image upload
router.post('/image', authMiddleware, upload.single('file'), uploadImage);

export default router;
