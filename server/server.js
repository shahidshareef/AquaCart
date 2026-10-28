
require("dotenv").config();

const connectDB = require("./config/db.js");
connectDB();

const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
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
const reviewRoutes = require("./routes/reviewRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");
const contactRoutes = require("./routes/contactRoutes");
const adminContactRoutes = require("./routes/adminContactRoutes");
const walletRoutes = require("./routes/walletRoutes");

const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");

const app = express();

app.use("/api/health", healthRoutes);

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);

app.use(
    "/api/admin",
    authMiddleware,
    roleMiddleware("admin"),
    adminDashboardRoutes
);

app.use(
    "/api/admin/categories",
    authMiddleware,
    roleMiddleware("admin"),
    categoryRoutes
);

app.use(
    "/api/admin/products",
    authMiddleware,
    roleMiddleware("admin"),
    productRoutes
);

app.use(
    "/api/admin/products",
    authMiddleware,
    roleMiddleware("admin"),
    productVariantRoutes
);

app.use(
    "/api/admin/inventory",
    authMiddleware,
    roleMiddleware("admin"),
    inventoryRoutes
);

app.use(
    "/api/admin/coupons",
    authMiddleware,
    roleMiddleware("admin"),
    couponRoutes
);

app.use(
    "/api/admin/orders",
    authMiddleware,
    roleMiddleware("admin"),
    orderRoutes
);

app.use(
    "/api/admin/customers",
    authMiddleware,
    roleMiddleware("admin"),
    customerRoutes
);

app.use(
    "/api/admin/profile",
    authMiddleware,
    roleMiddleware("admin"),
    adminProfileRoutes
);

app.use("/api/products", customerProductRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/contact", contactRoutes);

app.use(
    "/api/admin/contact-messages",
    authMiddleware,
    roleMiddleware("admin"),
    adminContactRoutes
);

// Customer wallet: balance and transaction history.
app.use(
    "/api/wallet",
    authMiddleware,
    roleMiddleware("customer"),
    walletRoutes
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`AquaCart server is running on port: ${PORT}`);
});
