const Cart = require("../models/Cart");
const Coupon = require("../models/Coupon");

async function getCheckoutSummary(userId) {
    const cart = await Cart.findOne({
        user: userId
    })
        .populate("items.product")
        .populate("items.variant");

    if (!cart || cart.items.length === 0) {
        throw new Error("Your cart is empty");
    }

    let subtotal = 0;

    const items = cart.items.map((item) => {
        const price = item.variant.price;
        const itemTotal = price * item.quantity;

        subtotal += itemTotal;

        return {
            product: item.product,
            variant: item.variant,
            quantity: item.quantity,
            price,
            itemTotal
        };
    });

    return {
        items,
        subtotal,
        discount: 0,
        total: subtotal
    };
}

async function applyCoupon(userId, couponCode) {
    const summary = await getCheckoutSummary(userId);

    const coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
        status: "active"
    });

    if (!coupon) {
        throw new Error("Invalid or inactive coupon");
    }

    const now = new Date();

    if (now < coupon.startDate || now > coupon.endDate) {
        throw new Error("Coupon is not valid at this time");
    }

    if (summary.subtotal < coupon.minimumOrderAmount) {
        throw new Error(
            `Minimum order amount is ₹${coupon.minimumOrderAmount}`
        );
    }

    if (
        coupon.usageLimit !== undefined &&
        coupon.usedCount >= coupon.usageLimit
    ) {
        throw new Error("Coupon usage limit has been reached");
    }

    let discount = 0;

    if (coupon.discountType === "percentage") {
        discount = summary.subtotal * coupon.discountValue / 100;

        // Missing/null maximum means no cap. A value of zero is not treated
        // as an omitted field; admin validation prevents zero from being saved.
        if (coupon.maxDiscountAmount !== undefined && coupon.maxDiscountAmount !== null) {
            discount = Math.min(discount, coupon.maxDiscountAmount);
        }
    } else {
        discount = coupon.discountValue;
    }

    // Use a consistent currency precision and never discount more than subtotal.
    discount = Math.round(Math.min(discount, summary.subtotal) * 100) / 100;
    const total = Math.round(Math.max(0, summary.subtotal - discount) * 100) / 100;

    return {
        ...summary,
        coupon: {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue
        },
        discount,
        total
    };
}

module.exports = {
    getCheckoutSummary,
    applyCoupon
};