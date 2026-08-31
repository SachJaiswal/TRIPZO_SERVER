// import multer from 'multer';
// import { Request } from 'express';

// // Store files in memory buffer to facilitate uploading directly to cloud providers
// const storage = multer.memoryStorage();

// const fileFilter = (
//   _req: Request,
//   file: Express.Multer.File,
//   callback: multer.FileFilterCallback
// ) => {
//   // Allow PDF uploads for this POC
//   const allowedMimeTypes = ['application/pdf'];

//   if (allowedMimeTypes.includes(file.mimetype)) {
//     callback(null, true);
//   } else {
//     callback(new Error('Invalid file type. Only PDF files are allowed.'));
//   }
// };

// export const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB limit
//   },
// });
import multer from "multer";
import { Request } from "express";

// Store files in memory.
// The storage provider (Local/AWS/Azure/GCP) will decide where to save them.
const storage = multer.memoryStorage();

const allowedMimeTypes = [
  // PDF
  "application/pdf",

  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new Error(
        "Invalid file type. Only PDF, JPG, JPEG, PNG, WEBP, GIF and SVG files are allowed."
      )
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});