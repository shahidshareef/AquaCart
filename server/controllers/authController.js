const { registerUser: registerUserService, generateEmailOtp, findResetToken, resetUserPassword, resendEmailOtp, adminLogin, verifyAdminOtp, customerLogin } = require("../services/authService");
// Take the registerUser from the service, but call it registerUserService inside this file."
const User = require("../models/User");
const PasswordResetToken = require("../models/PasswordResetToken");
const createToken = require("../utils/jwt");

const verifyEmail = async (req, res) => {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({
            message: "User not found, please register"
        });
    }
    if (user.isEmailVerified) {
        return res.status(400).json({
            message: "Email is already verified"
        });
    }

    if (otp !== user.emailVerificationOtp) {
        return res.status(400).json({
            message: "Invalid OTP"
        });
    }
    if (new Date() > user.emailVerificationOtpExpiresAt) {
        return res.status(400).json({
            message: "OTP has expired"
        });
    }

    user.isEmailVerified = true;
    user.emailVerificationOtp = undefined;
    user.emailVerificationOtpExpiresAt = undefined;
    await user.save();

    res.json({
        message: "Email verified successfully",
    });
};

const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        await resendEmailOtp(email);

        res.json({
            message: "OTP resent successfully"
        });
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

const registerUser = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            return res.status(400).json({
                message: "Please enter a valid email"
            });
        }

        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
        if (!passwordPattern.test(password)) {
            return res.status(400).json({
                message:
                    "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character"
            });
        }

        const phonePattern = /^[6-9]\d{9}$/;
        if (!phonePattern.test(phone)) {
            return res.status(400).json({
                message: "please enter a valid 10-digit phone number"
            })
        }

        const user = await registerUserService({
            name,
            email,
            phone,
            password
        });

        res.status(201).json({
            message: "Registration successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isEmailVerified: user.isEmailVerified
            }
        });
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const resetToken = Math.random().toString(36).substring(2, 15);

        await PasswordResetToken.deleteMany({
            user: user._id
        });
        await PasswordResetToken.create({
            user: user._id,
            token: resetToken,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });

        res.json({
            message: "Password reset link sent successfully"
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};;

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                message: "Token and new password are required"
            });
        }
        const passwordPattern =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

        if (!passwordPattern.test(newPassword)) {
            return res.status(400).json({
                message:
                    "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character"
            });
        }

        const resetToken = await findResetToken(token);
        await resetUserPassword(resetToken.user, newPassword);
        await PasswordResetToken.deleteOne({
            _id: resetToken._id
        });
        res.json({
            message: "Password reset successfully"
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};


const adminLoginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await adminLogin(email, password);

        res.json({
            message: "Admin login successful",
            admin: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            otp: user.adminOtp
        });
    } catch (error) {
        res.status(401).json({
            message: error.message
        });
    }
};

const customerLoginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await customerLogin(email, password);

        const token = createToken(user);

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        res.status(401).json({
            message: error.message
        });
    }
};


const getCustomerProfile = async (req, res) => {
    try {
        // Only customers can access this profile endpoint.
        if (req.user.role !== "customer") {
            return res.status(403).json({
                message: "Access denied. Customer account required."
            });
        }

        // Get the customer ID from the verified JWT.
        const user = await User.findById(req.user.userId)
            .select("name email phone role");

        if (!user) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        // Return only the profile information needed by the frontend.
        res.status(200).json({
            message: "Profile retrieved successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve customer profile"
        });
    }
};

async function updateCustomerProfile(req, res) {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({
                message: "Access denied. Customers only."
            });
        }

        const { name, phone } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Full name is required."
            });
        }

        if (!phone || !phone.trim()) {
            return res.status(400).json({
                message: "Phone number is required."
            });
        }

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "Customer not found."
            });
        }

        user.name = name.trim();
        user.phone = phone.trim();

        await user.save();

        return res.status(200).json({
            message: "Profile updated successfully.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Update customer profile error:", error);

        return res.status(500).json({
            message: "Failed to update profile."
        });
    }
}


const verifyAdminOtpUser = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required"
            });
        }

        const user = await verifyAdminOtp(email, otp);

        const token = createToken(user);

        res.json({
            message: "Admin OTP verified successfully",
            token,
            admin: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(401).json({
            message: error.message
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
    updateCustomerProfile
};