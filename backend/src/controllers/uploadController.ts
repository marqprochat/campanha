import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Helper to determine upload directory
const getUploadDir = () => {
    return process.env.NODE_ENV === 'production' ? '/app/uploads' : './uploads';
};

// Ensure directory exists
const ensureUploadDir = () => {
    const dir = getUploadDir();
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
};

// Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = ensureUploadDir();
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'bg-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File Filter (Images only)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, GIF allowed.'));
    }
};

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit
    },
    fileFilter: fileFilter
});

export const uploadImage = (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const url = `/api/uploads/${req.file.filename}`;

        res.json({
            message: 'File uploaded successfully',
            url: url
        });
    } catch (error) {
        console.error('Error in file upload:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
};
