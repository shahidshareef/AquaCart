const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");

function getAllProducts() {
    return Product.find()
        .populate("category", "name")
        .sort({ createdAt: -1 });
}

async function createProduct(productData) {
    const product = new Product(productData);

    return product.save();
}

async function updateProduct(productId, productData) {
    return Product.findByIdAndUpdate(
        productId,
        productData,
        {
            new: true,
            runValidators: true
        }
    ).populate("category", "name");
}

async function deleteProduct(productId) {
    await ProductVariant.deleteMany({
        product: productId
    });

    return Product.findByIdAndDelete(productId);
}

async function getProductById(productId) {
    return Product.findById(productId)
        .populate("category", "name");
}

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};