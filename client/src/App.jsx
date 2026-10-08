import { BrowserRouter, Routes, Route } from "react-router-dom";
//user
import Register from "./pages/customer/Register";
import Login from "./pages/customer/Login";
import EmailVerification from "./pages/customer/EmailVerification";
import ForgotPassword from "./pages/customer/ForgotPassword";
import SetNewPassword from "./pages/customer/SetNewPassword";
import Home from "./pages/customer/Home";
import CustomerProducts  from "./pages/customer/Products";
import ProductDetails from "./pages/customer/ProductDetails";
import Cart from "./pages/customer/Cart";


//admin
import AdminLogin from "./pages/admin/AdminLogin";
import AdminOtpVerification from "./pages/admin/AdminOtpVerification";
import AdminSetNewPassword from "./pages/admin/AdminSetNewPassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Categories from "./pages/admin/Categories";
import Products from "./pages/admin/Products";
import AddProduct from "./pages/admin/AddProduct";
import EditProduct from "./pages/admin/EditProduct";
import Inventory from "./pages/admin/Inventory";
import Coupons from "./pages/admin/Coupons";
import Orders from "./pages/admin/Orders";
import Customers from "./pages/admin/Customers";
import AdminProfile from "./pages/admin/AdminProfile";

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
        <Route path="/products" element={<CustomerProducts  />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/verify-otp" element={<AdminOtpVerification />}/>
        <Route path="/admin/set-new-password" element={<AdminSetNewPassword />}/>
        <Route path="/admin/dashboard" element={<AdminDashboard />}/>
        <Route path="/admin/categories" element={<Categories />} />
        <Route path="/admin/products" element={<Products />} />
        <Route path="/admin/products/add" element={<AddProduct />} />
        <Route path="/admin/products/edit/:id" element={<EditProduct />}/>
        <Route path="/admin/inventory" element={<Inventory />}/>
        <Route path="/admin/coupons" element={<Coupons />}/>
        <Route path="/admin/orders" element={<Orders />}/>
        <Route path="/admin/customers" element={<Customers />}/>
        <Route path="/admin/profile" element={<AdminProfile />}/>
    </Routes>
</BrowserRouter>
    );
}

export default App;