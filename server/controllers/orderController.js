const {
    getAllOrders,
    getOrderById,
    updateOrderStatus
} = require("../services/orderService");

async function getOrders(req, res) {
    try {
        const orders = await getAllOrders();

        res.status(200).json({
            message: "Orders fetched successfully",
            data: orders
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to fetch orders"
        });
    }
}

async function getOrderByIdController(req, res) {
    try {
        const { id } = req.params;

        const order = await getOrderById(id);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        res.status(200).json({
            message: "Order fetched successfully",
            data: order
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to fetch order"
        });
    }
}

async function updateOrderStatusController(req, res) {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body;

        if (!orderStatus) {
            return res.status(400).json({
                message: "Order status is required"
            });
        }

        const allowedStatuses = [
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
            "returned"
        ];

        if (!allowedStatuses.includes(orderStatus)) {
            return res.status(400).json({
                message: "Invalid order status"
            });
        }

        const order = await updateOrderStatus(
            id,
            orderStatus
        );

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        res.status(200).json({
            message: "Order status updated successfully",
            data: order
        });
    } catch (error) {
        console.log(error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: "Invalid order status"
            });
        }

        res.status(500).json({
            message: "Failed to update order status"
        });
    }
}

const { createCustomerOrder } = require("../services/orderService");

async function createCustomerOrderController(req, res) {
    try {
        const userId = req.user.userId;

        const {
            addressId,
            paymentMethod,
            couponCode
        } = req.body;

        if (!addressId || !paymentMethod) {
            return res.status(400).json({
                message: "Address and payment method are required"
            });
        }

        const order = await createCustomerOrder(
            userId,
            addressId,
            paymentMethod,
            couponCode
        );

        return res.status(201).json({
            message: "Order created successfully",
            data: order
        });
    } catch (error) {
        console.error(error);

        const clientErrors = [
            "Invalid payment method",
            "Address not found",
            "Your cart is empty",
            "A cart item is no longer available",
            "Invalid or expired coupon",
            "Minimum order amount not met",
            "Coupon usage limit has been reached"
        ];

        const isClientError =
            clientErrors.includes(error.message) ||
            error.message.startsWith("Insufficient stock");

        return res.status(isClientError ? 400 : 500).json({
            message: isClientError
                ? error.message
                : "Failed to create order"
        });
    }
}

module.exports = {
    getOrders,
    getOrderByIdController,
    updateOrderStatusController,
    createCustomerOrderController
};