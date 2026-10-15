
const {
  getAllOrders,
  getCustomerOrders,
  getOrderById,
  updateOrderStatus,
  createCustomerOrder,
} = require("../services/orderService");

const {
  cancelCustomerOrder,
  requestOrderReturn,
  reviewOrderReturn,
} = require("../services/orderCancellationService");

// Get all orders (admin).
const getOrders = async (req, res) => {
  try {
    const orders = await getAllOrders();

    return res.status(200).json({
      message: "Orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get orders belonging to the logged-in customer.
const getCustomerOrdersController = async (req, res) => {
  try {
    const orders = await getCustomerOrders(req.user.userId);

    return res.status(200).json({
      message: "Customer orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get one order by ID.
const getOrderByIdController = async (req, res) => {
  try {
    // This endpoint is shared by the customer and admin order routes.
    // Customers may only retrieve their own order; admins may retrieve any order.
    if (!req.user || !["customer", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const userId = req.user.role === "customer" ? req.user.userId : null;
    const order = await getOrderById(req.params.id, userId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({
      message: "Order fetched successfully",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Update ordinary order statuses (admin).
const updateOrderStatusController = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        message:
          "Invalid order status. Use the dedicated cancellation or return workflow.",
      });
    }

    const order = await updateOrderStatus(req.params.id, orderStatus);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Create a customer order.

const createCustomerOrderController = async (req, res) => {
    try {
        const { addressId, paymentMethod, couponCode } = req.body || {};

        const order = await createCustomerOrder(
            req.user.userId,
            addressId,
            paymentMethod,
            couponCode
        );

        return res.status(201).json({
            message: "Order created successfully",
            data: order
        });
    } catch (error) {
        const knownErrors = [
            "Cart not found",
            "Cart is empty",
            "Address not found",
            "One or more products are unavailable",
            "Insufficient stock",
            "Invalid coupon",
            "Use the payment API for Razorpay orders"
        ];

        const statusCode = knownErrors.includes(error.message)
            ? 400
            : 500;

        console.error("Create customer order error:", error);

        return res.status(statusCode).json({
            message: error.message || "Failed to create order."
        });
    }
};


// Customer cancellation.
const cancelCustomerOrderController = async (req, res) => {
  try {
    const order = await cancelCustomerOrder(
      req.user.userId,
      req.params.id,
      req.body?.reason || ""
    );

    const message =
      order.refundStatus === "pending"
        ? "Order cancelled. Your refund is pending processing."
        : "Order cancelled successfully";

    return res.status(200).json({ message, data: order });
  } catch (error) {
    const knownErrors = [
      "Invalid order ID",
      "Order not found",
      "This order can no longer be cancelled",
      "Cancellation reason cannot exceed 500 characters",
      "Cancellation reason must be text",
    ];

    const statusCode = knownErrors.includes(error.message) ? 400 : 500;

    if (error.message === "Order not found") {
      return res.status(404).json({ message: error.message });
    }

    return res.status(statusCode).json({ message: error.message });
  }
};

// Customer submits a return request.
const requestOrderReturnController = async (req, res) => {
  try {
    const { reason, details } = req.body || {};

    const order = await requestOrderReturn(
      req.user.userId,
      req.params.id,
      reason,
      details || ""
    );

    return res.status(201).json({
      message: "Return request submitted successfully",
      data: order,
    });
  } catch (error) {
    const knownErrors = [
      "Invalid order ID",
      "Order not found",
      "Only delivered orders can be returned",
      "Return reason is required",
      "Return reason cannot exceed 200 characters",
      "Return details must be text",
      "Return details cannot exceed 1000 characters",
      "A return request already exists for this order",
      "Could not submit return request. Please try again.",
    ];

    let statusCode = knownErrors.includes(error.message) ? 400 : 500;

    if (error.message === "Order not found") {
      statusCode = 404;
    }

    return res.status(statusCode).json({ message: error.message });
  }
};

// Admin approves or rejects a pending return request.
const reviewOrderReturnController = async (req, res) => {
  try {
    const { decision, adminNote } = req.body || {};

    const order = await reviewOrderReturn(
      req.params.id,
      decision,
      adminNote === undefined ? "" : adminNote
    );

    return res.status(200).json({
      message: `Return request ${decision} successfully`,
      data: order,
    });
  } catch (error) {
    const knownErrors = [
      "Invalid order ID",
      "Order not found",
      "Decision must be approved or rejected",
      "Admin note must be text",
      "Admin note cannot exceed 1000 characters",
      "Only delivered orders can have return requests reviewed",
      "This order has no pending return request",
      "Could not review return request. Please try again.",
    ];

    let statusCode = knownErrors.includes(error.message) ? 400 : 500;

    if (error.message === "Order not found") {
      statusCode = 404;
    }

    return res.status(statusCode).json({ message: error.message });
  }
};

module.exports = {
  getOrders,
  getCustomerOrdersController,
  getOrderByIdController,
  updateOrderStatusController,
  createCustomerOrderController,
  cancelCustomerOrderController,
  requestOrderReturnController,
  reviewOrderReturnController,
};
