const express = require("express");
const {registerUser, verifyEmail, forgotPassword, resetPassword, resendOtp, adminLoginUser, verifyAdminOtpUser, customerLoginUser} = require("../controllers/authController")
const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/resend-otp", resendOtp);
router.post("/admin-login", adminLoginUser);
router.post("/admin/verify-otp", verifyAdminOtpUser);
router.post("/login", customerLoginUser);


module.exports = router;
