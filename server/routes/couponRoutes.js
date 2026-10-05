const express = require("express");

const {
    getCoupons,
    createCouponController,
    updateCouponController,
    deleteCouponController,
    updateCouponStatusController
} = require("../controllers/couponController");

const router = express.Router();

router.get("/", getCoupons);

router.post("/", createCouponController);

router.put("/:id", updateCouponController);

router.delete("/:id", deleteCouponController);

router.patch("/:id/status", updateCouponStatusController);

module.exports = router;