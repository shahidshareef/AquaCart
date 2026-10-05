import { NavLink, useNavigate } from "react-router-dom";
import "../../styles/AdminLayout.css";

function AdminLayout({ children, pageTitle = "Dashboard" }) {

    const navigate = useNavigate();

    function handleLogout() {
        localStorage.removeItem("token");
        navigate("/admin/login");
    }

    return (
        <div className="admin-layout">

            <aside className="admin-sidebar">

                <h2>AquaCart</h2>

                <nav>

                    <NavLink
                        to="/admin/dashboard"
                        className={({ isActive }) =>
                            isActive
                                ? "admin-nav-link active"
                                : "admin-nav-link"
                        }
                    >
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/admin/categories"
                        className={({ isActive }) =>
                            isActive
                                ? "admin-nav-link active"
                                : "admin-nav-link"
                        }
                    >
                        Categories
                    </NavLink>

                    <NavLink
                        to="/admin/products"
                        className={({ isActive }) =>
                            isActive
                                ? "admin-nav-link active"
                                : "admin-nav-link"
                        }
                    >
                        Products
                    </NavLink>

                    <NavLink
                        to="/admin/orders"
                        className={({ isActive }) =>
                            isActive
                                ? "admin-nav-link active"
                                : "admin-nav-link"
                        }
                    >
                        Orders
                    </NavLink>

                    <NavLink
                        to="/admin/customers"
                        className={({ isActive }) =>
                            isActive
                                ? "admin-nav-link active"
                                : "admin-nav-link"
                        }
                    >
                        Customers
                    </NavLink>

                    <NavLink
                        to="/admin/inventory"
                        className={({ isActive }) =>
                            isActive
                                ? "admin-nav-link active"
                                : "admin-nav-link"
                        }
                    >
                        Inventory
                    </NavLink>

                    <NavLink
                        to="/admin/coupons"
                        className={({ isActive }) =>
                            isActive
                                ? "admin-nav-link active"
                                : "admin-nav-link"
                        }
                    >
                        Coupons & Offers
                    </NavLink>

                    <NavLink
                        to="/admin/profile"
                        className={({ isActive }) =>
                            isActive
                                ? "admin-nav-link active"
                                : "admin-nav-link"
                        }
                    >
                        Admin Profile
                    </NavLink>

                </nav>

                <button
                    type="button"
                    className="admin-logout-button"
                    onClick={handleLogout}
                >
                    ↪ Logout
                </button>

            </aside>


            <main className="admin-main">

                <header className="admin-header">

                    <h1>{pageTitle}</h1>

                    <div>
                        <span>Admin</span>
                    </div>

                </header>


                <section className="admin-content">
                    {children}
                </section>

            </main>

        </div>
    );
}

export default AdminLayout;