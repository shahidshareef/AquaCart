import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../../styles/Common.css";

function Header() {
    const navigate = useNavigate();

    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem("user");

        return storedUser ? JSON.parse(storedUser) : null;
    });

    useEffect(() => {
        const updateUser = () => {
            const storedUser = localStorage.getItem("user");

            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (error) {
                    console.error("Failed to read stored user:", error);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        };

        // Sync when the profile is updated in this tab.
        window.addEventListener("userUpdated", updateUser);

        // Sync when localStorage changes in another browser tab.
        window.addEventListener("storage", updateUser);

        return () => {
            window.removeEventListener("userUpdated", updateUser);
            window.removeEventListener("storage", updateUser);
        };
    }, []);

    return (
        <header className="header">
            <div className="header-container">
                <NavLink to="/" className="logo">
                    <span className="logo-icon">💧</span>
                    AquaCart
                </NavLink>

                <nav className="header-navigation">
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            isActive
                                ? "header-nav-link active"
                                : "header-nav-link"
                        }
                    >
                        Home
                    </NavLink>

                    <NavLink to="/products" className="header-nav-link">
                        Products
                    </NavLink>

                    <NavLink to="/reviews" className="header-nav-link">
                        Reviews
                    </NavLink>

                    <NavLink to="/about" className="header-nav-link">
                        About
                    </NavLink>

                    
                </nav>

                <div className="header-actions">
                    <button
                        type="button"
                        className="header-search-button"
                        aria-label="Search products"
                        onClick={() => navigate("/products")}
                    >
                        🔍
                    </button>

                    <button
                        type="button"
                        className="header-cart-button"
                        onClick={() => navigate("/cart")}
                    >
                        🛍 Cart
                    </button>

                    {user ? (
                        <button
                            type="button"
                            className="header-signin-button"
                            onClick={() => navigate("/profile")}
                        >
                            👤 {user.name}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="header-signin-button"
                            onClick={() => navigate("/login")}
                        >
                            👤 Sign In
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;