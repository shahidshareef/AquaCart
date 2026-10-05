const express = require("express");

const {
    getAdminProfileController,
    updateAdminProfileController,
    changeAdminPasswordController
} = require("../controllers/adminProfileController");

const router = express.Router();

router.get("/", getAdminProfileController);

router.put("/", updateAdminProfileController);

router.put(
    "/password",
    changeAdminPasswordController
);

module.exports = router;