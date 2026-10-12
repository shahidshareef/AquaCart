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
    const address = new Address({
        user: userId,
        ...addressData
    });

    return address.save();
}

module.exports = {
    getUserAddresses,
    createAddress
};