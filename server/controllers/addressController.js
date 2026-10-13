const {
    getUserAddresses,
    createAddress,
    updateAddress,
    deleteAddress
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
        console.error("Get addresses error:", error);

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
            !fullName?.trim() ||
            !phone?.trim() ||
            !addressLine?.trim() ||
            !city?.trim() ||
            !state?.trim() ||
            !pincode?.trim()
        ) {
            return res.status(400).json({
                message: "All address fields are required"
            });
        }

        const address = await createAddress(userId, {
            fullName: fullName.trim(),
            phone: phone.trim(),
            addressLine: addressLine.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim(),
            isDefault: isDefault === true
        });

        return res.status(201).json({
            message: "Address created successfully",
            data: address
        });
    } catch (error) {
        console.error("Create address error:", error);

        return res.status(500).json({
            message: "Failed to create address"
        });
    }
}

async function updateAddressController(req, res) {
    try {
        const userId = req.user.userId;
        const addressId = req.params.id;

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
            !fullName?.trim() ||
            !phone?.trim() ||
            !addressLine?.trim() ||
            !city?.trim() ||
            !state?.trim() ||
            !pincode?.trim()
        ) {
            return res.status(400).json({
                message: "All address fields are required"
            });
        }

        const address = await updateAddress(userId, addressId, {
            fullName: fullName.trim(),
            phone: phone.trim(),
            addressLine: addressLine.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim(),
            isDefault
        });

        if (!address) {
            return res.status(404).json({
                message: "Address not found"
            });
        }

        return res.status(200).json({
            message: "Address updated successfully",
            data: address
        });
    } catch (error) {
        console.error("Update address error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid address ID"
            });
        }

        return res.status(500).json({
            message: "Failed to update address"
        });
    }
}

async function deleteAddressController(req, res) {
    try {
        const userId = req.user.userId;
        const addressId = req.params.id;

        const address = await deleteAddress(userId, addressId);

        if (!address) {
            return res.status(404).json({
                message: "Address not found"
            });
        }

        return res.status(200).json({
            message: "Address deleted successfully",
            data: address
        });
    } catch (error) {
        console.error("Delete address error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid address ID"
            });
        }

        if (
            error.code === "DEFAULT_ADDRESS_CANNOT_BE_DELETED" ||
            error.code === "LAST_ADDRESS_CANNOT_BE_DELETED"
        ) {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Failed to delete address"
        });
    }
}

module.exports = {
    getAddressesController,
    createAddressController,
    updateAddressController,
    deleteAddressController
};