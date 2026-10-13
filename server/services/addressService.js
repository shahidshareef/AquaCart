const Address = require("../models/Address");

async function getUserAddresses(userId) {
    return Address.find({
        user: userId
    }).sort({
        isDefault: -1,
        createdAt: -1
    });
}

async function createAddress(userId, addressData) {
    // Check whether this customer already has an address.
    const addressCount = await Address.countDocuments({
        user: userId
    });

    // The first address automatically becomes the default.
    const shouldBeDefault =
        addressData.isDefault === true || addressCount === 0;

    // If this address will be the default, unset the previous default.
    if (shouldBeDefault) {
        await Address.updateMany(
            { user: userId },
            { $set: { isDefault: false } }
        );
    }

    const address = new Address({
        ...addressData,
        user: userId,
        isDefault: shouldBeDefault
    });

    return address.save();
}

async function updateAddress(userId, addressId, addressData) {
    // Find the address and verify that it belongs to this customer.
    const address = await Address.findOne({
        _id: addressId,
        user: userId
    });

    if (!address) {
        return null;
    }

    const allowedFields = [
        "fullName",
        "phone",
        "addressLine",
        "city",
        "state",
        "pincode"
    ];

    // Update only the permitted address details.
    allowedFields.forEach((field) => {
        if (addressData[field] !== undefined) {
            address[field] = addressData[field];
        }
    });

    // A customer can make this address the default.
    // The previous default will become a normal address.
    if (addressData.isDefault === true) {
        await Address.updateMany(
            {
                user: userId,
                _id: { $ne: addressId }
            },
            {
                $set: { isDefault: false }
            }
        );

        address.isDefault = true;
    }

    // Do not allow the current default to be unchecked directly.
    // The customer must select another address as the default instead.
    if (
        addressData.isDefault === false &&
        address.isDefault !== true
    ) {
        address.isDefault = false;
    }

    return address.save();
}

async function deleteAddress(userId, addressId) {
    // Find the address and confirm that it belongs to this customer.
    const address = await Address.findOne({
        _id: addressId,
        user: userId
    });

    if (!address) {
        return null;
    }

    // The default address cannot be deleted.
    if (address.isDefault) {
        const error = new Error(
            "The default address cannot be deleted. Set another address as default first."
        );

        error.code = "DEFAULT_ADDRESS_CANNOT_BE_DELETED";
        throw error;
    }

    // A customer must always keep at least one saved address.
    const addressCount = await Address.countDocuments({
        user: userId
    });

    if (addressCount <= 1) {
        const error = new Error(
            "You must keep at least one saved address."
        );

        error.code = "LAST_ADDRESS_CANNOT_BE_DELETED";
        throw error;
    }

    // Delete only the customer's selected, non-default address.
    return Address.findOneAndDelete({
        _id: addressId,
        user: userId,
        isDefault: false
    });
}

module.exports = {
    getUserAddresses,
    createAddress,
    updateAddress,
    deleteAddress
};