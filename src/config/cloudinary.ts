import { v2 as cloudinary } from 'cloudinary';

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Faltan variables de entorno de Cloudinary');
}

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

export const uploadImage = async (filePath: string, folder: string = 'multimedia') => {
    return await cloudinary.uploader.upload(filePath, { folder });
};

export const deleteImage = async (publicId: string) => {
    return await cloudinary.uploader.destroy(publicId);
};
