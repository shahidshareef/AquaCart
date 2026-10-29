const Coupon = require("../models/Coupon");

function getAllCoupons() {
    return Coupon.find()
        .sort({ createdAt: -1 });
}

async function createCoupon(couponData) {
    const coupon = new Coupon(couponData);

    return coupon.save();
}

async function updateCoupon(couponId, couponData) {
    const update = { $set: { ...couponData } };

    // Clearing the optional maximum discount must remove the old database value.
    if (!Object.prototype.hasOwnProperty.call(couponData, "maxDiscountAmount")) {
        update.$unset = { maxDiscountAmount: 1 };
    }

    if (!Object.prototype.hasOwnProperty.call(couponData, "usageLimit")) {
        update.$unset = { ...(update.$unset || {}), usageLimit: 1 };
    }

    return Coupon.findByIdAndUpdate(
        couponId,
        update,
        {
            new: true,
            runValidators: true
        }
    );
}

async function deleteCoupon(couponId) {
    return Coupon.findByIdAndDelete(couponId);
}

async function updateCouponStatus(couponId, status) {
    return Coupon.findByIdAndUpdate(
        couponId,
        {
            status: status
        },
        {
            new: true,
            runValidators: true
        }
    );
}

module.exports = {
    getAllCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    updateCouponStatus
};