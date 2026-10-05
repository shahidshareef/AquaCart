const Order = require("../models/Order");

async function getDashboardData() {
    const recentOrders = await Order.find()
        .populate("user", "name email phone")
        .populate("orderItems.product", "name")
        .populate("orderItems.variant", "size sku price")
        .sort({ createdAt: -1 })
        .limit(6);

    return {
        totalRevenue: 124850,
        totalOrders: 48,
        totalProducts: 10,
        recentOrders: recentOrders
    };
}

module.exports = {
    getDashboardData
};