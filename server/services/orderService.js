const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Address = require("../models/Address");
const ProductVariant = require("../models/ProductVariant");
const Coupon = require("../models/Coupon");
const Payment = require("../models/Payment");

function getAllOrders() {
    return Order.find()
        .populate("user", "name email phone")
        .populate("orderItems.product", "name")
        .populate("orderItems.variant", "size sku price")
        .sort({ createdAt: -1 });
}

async function getCustomerOrders(userId) {
    return Order.find({ user: userId })
        .populate("orderItems.product", "name")
        .populate("orderItems.variant", "size sku price")
        .sort({ createdAt: -1 });
}

async function getOrderById(orderId, userId = null) {
    const query = { _id: orderId };

    // Customer order lookup must be restricted to that customer's own order.
    // Admin callers pass no userId and can look up any order.
    if (userId) {
        query.user = userId;
    }

    return Order.findOne(query)
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

async function getRazorpayCheckoutDetails(
    userId,
    addressId,
    couponCode
) {
    const address = await Address.findOne({
        _id: addressId,
        user: userId
    });

    if (!address) {
        throw new Error("Address not found");
    }

    const cart = await Cart.findOne({ user: userId })
        .populate("items.product")
        .populate("items.variant");

    if (!cart || cart.items.length === 0) {
        throw new Error("Your cart is empty");
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
        const product = item.product;
        const variant = item.variant;

        if (
            !product ||
            product.status !== "active" ||
            !variant ||
            variant.status !== "active" ||
            String(variant.product) !== String(product._id)
        ) {
            throw new Error("A cart item is no longer available");
        }

        if (variant.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
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
    let normalizedCouponCode = null;

    if (couponCode) {
        const normalizedCode = couponCode.trim().toUpperCase();

        const coupon = await Coupon.findOne({
            code: normalizedCode,
            status: "active"
        });

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
            throw new Error("Coupon usage limit has been reached");
        }

        discount = coupon.discountType === "percentage"
            ? subtotal * coupon.discountValue / 100
            : coupon.discountValue;

        if (
            coupon.discountType === "percentage" &&
            coupon.maxDiscountAmount !== undefined
        ) {
            discount = Math.min(discount, coupon.maxDiscountAmount);
        }

        discount = Math.min(discount, subtotal);
        normalizedCouponCode = coupon.code;
    }

    return {
        orderItems,
        shippingAddress: {
            fullName: address.fullName,
            phone: address.phone,
            addressLine: address.addressLine,
            city: address.city,
            state: address.state,
            pincode: address.pincode
        },
        subtotal,
        discountAmount: discount,
        totalAmount: subtotal - discount,
        couponCode: normalizedCouponCode
    };
}

async function createPendingRazorpayOrder(
    userId,
    checkoutDetails,
    razorpayOrderId
) {
    const session = await mongoose.startSession();

    try {
        let order;
        let payment;

        await session.withTransaction(async () => {
            const createdOrders = await Order.create(
                [{
                    user: userId,
                    orderItems: checkoutDetails.orderItems,
                    shippingAddress: checkoutDetails.shippingAddress,
                    totalAmount: checkoutDetails.totalAmount,
                    couponCode: checkoutDetails.couponCode,
                    discountAmount: checkoutDetails.discountAmount,
                    paymentMethod: "razorpay",
                    paymentStatus: "pending",
                    orderStatus: "pending"
                }],
                { session }
            );

            order = createdOrders[0];

            const createdPayments = await Payment.create(
                [{
                    order: order._id,
                    user: userId,
                    paymentMethod: "razorpay",
                    razorpayOrderId,
                    amount: checkoutDetails.totalAmount,
                    status: "pending"
                }],
                { session }
            );

            payment = createdPayments[0];
        });

        return { order, payment };
    } finally {
        await session.endSession();
    }
}

async function completeRazorpayOrder(
    userId,
    razorpayOrderId,
    razorpayPaymentId
) {
    const session = await mongoose.startSession();

    try {
        let completedOrder;

        await session.withTransaction(async () => {
            const payment = await Payment.findOne({
                razorpayOrderId,
                user: userId,
                paymentMethod: "razorpay"
            }).session(session);

            if (!payment) {
                throw new Error("Payment record not found");
            }

            // Make repeated verification of the same payment idempotent.
            if (payment.status === "paid") {
                if (payment.transactionId === razorpayPaymentId) {
                    completedOrder = await Order.findOne({
                        _id: payment.order,
                        user: userId
                    }).session(session);

                    if (!completedOrder) {
                        throw new Error("AquaCart order not found");
                    }

                    return;
                }

                throw new Error("Payment has already been completed");
            }

            if (payment.status !== "pending") {
                throw new Error("Payment is not pending");
            }

            const order = await Order.findOne({
                _id: payment.order,
                user: userId,
                paymentMethod: "razorpay",
                paymentStatus: "pending",
                orderStatus: "pending"
            }).session(session);

            if (!order) {
                throw new Error("Pending AquaCart order not found");
            }

            // Confirm that the cart still matches the pending order.
            const cart = await Cart.findOne({
                user: userId
            }).session(session);

            if (!cart || cart.items.length !== order.orderItems.length) {
                throw new Error(
                    "Cart changed after checkout; order needs review"
                );
            }

            const cartItems = cart.items.map((item) => ({
                productId: String(item.product),
                variantId: String(item.variant),
                quantity: item.quantity
            }));

            const orderItems = order.orderItems.map((item) => ({
                productId: String(item.product),
                variantId: String(item.variant),
                quantity: item.quantity
            }));

            const sortItems = (items) =>
                items.sort((a, b) =>
                    `${a.productId}:${a.variantId}`.localeCompare(
                        `${b.productId}:${b.variantId}`
                    )
                );

            if (
                JSON.stringify(sortItems(cartItems)) !==
                JSON.stringify(sortItems(orderItems))
            ) {
                throw new Error(
                    "Cart changed after checkout; order needs review"
                );
            }

            // Deduct stock only after payment verification.
            for (const item of order.orderItems) {
                const variant = await ProductVariant.findOneAndUpdate(
                    {
                        _id: item.variant,
                        product: item.product,
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
                        "Insufficient stock to complete the order"
                    );
                }
            }

            // Count coupon usage only after successful payment.
            if (order.couponCode) {
                const coupon = await Coupon.findOne({
                    code: order.couponCode
                }).session(session);

                if (!coupon || coupon.status !== "active") {
                    throw new Error("Coupon is no longer available");
                }

                if (
                    coupon.usageLimit !== undefined &&
                    coupon.usedCount >= coupon.usageLimit
                ) {
                    throw new Error(
                        "Coupon usage limit has been reached"
                    );
                }

                const couponFilter = {
                    _id: coupon._id,
                    status: "active"
                };

                if (coupon.usageLimit !== undefined) {
                    couponFilter.usedCount = {
                        $lt: coupon.usageLimit
                    };
                }

                const couponUpdate = await Coupon.updateOne(
                    couponFilter,
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

            payment.transactionId = razorpayPaymentId;
            payment.status = "paid";

            order.paymentStatus = "paid";
            order.orderStatus = "confirmed";

            cart.items = [];

            await payment.save({ session });
            await order.save({ session });
            await cart.save({ session });

            completedOrder = order;
        });

        return completedOrder;
    } finally {
        await session.endSession();
    }
}

async function createCustomerOrder(
    userId,
    addressId,
    paymentMethod,
    couponCode
) {
    if (paymentMethod !== "cod") {
        throw new Error(
            "Use the payment API for Razorpay orders"
        );
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

            if (coupon && paymentMethod === "cod") {
                const couponFilter = {
                    _id: coupon._id,
                    status: "active"
                };

                if (coupon.usageLimit !== undefined) {
                    couponFilter.usedCount = {
                        $lt: coupon.usageLimit
                    };
                } else {
                    couponFilter.usedCount = coupon.usedCount;
                }

                const couponUpdate = await Coupon.updateOne(
                    couponFilter,
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
    getCustomerOrders,
    getOrderById,
    updateOrderStatus,
    createCustomerOrder,
    getRazorpayCheckoutDetails,
    createPendingRazorpayOrder,
    completeRazorpayOrder
};