const User = require("../models/User");

function getAllCustomers() {
    return User.find({
        role: "customer"
    })
        .select("name email phone status createdAt")
        .sort({ createdAt: -1 });
}

async function getCustomerById(customerId) {
    return User.findOne({
        _id: customerId,
        role: "customer"
    }).select("name email phone status createdAt");
}

async function updateCustomerStatus(customerId, status) {
    return User.findOneAndUpdate(
        {
            _id: customerId,
            role: "customer"
        },
        {
            status: status
        },
        {
            new: true,
            runValidators: true
        }
    ).select("name email phone status createdAt");
}

module.exports = {
    getAllCustomers,
    getCustomerById,
    updateCustomerStatus
};