
const express = require("express");

const {
    getProducts,
    getProductByIdController,
    createProductController,
    updateProductController,
    deleteProductController
} = require("../controllers/productController");

const upload = require("../middleware/upload");

const router = express.Router();

// Convert Multer upload errors into readable JSON responses.
function handleUpload(uploadMiddleware) {
    return function (req, res, next) {
        uploadMiddleware(req, res, function (error) {
            if (error) {
                return res.status(400).json({
                    message: error.message
                });
            }

            next();
        });
    };
}

router.get("/", getProducts);

router.get("/:id", getProductByIdController);

// New product: accept multiple images under the "images" field.
router.post(
    "/",
    handleUpload(upload.array("images", 5)),
    createProductController
);

// Edit product: preserve compatibility with the existing "image" field.
router.put(
    "/:id",
    handleUpload(upload.single("image")),
    updateProductController
);

router.delete("/:id", deleteProductController);

module.exports = router;
