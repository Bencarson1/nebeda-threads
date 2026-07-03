import multer from "multer";

const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const storage = multer.memoryStorage();

const imageFileFilter = (_req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    cb(new Error("Only jpeg, jpg, png, and webp image files are allowed"));
    return;
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6,
  },
});

const uploadProductImages = upload.array("images", 6);
const uploadCustomOrderImages = upload.array("inspirationImages", 3);
const uploadReviewImages = upload.array("images", 3);

const handleUploadErrors = (err, _req, res, next) => {
  if (!err) {
    next();
    return;
  }

  if (
    err instanceof multer.MulterError ||
    /image files are allowed|jpeg|jpg|png|webp/i.test(err.message || "")
  ) {
    res.status(400);
    next(new Error(err.message));
    return;
  }

  next(err);
};

export {
  handleUploadErrors,
  uploadCustomOrderImages,
  uploadProductImages,
  uploadReviewImages,
};
