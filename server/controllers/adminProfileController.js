const {
    getAdminProfile,
    updateAdminProfile,
    changeAdminPassword
} = require("../services/adminProfileService");

async function getAdminProfileController(req, res) {
    try {
        const admin = await getAdminProfile();

        if (!admin) {
            return res.status(404).json({
                message: "Admin profile not found"
            });
        }

        res.status(200).json({
            message: "Admin profile fetched successfully",
            data: admin
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to fetch admin profile"
        });
    }
}

async function updateAdminProfileController(req, res) {
    try {
        const { name, email, phone } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({
                message: "Name, email, and phone are required"
            });
        }

        const admin = await updateAdminProfile({
            name,
            email,
            phone
        });

        if (!admin) {
            return res.status(404).json({
                message: "Admin profile not found"
            });
        }

        res.status(200).json({
            message: "Admin profile updated successfully",
            data: admin
        });

    } catch (error) {
        console.log(error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email already exists"
            });
        }

        res.status(500).json({
            message: "Failed to update admin profile"
        });
    }
}

async function changeAdminPasswordController(req, res) {
    try {
        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body;

        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {
            return res.status(400).json({
                message: "All password fields are required"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "New password and confirm password do not match"
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                message: "New password must be at least 8 characters"
            });
        }

        const result = await changeAdminPassword(
            currentPassword,
            newPassword
        );

        if (!result.success) {
            return res.status(400).json({
                message: result.message
            });
        }

        res.status(200).json({
            message: result.message
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to change admin password"
        });
    }
}

module.exports = {
    getAdminProfileController,
    updateAdminProfileController,
    changeAdminPasswordController
};