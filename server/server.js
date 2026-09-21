require('dotenv').config();
const connectDB  = require("./config/db.js")
connectDB();

const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes")

const app = express();
    app.use("/api/health", healthRoutes);
    app.use(cors());
    app.use(express.json());
    app.use("/api/auth/", authRoutes)

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{
    console.log(`AquaCart server is running on port: ${PORT}`)
})