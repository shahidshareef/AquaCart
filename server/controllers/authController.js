const crypto = require("crypto");

const {
    registerUser: registerUserService,
    generateEmailOtp,
    findResetToken,
    resetUserPassword,
    resendEmailOtp,
    adminLogin,
    verifyAdminOtp,
    customerLogin,
    updateCustomerProfile: updateCustomerProfileService,
    changeCustomerPassword,
} = require("../services/authService");

const User = require("../models/User");
const PasswordResetToken = require("../models/PasswordResetToken");
const createToken = require("../utils/jwt");
const {
    sendPasswordResetEmail,
} = require("../utils/emailService");

const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({
            email: email?.toLowerCase().trim(),
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found, please register",
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                message: "Email is already verified",
            });
        }

        if (
            !user.emailVerificationOtp ||
            !user.emailVerificationOtpExpiresAt
        ) {
            return res.status(400).json({
                message: "Please request a new OTP.",
            });
        }

        if (otp !== user.emailVerificationOtp) {
            return res.status(400).json({
                message: "Invalid OTP",
            });
        }

        if (new Date() > user.emailVerificationOtpExpiresAt) {
            return res.status(400).json({
                message: "OTP has expired",
            });
        }

        user.isEmailVerified = true;
        user.emailVerificationOtp = undefined;
        user.emailVerificationOtpExpiresAt = undefined;

        await user.save();

        return res.status(200).json({
            message: "Email verified successfully",
        });
    } catch (error) {
        console.error("Verify email error:", error);

        return res.status(500).json({
            message: "Failed to verify email.",
        });
    }
};

const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
            });
        }

        await resendEmailOtp(email);

        return res.json({
            message: "OTP resent successfully",
        });
    } catch (error) {
        console.error("Resend OTP error:", error);

        return res.status(400).json({
            message: error.message,
        });
    }
};

const registerUser = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            return res.status(400).json({
                message: "Please enter a valid email",
            });
        }

        const passwordPattern =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

        if (!passwordPattern.test(password)) {
            return res.status(400).json({
                message:
                    "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character",
            });
        }

        const phonePattern = /^[6-9]\d{9}$/;

        if (!phonePattern.test(phone)) {
            return res.status(400).json({
                message: "Please enter a valid 10-digit phone number",
            });
        }

        const user = await registerUserService({
            name,
            email,
            phone,
            password,
        });

        return res.status(201).json({
            message: "Registration successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isEmailVerified: user.isEmailVerified,
            },
        });
    } catch (error) {
        console.error("Register user error:", error);

        return res.status(400).json({
            message: error.message,
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim(),
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        await PasswordResetToken.deleteMany({
            user: user._id,
        });

        const passwordResetToken = await PasswordResetToken.create({
            user: user._id,
            token: resetToken,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });

        try {
            await sendPasswordResetEmail(
                user,
                resetToken
            );
        } catch (error) {
            await PasswordResetToken.deleteOne({
                _id: passwordResetToken._id,
            });

            throw new Error(
                `Password reset email could not be sent. ${error.message}`
            );
        }

        return res.json({
            message:
                "Password reset link sent successfully. Please check your email.",
        });
    } catch (error) {
        console.error("Forgot password error:", error);

        return res.status(400).json({
            message: error.message,
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                message: "Token and new password are required",
            });
        }

        const passwordPattern =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

        if (!passwordPattern.test(newPassword)) {
            return res.status(400).json({
                message:
                    "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character",
            });
        }

        const resetToken = await findResetToken(token);

        await resetUserPassword(
            resetToken.user,
            newPassword
        );

        await PasswordResetToken.deleteOne({
            _id: resetToken._id,
        });

        return res.json({
            message: "Password reset successfully",
        });
    } catch (error) {
        console.error("Reset password error:", error);

        return res.status(400).json({
            message: error.message,
        });
    }
};

const adminLoginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const user = await adminLogin(email, password);

        // Verified admins can enter the dashboard directly.
        if (user.isEmailVerified === true) {
            const token = createToken(user);

            return res.status(200).json({
                message: "Admin login successful.",
                requiresOtp: false,
                token,
                admin: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        }

        // Unverified admins must complete OTP verification.
        return res.status(200).json({
            message:
                "Please check your email for the OTP to complete admin login.",
            requiresOtp: true,
            admin: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Admin login error:", error);

        return res.status(401).json({
            message: error.message,
        });
    }
};

const customerLoginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const user = await customerLogin(email, password);
        const token = createToken(user);

        return res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
            },
        });
    } catch (error) {
        return res.status(401).json({
            message: error.message,
        });
    }
};

const getCustomerProfile = async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({
                message: "Access denied. Customer account required.",
            });
        }

        const user = await User.findById(req.user.userId)
            .select("name email phone role");

        if (!user) {
            return res.status(404).json({
                message: "Customer not found",
            });
        }

        return res.status(200).json({
            message: "Profile retrieved successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Get customer profile error:", error);

        return res.status(500).json({
            message: "Failed to retrieve customer profile",
        });
    }
};

const updateCustomerProfile = async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({
                message: "Access denied. Customers only.",
            });
        }

        const user = await updateCustomerProfileService(
            req.user.userId,
            req.body
        );

        return res.status(200).json({
            message: "Profile updated successfully.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Update customer profile error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "That email address is already registered.",
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: "Please check the profile information.",
            });
        }

        return res.status(400).json({
            message:
                error.message ||
                "Failed to update profile.",
        });
    }
};

const changeCustomerPasswordUser = async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({
                message: "Access denied. Customers only.",
            });
        }

        const {
            currentPassword,
            newPassword,
        } = req.body;

        await changeCustomerPassword(
            req.user.userId,
            currentPassword,
            newPassword
        );

        return res.status(200).json({
            message: "Password changed successfully.",
        });
    } catch (error) {
        console.error(
            "Change customer password error:",
            error
        );

        return res.status(400).json({
            message:
                error.message ||
                "Failed to change password.",
        });
    }
};

const verifyAdminOtpUser = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required",
            });
        }

        const user = await verifyAdminOtp(
            email,
            otp
        );

        const token = createToken(user);

        return res.json({
            message:
                "Admin OTP verified successfully",
            token,
            admin: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error(
            "Verify admin OTP error:",
            error
        );

        return res.status(401).json({
            message: error.message,
        });
    }
};

module.exports = {
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
};