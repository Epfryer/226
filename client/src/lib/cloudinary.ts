import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: 'dtxqagii0',
    api_key: '977281483896381',
    api_secret: 'KyfC5V8wgpXabfQEpDi8mVhPsyg'
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
