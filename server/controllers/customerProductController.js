const {
    getFeaturedProducts,
    getCustomerProducts
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

module.exports = {
    getFeaturedProductsController,
    getCustomerProductsController
};