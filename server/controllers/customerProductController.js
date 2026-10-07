const {
    getFeaturedProducts,
    getCustomerProducts,
    getCustomerProductById,
    getRelatedProducts,
    getProductReviews
} = require("../services/customerProductService");

async function getFeaturedProductsController(req, res) {
    try {
        const products = await getFeaturedProducts();

        res.status(200).json({
            message: "Featured products fetched successfully",
            data: products
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to fetch featured products"
        });
    }
}

async function getCustomerProductsController(req, res) {
    try {
        const {
            search,
            category,
            sort,
            page = 1,
            limit = 8
        } = req.query;

        const result = await getCustomerProducts({
            search,
            category,
            sort,
            page,
            limit
        });

        res.status(200).json({
            message: "Products fetched successfully",
            data: result.products,
            pagination: result.pagination
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to fetch products"
        });
    }
}
async function getCustomerProductByIdController(req, res) {
    try {
        const { id } = req.params;

        const product = await getCustomerProductById(id);

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
        console.error(error);

        return res.status(500).json({
            message: "Failed to fetch product"
        });
    }
}

async function getRelatedProductsController(req, res) {
    try {
        const { id } = req.params;

        const products = await getRelatedProducts(id);

        return res.status(200).json({
            message: "Related products fetched successfully",
            data: products
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to fetch related products"
        });
    }
}

async function getProductReviewsController(req, res) {
    try {
        const { id } = req.params;

        const reviews = await getProductReviews(id);

        return res.status(200).json({
            message: "Reviews fetched successfully",
            data: reviews
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to fetch reviews"
        });
    }
}

module.exports = {
    getFeaturedProductsController,
    getCustomerProductsController,
    getCustomerProductByIdController,
    getRelatedProductsController,
    getProductReviewsController
};