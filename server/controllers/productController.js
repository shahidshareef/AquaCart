
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require("../services/productService");

async function getProducts(req, res) {
    try {
        const products = await getAllProducts();

        return res.status(200).json({
            message: "Products fetched successfully",
            data: products
        });
    } catch (error) {
        console.error("[AquaCart] Failed to fetch products:", error);

        return res.status(500).json({
            message: "Failed to fetch products"
        });
    }
}

async function createProductController(req, res) {
    try {
        const { name, description, category, brand, status } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Product name is required"
            });
        }

        if (!description || !description.trim()) {
            return res.status(400).json({
                message: "Product description is required"
            });
        }

        if (!category) {
            return res.status(400).json({
                message: "Product category is required"
            });
        }

        // Cloudinary's secure HTTPS URLs are provided by Multer as file.path.
        const images = (req.files || []).map((file) => file.path);

        const product = await createProduct({
            name,
            description,
            category,
            brand,
            images,
            status
        });

        return res.status(201).json({
            message: "Product created successfully",
            data: product
        });
    } catch (error) {
        console.error("[AquaCart] Failed to create product:", error);

        return res.status(500).json({
            message: "Failed to create product"
        });
    }
}

async function updateProductController(req, res) {
    try {
        const productData = {
            name: req.body.name,
            description: req.body.description,
            category: req.body.category
        };

        // Preserve the existing edit form's single-image field.
        if (req.file) {
            productData.images = [req.file.path];
        }

        const product = await updateProduct(req.params.id, productData);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        return res.status(200).json({
            message: "Product updated successfully",
            data: product
        });
    } catch (error) {
        console.error("[AquaCart] Failed to update product:", error);

        return res.status(500).json({
            message: "Failed to update product",
            error: error.message
        });
    }
}

async function deleteProductController(req, res) {
    try {
        const { id } = req.params;
        const product = await deleteProduct(id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        return res.status(200).json({
            message: "Product deleted successfully",
            data: product
        });
    } catch (error) {
        console.error("[AquaCart] Failed to delete product:", error);

        return res.status(500).json({
            message: "Failed to delete product"
        });
    }
}

async function getProductByIdController(req, res) {
    try {
        const { id } = req.params;
        const product = await getProductById(id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        return res.status(200).json({
            message: "Product fetched successfully",
            data: product
        });
    } catch (error) {
        console.error("[AquaCart] Failed to fetch product:", error);

        return res.status(500).json({
            message: "Failed to fetch product"
        });
    }
}

module.exports = {
    getProducts,
    getProductByIdController,
    createProductController,
    updateProductController,
    deleteProductController
};