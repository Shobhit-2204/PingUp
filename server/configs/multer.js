import multer from "multer";

const storage = multer.diskStorage({
    // Keep files in OS temp directory (multer default)
    // This ensures automatic cleanup of temporary files
});

export const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file size
    },
    fileFilter: (req, file, cb) => {
        // Accept images and videos
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed'));
        }
    }
});