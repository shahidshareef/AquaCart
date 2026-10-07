import { NavLink } from "react-router-dom";
import "../../styles/Common.css";

function Footer() {
    return (
        <footer className="footer">

            <div className="footer-main">

                {/* Brand */}
                <div className="footer-brand">
                    <NavLink to="/" className="footer-logo">
                        <span className="footer-logo-icon">💧</span>
                        AquaCart
                    </NavLink>

                    <p>
                        Premium steel water bottles engineered for everyday
                        life. Double-walled vacuum insulation keeping your
                        water pristine and glacier-cold.
                    </p>
                </div>


                {/* Quick Links */}
                <div className="footer-column">
                    <h3>QUICK LINKS</h3>

                    <NavLink to="/">Home</NavLink>
                    <NavLink to="/products">Products</NavLink>
                    <NavLink to="/about">Our Story</NavLink>
                    <NavLink to="/sustainability">Sustainability</NavLink>
                </div>


                {/* Customer Care */}
                <div className="footer-column">
                    <h3>CUSTOMER CARE</h3>

                    <a href="#contact">Contact Us</a>
                    <a href="#shipping">Shipping Policy</a>
                    <a href="#returns">Returns & Warranty</a>
                    <a href="#faq">FAQ</a>
                </div>


                {/* Newsletter */}
                <div className="footer-newsletter">
                    <h3>HYDRATION INTELLIGENCE</h3>

                    <p>
                        Subscribe for exclusive vessel drops, limited
                        colorways, and thermal performance updates.
                    </p>

                    <form className="newsletter-form">
                        <input
                            type="email"
                            placeholder="Enter your email address"
                            aria-label="Email address"
                        />

                        <button type="submit">
                            Join
                        </button>
                    </form>
                </div>

            </div>


            {/* Legal / Copyright */}
            <div className="footer-bottom">

                <p>
                    © 2025 AquaCart Inc. All rights reserved.
                </p>

                <div className="footer-legal-links">
                    <a href="#terms">Terms of Service</a>
                    <a href="#privacy">Privacy Policy</a>
                </div>

            </div>

        </footer>
    );
}

export default Footer;