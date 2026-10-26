
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

const storage = new CloudinaryStorage({
    cloudinary,

    params: async (req, file) => {
        const extension = file.mimetype === "image/png"
            ? "png"
            : file.mimetype === "image/webp"
                ? "webp"
                : "jpg";

        const folder = file.fieldname === "images"
            ? "aquacart/reviews-and-products"
            : "aquacart/products";

        return {
            folder,
            resource_type: "image",
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
            format: extension,
            public_id: `image-${Date.now()}-${Math.round(Math.random() * 1e9)}`
        };
    }
});

const upload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5
    },

    fileFilter: function (req, file, cb) {
        if (allowedMimeTypes.includes(file.mimetype)) {
            return cb(null, true);
        }

        return cb(
            new Error("Only PNG, JPG, JPEG, and WEBP images are allowed.")
        );
    }
});

module.exports = upload;