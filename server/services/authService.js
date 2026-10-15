const User = require("../models/User");
const bcrypt = require("bcryptjs");
const PasswordResetToken = require("../models/PasswordResetToken");

const passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

const registerUser = async (userData) => {
    const name = userData.name.trim();
    const phone = userData.phone.trim();
    const email = userData.email.toLowerCase().trim();

    const existingUser = await User.findOne({ email });

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
        passwordHash: hashedPassword,
    });

    const otp = generateEmailOtp();

    user.emailVerificationOtp = otp;
    user.emailVerificationOtpExpiresAt =
        new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    return user;
};

const generateEmailOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const resendEmailOtp = async (email) => {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

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
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const findResetToken = async (token) => {
    const resetToken = await PasswordResetToken.findOne({ token });

    if (!resetToken) {
        throw new Error("Invalid or expired reset token");
    }

    if (new Date() > resetToken.expiresAt) {
        throw new Error("Reset token has expired");
    }

    return resetToken;
};

const resetUserPassword = async (userId, newPassword) => {
    if (!passwordPattern.test(newPassword)) {
        throw new Error(
            "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character"
        );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(userId, {
        passwordHash: hashedPassword,
    });
};

const adminLogin = async (email, password) => {
    const user = await User.findOne({
        email: email.toLowerCase().trim(),
    });

    if (!user || user.role !== "admin") {
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
        email: email.toLowerCase().trim(),
    });

    if (!user || user.role !== "customer") {
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
        email: email.toLowerCase().trim(),
    });

    if (!user || user.role !== "admin") {
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

// Update a customer's name, phone number, and email.
const updateCustomerProfile = async (
    userId,
    { name, phone, email, currentPassword }
) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error("Customer not found.");
    }

    if (user.role !== "customer") {
        throw new Error("Customers only.");
    }

    if (typeof name !== "string" || !name.trim()) {
        throw new Error("Full name is required.");
    }

    if (typeof phone !== "string" || !phone.trim()) {
        throw new Error("Phone number is required.");
    }

    if (typeof email !== "string" || !email.trim()) {
        throw new Error("Email address is required.");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
        throw new Error("Please enter a valid email address.");
    }

    const emailIsChanging = normalizedEmail !== user.email;

    // Require the current password only when the email is changing.
    if (emailIsChanging) {
        if (
            typeof currentPassword !== "string" ||
            !currentPassword
        ) {
            throw new Error(
                "Enter your current password to change your email."
            );
        }

        const passwordIsCorrect = await bcrypt.compare(
            currentPassword,
            user.passwordHash
        );

        if (!passwordIsCorrect) {
            throw new Error("Your current password is incorrect.");
        }

        const existingUser = await User.findOne({
            email: normalizedEmail,
            _id: { $ne: user._id },
        });

        if (existingUser) {
            throw new Error(
                "That email address is already registered."
            );
        }

        user.email = normalizedEmail;
    }

    user.name = name.trim();
    user.phone = phone.trim();

    await user.save();

    return user;
};

// Change a customer's password after verifying their current password.
const changeCustomerPassword = async (
    userId,
    currentPassword,
    newPassword
) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error("Customer not found.");
    }

    if (user.role !== "customer") {
        throw new Error("Customers only.");
    }

    if (!currentPassword || !newPassword) {
        throw new Error(
            "Current password and new password are required."
        );
    }

    const passwordIsCorrect = await bcrypt.compare(
        currentPassword,
        user.passwordHash
    );

    if (!passwordIsCorrect) {
        throw new Error("Your current password is incorrect.");
    }

    if (!passwordPattern.test(newPassword)) {
        throw new Error(
            "New password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character."
        );
    }

    const isSamePassword = await bcrypt.compare(
        newPassword,
        user.passwordHash
    );

    if (isSamePassword) {
        throw new Error(
            "Your new password must be different from your current password."
        );
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);

    await user.save();
};

module.exports = {
    registerUser,
    generateEmailOtp,
    generateAdminOtp,
    resetUserPassword,
    findResetToken,
    resendEmailOtp,
    adminLogin,
    verifyAdminOtp,
    customerLogin,
    updateCustomerProfile,
    changeCustomerPassword,
};