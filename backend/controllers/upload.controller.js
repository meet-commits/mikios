import cloudinary from '../config/cloudinary.js';
import path from 'path';
import fs from 'fs';

// @desc    Upload single image to Cloudinary or Local Storage
// @route   POST /api/upload/image
// @access  Private
export const uploadImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // File is either uploaded to Cloudinary or stored on disk
        const imageUrl = req.file.path.startsWith('http')
            ? req.file.path
            : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                url: imageUrl,
                publicId: req.file.filename
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete image from Cloudinary or Local Storage
// @route   DELETE /api/upload/image/:publicId
// @access  Private
export const deleteImage = async (req, res, next) => {
    try {
        const { publicId } = req.params;

        let result;
        // If it starts with the folder name 'mikios', delete from Cloudinary
        if (publicId.startsWith('mikios/')) {
            result = await cloudinary.uploader.destroy(publicId);
        } else {
            // Delete from local disk
            const filePath = path.join('uploads', publicId);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            result = { result: 'ok' };
        }

        if (result.result === 'ok') {
            res.status(200).json({
                success: true,
                message: 'Image deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }
    } catch (error) {
        next(error);
    }
};
