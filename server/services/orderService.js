const Order = require("../models/Order");

function getAllOrders() {
    return Order.find()
        .populate("user", "name email phone")
        .populate("orderItems.product", "name")
        .populate("orderItems.variant", "size sku price")
        .sort({ createdAt: -1 });
}

async function getOrderById(orderId) {
    return Order.findById(orderId)
        .populate("user", "name email phone")
        .populate("orderItems.product", "name")
        .populate("orderItems.variant", "size sku price");
}

async function updateOrderStatus(orderId, orderStatus) {
    return Order.findByIdAndUpdate(
        orderId,
        {
            orderStatus: orderStatus
        },
        {
            new: true,
            runValidators: true
        }
    )
        .populate("user", "name email phone")
        .populate("orderItems.product", "name")
        .populate("orderItems.variant", "size sku price");
}

module.exports = {
    getAllOrders,
    getOrderById,
    updateOrderStatus
};