const {
    getUserAddresses,
    createAddress
} = require("../services/addressService");

async function getAddressesController(req, res) {
    try {
        const userId = req.user.userId;

        const addresses = await getUserAddresses(userId);

        return res.status(200).json({
            message: "Addresses fetched successfully",
            data: addresses
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to fetch addresses"
        });
    }
}

async function createAddressController(req, res) {
    try {
        const userId = req.user.userId;

        const {
            fullName,
            phone,
            addressLine,
            city,
            state,
            pincode,
            isDefault
        } = req.body;

        if (
            !fullName ||
            !phone ||
            !addressLine ||
            !city ||
            !state ||
            !pincode
        ) {
            return res.status(400).json({
                message: "All address fields are required"
            });
        }

        const address = await createAddress(userId, {
            fullName,
            phone,
            addressLine,
            city,
            state,
            pincode,
            isDefault
        });

        return res.status(201).json({
            message: "Address created successfully",
            data: address
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to create address"
        });
    }
}

module.exports = {
    getAddressesController,
    createAddressController
};