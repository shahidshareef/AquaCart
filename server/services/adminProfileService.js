const User = require("../models/User");
const bcrypt = require("bcryptjs");

async function getAdminProfile() {
    return User.findOne({
        role: "admin"
    }).select("name email phone role status");
}

async function updateAdminProfile(profileData) {
    return User.findOneAndUpdate(
        {
            role: "admin"
        },
        {
            name: profileData.name,
            email: profileData.email,
            phone: profileData.phone
        },
        {
            new: true,
            runValidators: true
        }
    ).select("name email phone role status");
}

async function changeAdminPassword(
    currentPassword,
    newPassword
) {
    const admin = await User.findOne({
        role: "admin"
    });

    if (!admin) {
        return {
            success: false,
            message: "Admin profile not found"
        };
    }

    const isPasswordCorrect = await bcrypt.compare(
        currentPassword,
        admin.passwordHash
    );

    if (!isPasswordCorrect) {
        return {
            success: false,
            message: "Current password is incorrect"
        };
    }

    const passwordHash = await bcrypt.hash(
        newPassword,
        10
    );

    admin.passwordHash = passwordHash;

    await admin.save();

    return {
        success: true,
        message: "Admin password changed successfully"
    };
}

module.exports = {
    getAdminProfile,
    updateAdminProfile,
    changeAdminPassword
};