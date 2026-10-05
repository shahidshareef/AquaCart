const {
    getAllCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    updateCouponStatus
} = require("../services/couponService");

async function getCoupons(req, res) {
    try {
        const coupons = await getAllCoupons();

        res.status(200).json({
            message: "Coupons fetched successfully",
            data: coupons
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to fetch coupons"
        });
    }
}

async function createCouponController(req, res) {
    try {
        const {
            code,
            description,
            discountType,
            discountValue,
            minimumOrderAmount,
            maxDiscountAmount,
            startDate,
            endDate,
            usageLimit,
            status
        } = req.body;

        if (!code) {
            return res.status(400).json({
                message: "Coupon code is required"
            });
        }

        if (!discountType) {
            return res.status(400).json({
                message: "Discount type is required"
            });
        }

        if (discountValue === undefined) {
            return res.status(400).json({
                message: "Discount value is required"
            });
        }

        if (Number(discountValue) < 0) {
            return res.status(400).json({
                message: "Discount value cannot be negative"
            });
        }

        const coupon = await createCoupon({
            code,
            description,
            discountType,
            discountValue,
            minimumOrderAmount,
            maxDiscountAmount,
            startDate,
            endDate,
            usageLimit,
            status
        });

        res.status(201).json({
            message: "Coupon created successfully",
            data: coupon
        });
    } catch (error) {
        console.log(error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Coupon code already exists"
            });
        }

        res.status(500).json({
            message: "Failed to create coupon"
        });
    }
}

async function updateCouponController(req, res) {
    try {
        const { id } = req.params;

        const {
            code,
            description,
            discountType,
            discountValue,
            minimumOrderAmount,
            maxDiscountAmount,
            startDate,
            endDate,
            usageLimit,
            status
        } = req.body;

        if (!code) {
            return res.status(400).json({
                message: "Coupon code is required"
            });
        }

        if (!discountType) {
            return res.status(400).json({
                message: "Discount type is required"
            });
        }

        if (discountValue === undefined) {
            return res.status(400).json({
                message: "Discount value is required"
            });
        }

        if (Number(discountValue) < 0) {
            return res.status(400).json({
                message: "Discount value cannot be negative"
            });
        }

        const coupon = await updateCoupon(
            id,
            {
                code,
                description,
                discountType,
                discountValue,
                minimumOrderAmount,
                maxDiscountAmount,
                startDate,
                endDate,
                usageLimit,
                status
            }
        );

        if (!coupon) {
            return res.status(404).json({
                message: "Coupon not found"
            });
        }

        res.status(200).json({
            message: "Coupon updated successfully",
            data: coupon
        });
    } catch (error) {
        console.log(error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Coupon code already exists"
            });
        }

        res.status(500).json({
            message: "Failed to update coupon"
        });
    }
}

async function deleteCouponController(req, res) {
    try {
        const { id } = req.params;

        const coupon = await deleteCoupon(id);

        if (!coupon) {
            return res.status(404).json({
                message: "Coupon not found"
            });
        }

        res.status(200).json({
            message: "Coupon deleted successfully",
            data: coupon
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to delete coupon"
        });
    }
}

async function updateCouponStatusController(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                message: "Coupon status is required"
            });
        }

        const coupon = await updateCouponStatus(
            id,
            status
        );

        if (!coupon) {
            return res.status(404).json({
                message: "Coupon not found"
            });
        }

        res.status(200).json({
            message: "Coupon status updated successfully",
            data: coupon
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to update coupon status"
        });
    }
}

module.exports = {
    getCoupons,
    createCouponController,
    updateCouponController,
    deleteCouponController,
    updateCouponStatusController
};