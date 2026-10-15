
const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getOrders,
  getCustomerOrdersController,
  getOrderByIdController,
  updateOrderStatusController,
  createCustomerOrderController,
  cancelCustomerOrderController,
  requestOrderReturnController,
  reviewOrderReturnController,
} = require("../controllers/orderController");

const router = express.Router();

// Admin: get all orders.
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  getOrders
);

// Customer: get their own orders.
router.get(
  "/my-orders",
  authMiddleware,
  roleMiddleware("customer"),
  getCustomerOrdersController
);

// Customer: create an order.
router.post(
  "/",
  authMiddleware,
  roleMiddleware("customer"),
  createCustomerOrderController
);

// Customer: cancel an eligible order.
router.post(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware("customer"),
  cancelCustomerOrderController
);

// Customer: request a return for a delivered order.
router.post(
  "/:id/return-request",
  authMiddleware,
  roleMiddleware("customer"),
  requestOrderReturnController
);

// Admin: approve or reject a pending return request.
router.patch(
  "/:id/return-request",
  authMiddleware,
  roleMiddleware("admin"),
  reviewOrderReturnController
);

// Admin: update ordinary order statuses.
router.put(
  "/:id/status",
  authMiddleware,
  roleMiddleware("admin"),
  updateOrderStatusController
);

// Get one order by ID.
// The route is authenticated because it is shared by customers and admins.
// The controller then applies customer ownership or admin access accordingly.
router.get("/:id", authMiddleware, getOrderByIdController);

module.exports = router;
