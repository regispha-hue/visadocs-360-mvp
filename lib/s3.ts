// Re-export storage functions as s3 for backward compatibility
export { 
  getFileUrl, 
  generatePresignedUploadUrl, 
  deleteFile, 
  uploadBuffer 
} from './storage';
