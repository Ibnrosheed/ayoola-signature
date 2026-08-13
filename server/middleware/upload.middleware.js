import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const createDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

createDir('uploads/products');
createDir('uploads/categories');
createDir('uploads/reviews');

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/products';
    if (req.baseUrl.includes('categories') || file.fieldname === 'categoryImage') {
      uploadPath = 'uploads/categories';
    } else if (req.baseUrl.includes('reviews') || file.fieldname === 'images') {
      uploadPath = 'uploads/reviews';
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File Filter for Image Validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, WEBP, GIF) are allowed!'));
  }
};

// Multer Upload Middleware Instance
export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max size
  fileFilter: fileFilter,
});
