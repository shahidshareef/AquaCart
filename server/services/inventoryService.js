const ProductVariant = require("../models/ProductVariant");

function getInventory() {
    return ProductVariant.find()
        .populate("product", "name")
        .sort({ stock: 1 });
}

async function updateInventoryStock(variantId, stock) {
    return ProductVariant.findByIdAndUpdate(
        variantId,
        {
            stock: stock
        },
        {
            new: true,
            runValidators: true
        }
    ).populate("product", "name");
}

module.exports = {
    getInventory,
    updateInventoryStock
};