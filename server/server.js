require('dotenv').config();
const connectDB  = require("./config/db.js")
connectDB();

const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes")
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const productVariantRoutes = require("./routes/productVariantRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const couponRoutes = require("./routes/couponRoutes");
const orderRoutes = require("./routes/orderRoutes");
const customerRoutes = require("./routes/customerRoutes");
const adminProfileRoutes = require("./routes/adminProfileRoutes");
const customerProductRoutes = require("./routes/customerProductRoutes");
const cartRoutes = require("./routes/cartRoutes");
const addressRoutes = require("./routes/addressRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const paymentRoutes = require("./routes/paymentRoutes");


const app = express();
    app.use("/api/health", healthRoutes);
    app.use(cors());
    app.use(express.json());
    app.use("/uploads", express.static("uploads"));
    app.use("/api/auth/", authRoutes)
    app.use("/api/admin", adminDashboardRoutes);
    app.use("/api/admin/categories", categoryRoutes);
    app.use("/api/admin/products", productRoutes);
    app.use("/api/admin/products", productVariantRoutes);
    app.use("/api/admin/inventory", inventoryRoutes);
    app.use("/api/admin/coupons", couponRoutes);
    app.use("/api/admin/orders", orderRoutes);
    app.use("/api/admin/customers", customerRoutes);
    app.use("/api/admin/profile", adminProfileRoutes);
    app.use("/api/products", customerProductRoutes);
    app.use("/api/cart", cartRoutes);
    app.use("/api/addresses", addressRoutes);
    app.use("/api/checkout", checkoutRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/payments", paymentRoutes);

    
const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{
    console.log(`AquaCart server is running on port: ${PORT}`)
})