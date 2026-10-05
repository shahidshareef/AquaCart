const User = require("../models/User");
const bcrypt = require("bcryptjs");
const PasswordResetToken = require("../models/PasswordResetToken");

const registerUser = async (userData) => {
    const name = userData.name.trim();
    const phone = userData.phone.trim();
    const email = userData.email.toLowerCase().trim();
    const existingUser = await User.findOne({
        email: userData.email
    });

    if (existingUser) {
        if (existingUser.status === "blocked") {
            throw new Error("This account is blocked");
        }

        throw new Error("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await User.create({
        name,
        email,
        phone,
        passwordHash: hashedPassword
    });

    const otp = generateEmailOtp();

    user.emailVerificationOtp = otp;
    user.emailVerificationOtpExpiresAt =
        new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    return user;

};
const generateEmailOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
}

const resendEmailOtp = async (email) => {
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error("User not found, please register");
    }

    if (user.isEmailVerified) {
        throw new Error("Email is already verified");
    }

    const otp = generateEmailOtp();

    user.emailVerificationOtp = otp;
    user.emailVerificationOtpExpiresAt =
        new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    return user;
};

const generateAdminOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
};

const findResetToken = async (token) => {
    const resetToken = await PasswordResetToken.findOne({
        token
    });

    if (!resetToken) {
        throw new Error("Invalid or expired reset token");
    }

    if (new Date() > resetToken.expiresAt) {
        throw new Error("Reset token has expired");
    }

    return resetToken;
};
const resetUserPassword = async (userId, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(userId, {
        passwordHash: hashedPassword
    });
};

const adminLogin = async (email, password) => {
    const user = await User.findOne({
        email: email.toLowerCase().trim()
    });

    if (!user) {
        throw new Error("Invalid email or password");
    }

    if (user.role !== "admin") {
        throw new Error("Invalid email or password");
    }

    if (user.status === "blocked") {
        throw new Error("This account is blocked");
    }

    const isPasswordCorrect = await bcrypt.compare(
        password,
        user.passwordHash
    );

    if (!isPasswordCorrect) {
        throw new Error("Invalid email or password");
    }

    const otp = generateAdminOtp();

    user.adminOtp = otp;
    user.adminOtpExpiresAt =
        new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    return user;
};

const customerLogin = async (email, password) => {
    const user = await User.findOne({
        email: email.toLowerCase().trim()
    });

    if (!user) {
        throw new Error("Invalid email or password");
    }

    if (user.role !== "customer") {
        throw new Error("Invalid email or password");
    }

    if (user.status === "blocked") {
        throw new Error("This account is blocked");
    }

    if (!user.isEmailVerified) {
        throw new Error("Please verify your email first");
    }

    const isPasswordCorrect = await bcrypt.compare(
        password,
        user.passwordHash
    );

    if (!isPasswordCorrect) {
        throw new Error("Invalid email or password");
    }

    return user;
};

const verifyAdminOtp = async (email, otp) => {
    const user = await User.findOne({
        email: email.toLowerCase().trim()
    });

    if (!user) {
        throw new Error("Invalid OTP");
    }

    if (user.role !== "admin") {
        throw new Error("Invalid OTP");
    }

    if (!user.adminOtp || !user.adminOtpExpiresAt) {
        throw new Error("OTP not found");
    }

    if (new Date() > user.adminOtpExpiresAt) {
        throw new Error("OTP has expired");
    }

    if (otp !== user.adminOtp) {
        throw new Error("Invalid OTP");
    }

    user.adminOtp = undefined;
    user.adminOtpExpiresAt = undefined;

    await user.save();

    return user;
};

module.exports = { registerUser, generateEmailOtp, generateAdminOtp, resetUserPassword, findResetToken, resendEmailOtp, adminLogin, verifyAdminOtp, customerLogin }; 