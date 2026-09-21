const express = require("express");
const router = express.Router();
router.get("/", (req, res)=>{
    res.json({
        message: "AquaCart api is running"
    })
})
module.exports = router;