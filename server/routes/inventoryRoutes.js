const express = require("express");

const {
    getInventoryController,
    updateInventoryStockController
} = require("../controllers/inventoryController");

const router = express.Router();

router.get("/", getInventoryController);

router.put(
    "/:variantId/stock",
    updateInventoryStockController
);

module.exports = router;