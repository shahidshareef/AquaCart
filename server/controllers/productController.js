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

        res.status(200).json({
            message: "Products fetched successfully",
            data: products
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to fetch products"
        });
    }
}

async function createProductController(req, res) {
    try {
        const {
            name,
            description,
            category,
            brand,
            status
        } = req.body;

        const image = req.file
            ? `/uploads/${req.file.filename}`
            : null;

        if (!name) {
            return res.status(400).json({
                message: "Product name is required"
            });
        }

        if (!description) {
            return res.status(400).json({
                message: "Product description is required"
            });
        }

        if (!category) {
            return res.status(400).json({
                message: "Product category is required"
            });
        }

        const product = await createProduct({
            name,
            description,
            category,
            brand,
            images: image ? [image] : [],
            status
        });

        res.status(201).json({
            message: "Product created successfully",
            data: product
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
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

        if (req.file) {
            productData.images = [
                `/uploads/${req.file.filename}`
            ];
        }

        const product = await updateProduct(
            req.params.id,
            productData
        );

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json({
            message: "Product updated successfully",
            data: product
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
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

        res.status(200).json({
            message: "Product deleted successfully",
            data: product
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
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

        res.status(200).json({
            message: "Product fetched successfully",
            data: product
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
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