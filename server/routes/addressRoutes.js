const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    getAddressesController,
    createAddressController
} = require("../controllers/addressController");

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    roleMiddleware("customer"),
    getAddressesController
);

router.post(
    "/",
    authMiddleware,
    roleMiddleware("customer"),
    createAddressController
);

module.exports = router;