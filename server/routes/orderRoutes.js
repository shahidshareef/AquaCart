const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    getOrders,
    getCustomerOrdersController,
    getOrderByIdController,
    updateOrderStatusController,
    createCustomerOrderController
} = require("../controllers/orderController");

const router = express.Router();

router.get("/", getOrders);

router.get(
    "/my-orders",
    authMiddleware,
    roleMiddleware("customer"),
    getCustomerOrdersController
);

router.get("/:id", getOrderByIdController);

router.put(
    "/:id/status",
    updateOrderStatusController
);

router.post(
    "/",
    authMiddleware,
    roleMiddleware("customer"),
    createCustomerOrderController
);

module.exports = router;