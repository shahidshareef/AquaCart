const {
    getAllCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    updateCouponStatus
} = require("../services/couponService");

function validateCouponData(data) {
    const {
        code,
        discountType,
        discountValue,
        minimumOrderAmount = 0,
        maxDiscountAmount,
        startDate,
        endDate,
        usageLimit,
        status = "active"
    } = data;

    if (typeof code !== "string" || !code.trim()) {
        return "Coupon code is required.";
    }

    if (!descriptionIsValid(data.description)) {
        return "Description must be text.";
    }

    if (!["fixed", "percentage"].includes(discountType)) {
        return "Discount type must be fixed or percentage.";
    }

    const discount = Number(discountValue);
    const minimum = Number(minimumOrderAmount);

    if (discountValue === undefined || discountValue === null || discountValue === "" || !Number.isFinite(discount) || discount <= 0) {
        return "Discount value must be greater than zero.";
    }

    if (minimumOrderAmount === "" || !Number.isFinite(minimum) || minimum < 0) {
        return "Minimum order amount must be zero or greater.";
    }

    if (discountType === "percentage" && discount > 100) {
        return "Percentage discount cannot exceed 100%.";
    }

    if (discountType === "fixed" && discount > minimum) {
        return `Fixed discount (₹${discount}) cannot exceed the minimum order amount (₹${minimum}).`;
    }

    if (maxDiscountAmount !== undefined && maxDiscountAmount !== null && maxDiscountAmount !== "") {
        const maxDiscount = Number(maxDiscountAmount);
        if (!Number.isFinite(maxDiscount) || maxDiscount <= 0) {
            return "Maximum discount must be greater than zero, or omit it for no limit.";
        }
    }

    if (!startDate || !Number.isFinite(new Date(startDate).getTime()) || !endDate || !Number.isFinite(new Date(endDate).getTime())) {
        return "Valid start and end dates are required.";
    }

    if (new Date(endDate) < new Date(startDate)) {
        return "End date cannot be before start date.";
    }

    if (usageLimit !== undefined && usageLimit !== null && usageLimit !== "") {
        if (!Number.isInteger(Number(usageLimit)) || Number(usageLimit) < 1) {
            return "Usage limit must be a positive whole number.";
        }
    }

    if (!["active", "inactive"].includes(status)) {
        return "Status must be active or inactive.";
    }

    return null;
}

function descriptionIsValid(value) {
    return value === undefined || value === null || typeof value === "string";
}

function normalizeCouponData(data) {
    const normalized = {
        ...data,
        code: data.code.trim().toUpperCase(),
        description: typeof data.description === "string" ? data.description.trim() : "",
        discountValue: Number(data.discountValue),
        minimumOrderAmount: data.minimumOrderAmount === undefined || data.minimumOrderAmount === "" ? 0 : Number(data.minimumOrderAmount),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status || "active"
    };

    if (data.maxDiscountAmount === undefined || data.maxDiscountAmount === null || data.maxDiscountAmount === "") {
        delete normalized.maxDiscountAmount;
    } else {
        normalized.maxDiscountAmount = Number(data.maxDiscountAmount);
    }

    if (data.usageLimit === undefined || data.usageLimit === null || data.usageLimit === "") {
        delete normalized.usageLimit;
    } else {
        normalized.usageLimit = Number(data.usageLimit);
    }

    return normalized;
}

async function getCoupons(req, res) {
    try {
        const coupons = await getAllCoupons();
        return res.status(200).json({ message: "Coupons fetched successfully", data: coupons });
    } catch (error) {
        console.error("Get coupons error:", error);
        return res.status(500).json({ message: "Failed to fetch coupons" });
    }
}

async function createCouponController(req, res) {
    try {
        const validationError = validateCouponData(req.body || {});
        if (validationError) return res.status(400).json({ message: validationError });

        const coupon = await createCoupon(normalizeCouponData(req.body));
        return res.status(201).json({ message: "Coupon created successfully", data: coupon });
    } catch (error) {
        console.error("Create coupon error:", error);
        if (error.code === 11000) return res.status(409).json({ message: "Coupon code already exists" });
        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: "Failed to create coupon" });
    }
}

async function updateCouponController(req, res) {
    try {
        const validationError = validateCouponData(req.body || {});
        if (validationError) return res.status(400).json({ message: validationError });

        const coupon = await updateCoupon(req.params.id, normalizeCouponData(req.body));
        if (!coupon) return res.status(404).json({ message: "Coupon not found" });
        return res.status(200).json({ message: "Coupon updated successfully", data: coupon });
    } catch (error) {
        console.error("Update coupon error:", error);
        if (error.code === 11000) return res.status(409).json({ message: "Coupon code already exists" });
        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: "Failed to update coupon" });
    }
}

async function deleteCouponController(req, res) {
    try {
        const coupon = await deleteCoupon(req.params.id);
        if (!coupon) return res.status(404).json({ message: "Coupon not found" });
        return res.status(200).json({ message: "Coupon deleted successfully", data: coupon });
    } catch (error) {
        console.error("Delete coupon error:", error);
        if (error.name === "CastError") return res.status(400).json({ message: "Invalid coupon ID" });
        return res.status(500).json({ message: "Failed to delete coupon" });
    }
}

async function updateCouponStatusController(req, res) {
    try {
        const { status } = req.body || {};
        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({ message: "Status must be active or inactive" });
        }

        const coupon = await updateCouponStatus(req.params.id, status);
        if (!coupon) return res.status(404).json({ message: "Coupon not found" });
        return res.status(200).json({ message: "Coupon status updated successfully", data: coupon });
    } catch (error) {
        console.error("Update coupon status error:", error);
        if (error.name === "CastError") return res.status(400).json({ message: "Invalid coupon ID" });
        return res.status(500).json({ message: "Failed to update coupon status" });
    }
}

module.exports = {
    getCoupons,
    createCouponController,
    updateCouponController,
    deleteCouponController,
    updateCouponStatusController
};