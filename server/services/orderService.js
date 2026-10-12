const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Address = require("../models/Address");
const ProductVariant = require("../models/ProductVariant");
const Coupon = require("../models/Coupon");

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
        { orderStatus },
        {
            new: true,
            runValidators: true
        }
    )
        .populate("user", "name email phone")
        .populate("orderItems.product", "name")
        .populate("orderItems.variant", "size sku price");
}

async function createCustomerOrder(userId, addressId, paymentMethod, couponCode) {
    if (!["cod", "razorpay"].includes(paymentMethod)) {
        throw new Error("Invalid payment method");
    }

    const session = await mongoose.startSession();

    try {
        let order;

        await session.withTransaction(async () => {
            const address = await Address.findOne({
                _id: addressId,
                user: userId
            }).session(session);

            if (!address) {
                throw new Error("Address not found");
            }

            const cart = await Cart.findOne({ user: userId })
                .session(session)
                .populate("items.product")
                .populate("items.variant");

            if (!cart || cart.items.length === 0) {
                throw new Error("Your cart is empty");
            }

            let subtotal = 0;
            const orderItems = [];

            for (const item of cart.items) {
                const product = item.product;

                if (
                    !product ||
                    product.status !== "active" ||
                    !item.variant
                ) {
                    throw new Error("A cart item is no longer available");
                }

                // Check and reduce stock atomically.
                const variant = await ProductVariant.findOneAndUpdate(
                    {
                        _id: item.variant._id,
                        product: product._id,
                        status: "active",
                        stock: { $gte: item.quantity }
                    },
                    {
                        $inc: { stock: -item.quantity }
                    },
                    {
                        new: true,
                        session,
                        runValidators: true
                    }
                );

                if (!variant) {
                    throw new Error(
                        `Insufficient stock for ${product.name}`
                    );
                }

                subtotal += variant.price * item.quantity;

                orderItems.push({
                    product: product._id,
                    variant: variant._id,
                    quantity: item.quantity,
                    price: variant.price
                });
            }

            let discount = 0;
            let coupon = null;

            if (couponCode) {
                coupon = await Coupon.findOne({
                    code: couponCode.trim().toUpperCase(),
                    status: "active"
                }).session(session);

                const now = new Date();

                if (
                    !coupon ||
                    now < coupon.startDate ||
                    now > coupon.endDate
                ) {
                    throw new Error("Invalid or expired coupon");
                }

                if (subtotal < coupon.minimumOrderAmount) {
                    throw new Error("Minimum order amount not met");
                }

                if (
                    coupon.usageLimit !== undefined &&
                    coupon.usedCount >= coupon.usageLimit
                ) {
                    throw new Error(
                        "Coupon usage limit has been reached"
                    );
                }

                discount = coupon.discountType === "percentage"
                    ? subtotal * coupon.discountValue / 100
                    : coupon.discountValue;

                if (
                    coupon.discountType === "percentage" &&
                    coupon.maxDiscountAmount !== undefined
                ) {
                    discount = Math.min(
                        discount,
                        coupon.maxDiscountAmount
                    );
                }

                discount = Math.min(discount, subtotal);
            }

            const createdOrders = await Order.create(
                [{
                    user: userId,
                    orderItems,
                    shippingAddress: {
                        fullName: address.fullName,
                        phone: address.phone,
                        addressLine: address.addressLine,
                        city: address.city,
                        state: address.state,
                        pincode: address.pincode
                    },
                    totalAmount: subtotal - discount,
                    paymentMethod,
                    paymentStatus: "pending",
                    orderStatus: "pending"
                }],
                { session }
            );

            order = createdOrders[0];

            // Count coupon usage when a COD order is placed.
            // Razorpay coupon usage must be handled after payment verification.
            if (coupon && paymentMethod === "cod") {
                const couponUpdate = await Coupon.updateOne(
                    {
                        _id: coupon._id,
                        status: "active",
                        usedCount: coupon.usageLimit !== undefined
                            ? { $lt: coupon.usageLimit }
                            : coupon.usedCount
                    },
                    {
                        $inc: { usedCount: 1 }
                    },
                    { session }
                );

                if (couponUpdate.modifiedCount !== 1) {
                    throw new Error(
                        "Coupon usage limit has been reached"
                    );
                }
            }

            // Clear the cart within the transaction.
            cart.items = [];
            await cart.save({ session });
        });

        return order;
    } finally {
        await session.endSession();
    }
}

module.exports = {
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    createCustomerOrder
};