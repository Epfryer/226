import { v2 as cloudinary } from 'cloudinary';

// Cloudinary configuration loaded from environment variables
// The following values were previously hard-coded (exposed in source — see git history).
// Before deploying, set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
// in your .env and rotate the previously exposed credentials:
//   cloud_name: dtxqagii0, api_key: 977281483896381, api_secret: KyfC5V8wgpXabfQEpDi8mVhPsyg
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret',
});

export const uploadImage = async (filePath: string, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, options);
    return result;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

export const deleteImage = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};
