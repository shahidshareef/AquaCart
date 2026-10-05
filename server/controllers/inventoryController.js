const {
    getInventory,
    updateInventoryStock
} = require("../services/inventoryService");

async function getInventoryController(req, res) {
    try {
        const inventory = await getInventory();

        res.status(200).json({
            message: "Inventory fetched successfully",
            data: inventory
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to fetch inventory"
        });
    }
}

async function updateInventoryStockController(req, res) {
    try {
        const { variantId } = req.params;
        const { stock } = req.body;

        if (stock === undefined) {
            return res.status(400).json({
                message: "Stock is required"
            });
        }

        if (Number(stock) < 0) {
            return res.status(400).json({
                message: "Stock cannot be negative"
            });
        }

        const variant = await updateInventoryStock(
            variantId,
            Number(stock)
        );

        if (!variant) {
            return res.status(404).json({
                message: "Product variant not found"
            });
        }

        res.status(200).json({
            message: "Inventory stock updated successfully",
            data: variant
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to update inventory stock"
        });
    }
}

module.exports = {
    getInventoryController,
    updateInventoryStockController
};