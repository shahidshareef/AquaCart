const express = require("express");

const {
    getOrders,
    getOrderByIdController,
    updateOrderStatusController
} = require("../controllers/orderController");

const router = express.Router();

router.get("/", getOrders);

router.get("/:id", getOrderByIdController);

router.put(
    "/:id/status",
    updateOrderStatusController
);

module.exports = router;