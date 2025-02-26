import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    CLOUDINARY_CLOUD_NAME=dtxqagii0
    CLOUDINARY_API_KEY=977281483896381
    CLOUDINARY_API_SECRET=KyfC5V8wgpXabfQEpDi8mVhPsyg
    CLOUDINARY_URL=cloudinary://<you483896381>:<KyfC5V8wgpXabfQEpDi8mVhPsyg>@dtxqagii0
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
