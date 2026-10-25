const express = require("express");
const { submitContactMessageController } = require("../controllers/contactController");

const router = express.Router();
router.post("/", submitContactMessageController);

module.exports = router;
