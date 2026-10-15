const express = require("express");

const {
    registerUser,
    verifyEmail,
    forgotPassword,
    resetPassword,
    resendOtp,
    adminLoginUser,
    verifyAdminOtpUser,
    customerLoginUser,
    getCustomerProfile,
    updateCustomerProfile,
    changeCustomerPasswordUser,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/resend-otp", resendOtp);

router.post("/admin-login", adminLoginUser);
router.post("/admin/verify-otp", verifyAdminOtpUser);

router.post("/login", customerLoginUser);

// Protected customer profile endpoints
router.get("/profile", authMiddleware, getCustomerProfile);
router.put("/profile", authMiddleware, updateCustomerProfile);
router.put(
    "/change-password",
    authMiddleware,
    changeCustomerPasswordUser
);

module.exports = router;