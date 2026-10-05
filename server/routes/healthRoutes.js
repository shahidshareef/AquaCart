const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();
router.get("/", (req, res) => {
    res.json({
        message: "AquaCart API is running"
    });
});
module.exports = router;