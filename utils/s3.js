const AWS = require('aws-sdk');
const crypto = require('crypto');
const path = require('path');

// Configure S3 client for DigitalOcean Spaces
const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT,
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION || 'us-east-1', // Default region for DigitalOcean Spaces
  s3ForcePathStyle: true, // Needed for DigitalOcean Spaces compatibility
});

/**
 * Generic S3 utility for uploading files
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} fileName - Original file name
 * @param {string} mimeType - MIME type of the file
 * @param {string} folder - Folder path in the bucket (e.g., 'images/stories')
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
async function uploadFile(fileBuffer, fileName, mimeType, folder = '') {
  try {
    // Generate unique filename to avoid conflicts
    const fileExtension = path.extname(fileName);
    const uniqueName = crypto.randomUUID() + fileExtension;
    
    // Build the key (path) for the file
    const key = folder ? `${folder}/${uniqueName}` : uniqueName;
    
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: 'public-read', // Make files publicly accessible
    };

    const result = await s3.upload(params).promise();
    
    return {
      success: true,
      url: result.Location,
      key: key,
      filename: uniqueName
    };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete a file from S3
 * @param {string} key - The S3 key (path) of the file to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function deleteFile(key) {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(params).promise();
    
    return { success: true };
  } catch (error) {
    console.error('S3 Delete Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Upload image specifically (with additional validation)
 * @param {Buffer} fileBuffer - Image buffer
 * @param {string} fileName - Original filename
 * @param {string} mimeType - MIME type
 * @param {string} folder - Folder in bucket
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
async function uploadImage(fileBuffer, fileName, mimeType, folder = 'images') {
  // Validate it's an image
  const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!validImageTypes.includes(mimeType)) {
    return {
      success: false,
      error: 'Invalid image type. Only JPEG, PNG, GIF, and WebP are allowed.'
    };
  }

  // Check file size (limit to 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (fileBuffer.length > maxSize) {
    return {
      success: false,
      error: 'Image too large. Maximum size is 10MB.'
    };
  }

  return uploadFile(fileBuffer, fileName, mimeType, folder);
}

/**
 * Get a signed URL for temporary access to a private file
 * @param {string} key - S3 key of the file
 * @param {number} expires - Expiration time in seconds (default: 1 hour)
 * @returns {string} Signed URL
 */
function getSignedUrl(key, expires = 3600) {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Expires: expires
  };

  return s3.getSignedUrl('getObject', params);
}

module.exports = {
  uploadFile,
  deleteFile,
  uploadImage,
  getSignedUrl,
  s3 // Export configured S3 instance for advanced use cases
}; 