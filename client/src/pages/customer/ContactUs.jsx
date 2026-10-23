import { useState } from "react";
import Header from "../../components/common/Header.jsx";
import Footer from "../../components/common/Footer.jsx";
import "../../styles/ContactUs.css";

const API_BASE_URL = "http://localhost:5000";

const initialForm = {
    name: "",
    email: "",
    subject: "",
    category: "general",
    orderReference: "",
    message: "",
};

function ContactUs() {
    const [form, setForm] = useState(initialForm);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState({ type: "", text: "" });

    function handleChange(event) {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        setFeedback({ type: "", text: "" });

        try {
            const response = await fetch(`${API_BASE_URL}/api/contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.message || "Your message could not be submitted.");
            }

            setFeedback({
                type: "success",
                text: result.message || "Your message has been sent to the AquaCart support team.",
            });
            setForm(initialForm);
        } catch (error) {
            setFeedback({
                type: "error",
                text: error.message || "Something went wrong. Please try again.",
            });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <Header />
            <main className="contact-page">
                <section className="contact-intro">
                    <span className="contact-eyebrow">WE'RE HERE TO HELP</span>
                    <h1>Let's talk.</h1>
                    <p>Questions about a product, an order, or something else? Send a message and the AquaCart admin team can review it from the contact inbox.</p>
                    <div className="contact-help-note">
                        <span aria-hidden="true">✉</span>
                        <div>
                            <strong>Your message goes to our support inbox</strong>
                            <p>We save your message securely in the store database so the admin team can follow up.</p>
                        </div>
                    </div>
                </section>

                <section className="contact-form-panel">
                    <div className="contact-form-heading">
                        <span>CONTACT FORM</span>
                        <h2>How can we help?</h2>
                        <p>Fields marked with * are required.</p>
                    </div>

                    {feedback.text && (
                        <div className={`contact-feedback ${feedback.type}`} role="status">
                            {feedback.text}
                        </div>
                    )}

                    <form className="contact-form" onSubmit={handleSubmit}>
                        <div className="contact-field-grid">
                            <label>
                                Your name *
                                <input name="name" value={form.name} onChange={handleChange} required minLength={2} maxLength={80} autoComplete="name" placeholder="Enter your name" />
                            </label>
                            <label>
                                Email address *
                                <input type="email" name="email" value={form.email} onChange={handleChange} required maxLength={254} autoComplete="email" placeholder="you@example.com" />
                            </label>
                            <label>
                                What is this about? *
                                <select name="category" value={form.category} onChange={handleChange} required>
                                    <option value="general">General question</option>
                                    <option value="order">Order or delivery</option>
                                    <option value="product">Product question</option>
                                    <option value="return">Return or warranty</option>
                                    <option value="payment">Payment issue</option>
                                    <option value="technical">Website problem</option>
                                    <option value="other">Other</option>
                                </select>
                            </label>
                            <label>
                                Order reference <span className="contact-optional">(optional)</span>
                                <input name="orderReference" value={form.orderReference} onChange={handleChange} maxLength={80} placeholder="e.g. order number" />
                            </label>
                        </div>
                        <label>
                            Subject *
                            <input name="subject" value={form.subject} onChange={handleChange} required minLength={3} maxLength={120} placeholder="A short summary of your issue" />
                        </label>
                        <label>
                            Message *
                            <textarea name="message" value={form.message} onChange={handleChange} required minLength={10} maxLength={3000} rows={6} placeholder="Tell us what happened and how we can help…" />
                            <span className="contact-character-count">{form.message.length}/3000 characters</span>
                        </label>
                        <button className="contact-submit-button" type="submit" disabled={submitting}>
                            {submitting ? "Sending message…" : "Send message"}
                            {!submitting && <span aria-hidden="true">→</span>}
                        </button>
                    </form>
                </section>
            </main>
            <Footer />
        </>
    );
}

export default ContactUs;
