const ProductVariant = require("../models/ProductVariant");

function getProductVariants(productId) {
    return ProductVariant.find({
        product: productId
    }).sort({ createdAt: -1 });
}

async function createProductVariant(variantData) {
    const variant = new ProductVariant(variantData);

    return variant.save();
}

async function updateProductVariant(variantId, variantData) {
    return ProductVariant.findByIdAndUpdate(
        variantId,
        variantData,
        {
            new: true,
            runValidators: true
        }
    );
}

async function deleteProductVariant(variantId) {
    return ProductVariant.findByIdAndDelete(variantId);
}

module.exports = {
    getProductVariants,
    createProductVariant,
    updateProductVariant,
    deleteProductVariant
};