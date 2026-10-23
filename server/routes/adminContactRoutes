const express = require("express");
const {
    getContactMessagesController,
    updateContactMessageStatusController
} = require("../controllers/contactController");

const router = express.Router();
router.get("/", getContactMessagesController);
router.patch("/:id/status", updateContactMessageStatusController);

module.exports = router;
