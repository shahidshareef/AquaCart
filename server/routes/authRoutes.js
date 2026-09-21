const express = require("express");
const {registerUser, verifyEmail} = require("../controllers/authController")
const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);

module.exports = router;
