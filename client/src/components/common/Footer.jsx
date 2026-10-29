import { useState } from "react";
import { NavLink } from "react-router-dom";
import "../../styles/Common.css";
import { API_BASE_URL } from "../../config/apiConfig.js";

function Footer() {
    const [email, setEmail] = useState("");
    const [newsletterMessage, setNewsletterMessage] = useState("");
    const [newsletterMessageType, setNewsletterMessageType] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleNewsletterSubmit(event) {
        event.preventDefault();
        setNewsletterMessage("");
        setNewsletterMessageType("");
        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/newsletter`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.message || "Could not subscribe right now.");
            }

            setNewsletterMessage(result.message || "You're subscribed. Thank you!");
            setNewsletterMessageType("success");
            setEmail("");
        } catch (error) {
            setNewsletterMessage(error.message || "Could not subscribe right now. Please try again.");
            setNewsletterMessageType("error");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <footer className="footer">
            <div className="footer-main">
                <div className="footer-brand">
                    <NavLink to="/" className="footer-logo">
                        <span className="footer-logo-icon">💧</span>
                        AquaCart
                    </NavLink>
                    <p>
                        AquaCart is an e-commerce project exploring a simple, thoughtful way to shop reusable
                        stainless-steel water bottles for everyday hydration.
                    </p>
                </div>

                <div className="footer-column">
                    <h3>QUICK LINKS</h3>
                    <NavLink to="/">Home</NavLink>
                    <NavLink to="/products">Products</NavLink>
                    <NavLink to="/about">Our Story</NavLink>
                    <NavLink to="/sustainability">Sustainability</NavLink>
                </div>

                <div className="footer-column">
                    <h3>CUSTOMER CARE</h3>
                    <NavLink to="/contact">Contact Us</NavLink>
                    <NavLink to="/shipping">Shipping Policy</NavLink>
                    <NavLink to="/returns">Returns &amp; Warranty</NavLink>
                    <NavLink to="/faq">FAQ</NavLink>
                </div>

                <div className="footer-newsletter">
                    <h3>STAY IN THE LOOP</h3>
                    <p>Subscribe for AquaCart project updates and product news.</p>
                    <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
                        <input
                            type="email"
                            placeholder="Enter your email address"
                            aria-label="Email address"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            maxLength={254}
                        />
                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Joining…" : "Join"}
                        </button>
                    </form>
                    {newsletterMessage && (
                        <p className={`newsletter-feedback ${newsletterMessageType}`} role="status">
                            {newsletterMessage}
                        </p>
                    )}
                </div>
            </div>

            <div className="footer-bottom">
                <p>© {new Date().getFullYear()} AquaCart. All rights reserved.</p>
                <div className="footer-legal-links">
                    <NavLink to="/faq">Help &amp; FAQs</NavLink>
                    <NavLink to="/contact">Contact</NavLink>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
