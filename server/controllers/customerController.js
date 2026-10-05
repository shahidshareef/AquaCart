const {
    getAllCustomers,
    getCustomerById,
    updateCustomerStatus
} = require("../services/customerService");

async function getCustomers(req, res) {
    try {
        const customers = await getAllCustomers();

        res.status(200).json({
            message: "Customers fetched successfully",
            data: customers
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to fetch customers"
        });
    }
}

async function getCustomerByIdController(req, res) {
    try {
        const { id } = req.params;

        const customer = await getCustomerById(id);

        if (!customer) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        res.status(200).json({
            message: "Customer fetched successfully",
            data: customer
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to fetch customer"
        });
    }
}

async function updateCustomerStatusController(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                message: "Customer status is required"
            });
        }

        const allowedStatuses = ["active", "blocked"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid customer status"
            });
        }

        const customer = await updateCustomerStatus(
            id,
            status
        );

        if (!customer) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        res.status(200).json({
            message: "Customer status updated successfully",
            data: customer
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to update customer status"
        });
    }
}

module.exports = {
    getCustomers,
    getCustomerByIdController,
    updateCustomerStatusController
};