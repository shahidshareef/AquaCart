import { BrowserRouter, Routes, Route } from "react-router-dom";

// Customer pages
import Register from "./pages/customer/Register.jsx";
import Login from "./pages/customer/Login.jsx";
import EmailVerification from "./pages/customer/EmailVerification.jsx";
import ForgotPassword from "./pages/customer/ForgotPassword.jsx";
import SetNewPassword from "./pages/customer/SetNewPassword.jsx";
import Home from "./pages/customer/Home.jsx";
import CustomerProducts from "./pages/customer/Products.jsx";
import ProductDetails from "./pages/customer/ProductDetails.jsx";
import Cart from "./pages/customer/Cart.jsx";
import Checkout from "./pages/customer/Checkout.jsx";
import OrderSuccess from "./pages/customer/OrderSuccess.jsx";
import Profile from "./pages/customer/Profile.jsx";
import CustomerReviews from "./pages/customer/Reviews.jsx";
import ContactUs from "./pages/customer/ContactUs.jsx";
import InfoPage from "./pages/customer/InfoPage.jsx";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminOtpVerification from "./pages/admin/AdminOtpVerification.jsx";
import AdminSetNewPassword from "./pages/admin/AdminSetNewPassword.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import Categories from "./pages/admin/Categories.jsx";
import Products from "./pages/admin/Products.jsx";
import AddProduct from "./pages/admin/AddProduct.jsx";
import EditProduct from "./pages/admin/EditProduct.jsx";
import Inventory from "./pages/admin/Inventory.jsx";
import Coupons from "./pages/admin/Coupons.jsx";
import Orders from "./pages/admin/Orders.jsx";
import Customers from "./pages/admin/Customers.jsx";
import AdminProfile from "./pages/admin/AdminProfile.jsx";
import Reviews from "./pages/admin/Reviews.jsx";
import ContactInbox from "./pages/admin/ContactInbox.jsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/verify-email" element={<EmailVerification />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/set-new-password" element={<SetNewPassword />} />
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<CustomerProducts />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-success" element={<OrderSuccess />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/reviews" element={<CustomerReviews />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/about" element={<InfoPage />} />
                <Route path="/sustainability" element={<InfoPage />} />
                <Route path="/shipping" element={<InfoPage />} />
                <Route path="/returns" element={<InfoPage />} />
                <Route path="/faq" element={<InfoPage />} />

                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/verify-otp" element={<AdminOtpVerification />} />
                <Route path="/admin/set-new-password" element={<AdminSetNewPassword />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/categories" element={<Categories />} />
                <Route path="/admin/products" element={<Products />} />
                <Route path="/admin/products/add" element={<AddProduct />} />
                <Route path="/admin/products/edit/:id" element={<EditProduct />} />
                <Route path="/admin/inventory" element={<Inventory />} />
                <Route path="/admin/coupons" element={<Coupons />} />
                <Route path="/admin/orders" element={<Orders />} />
                <Route path="/admin/customers" element={<Customers />} />
                <Route path="/admin/profile" element={<AdminProfile />} />
                <Route path="/admin/reviews" element={<Reviews />} />
                <Route path="/admin/contact-inbox" element={<ContactInbox />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
