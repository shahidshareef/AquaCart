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
    return Coupon.findByIdAndUpdate(
        couponId,
        couponData,
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