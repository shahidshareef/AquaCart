const express = require("express");
const { subscribeController } = require("../controllers/newsletterController");

const router = express.Router();
router.post("/", subscribeController);

module.exports = router;