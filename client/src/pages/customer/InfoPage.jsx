import { useLocation, Link } from "react-router-dom";
import Header from "../../components/common/Header.jsx";
import Footer from "../../components/common/Footer.jsx";
import "../../styles/InfoPages.css";

const pages = {
    "/about": {
        eyebrow: "ABOUT AQUACART",
        title: "A simpler way to think about everyday hydration.",
        intro: "AquaCart is an e-commerce project built around reusable stainless-steel water bottles and a straightforward online shopping experience.",
        sections: [
            { title: "What this project is about", body: "The project brings together product discovery, product details, a shopping cart, checkout, orders, customer reviews, and customer support in one connected store experience." },
            { title: "Designed around everyday use", body: "The store concept focuses on reusable bottles that fit into daily routines at work, in class, while travelling, and at home." },
            { title: "Built with care", body: "AquaCart is also a full-stack development project. Its customer and admin experiences are designed to make browsing, ordering, and managing store activity clear and practical." }
        ],
        closing: "Thanks for taking a look at AquaCart. Explore the collection or send us a message if you have a question.",
        action: "Explore products",
        actionTo: "/products"
    },
    "/sustainability": {
        eyebrow: "THOUGHTFUL EVERYDAY CHOICES",
        title: "Small habits can make a difference.",
        intro: "AquaCart highlights reusable drinkware as one practical alternative to relying on disposable bottles every day.",
        sections: [
            { title: "Reuse more often", body: "Carrying a refillable bottle can help reduce the need to buy single-use drink bottles when suitable refill points are available." },
            { title: "Choose products that last", body: "Reusable stainless-steel drinkware is designed for repeated use. Follow the care instructions for your bottle to help keep it in good condition." },
            { title: "Be realistic about impact", body: "A reusable bottle is one small step, not a complete solution on its own. How it is used, cleaned, and kept over time matters too." }
        ],
        closing: "AquaCart aims to make reusable hydration easy to discover and part of an everyday routine.",
        action: "Browse bottles",
        actionTo: "/products"
    },
    "/shipping": {
        eyebrow: "CUSTOMER CARE",
        title: "Shipping Policy",
        intro: "We want the delivery process to be clear from checkout through to arrival.",
        sections: [
            { title: "Order processing", body: "After placing an order, check your order details for the information recorded by the store. If something looks incorrect, contact us with your order reference." },
            { title: "Delivery estimates", body: "Any available delivery estimate and shipping charge should be reviewed at checkout before you place your order. Actual delivery can depend on the destination and courier service." },
            { title: "Need help with a delivery?", body: "If your order appears delayed or the delivery details need attention, send us a message through the Contact Us form and include your order reference when available." }
        ],
        closing: "For help with an order, please contact our support team.",
        action: "Contact us",
        actionTo: "/contact"
    },
    "/returns": {
        eyebrow: "CUSTOMER CARE",
        title: "Returns & Warranty",
        intro: "If there is a problem with an item, let us know so the details can be reviewed.",
        sections: [
            { title: "Report an issue", body: "Use the Contact Us form and include your order reference, the product name, and a clear description of the issue. You can explain if the item arrived damaged or differs from what you expected." },
            { title: "Product condition", body: "Keep the product and its packaging until you receive guidance. Photos of visible damage can help explain the issue when support follows up." },
            { title: "Warranty questions", body: "Warranty coverage depends on the product and the applicable terms. Contact us with the product and order details so the request can be reviewed." }
        ],
        closing: "This page provides general guidance. Please contact us for help with a specific order or product.",
        action: "Request support",
        actionTo: "/contact"
    },
    "/faq": {
        eyebrow: "HELP CENTRE",
        title: "Frequently Asked Questions",
        intro: "Quick answers to common questions about using the AquaCart store.",
        sections: [
            { title: "How do I place an order?", body: "Browse the Products page, open a product to review its details and available options, add it to your cart, and continue to checkout." },
            { title: "Where can I see my order?", body: "Sign in to your customer account and check the order-related options available in your profile or the store interface." },
            { title: "How can I ask about a product or order?", body: "Open Contact Us and submit the form with your email address and enough detail for the team to understand your question." },
            { title: "How do I subscribe to updates?", body: "Enter your email in the newsletter field in the footer and select Join. The store will save your subscription in its database." },
            { title: "Can I change my review?", body: "Review availability and moderation depend on the store's review workflow. Contact support if you need help with a submitted review." }
        ],
        closing: "Didn't find the answer you need? Send us a message and we'll have your question recorded for the admin team.",
        action: "Contact us",
        actionTo: "/contact"
    }
};

function InfoPage() {
    const { pathname } = useLocation();
    const page = pages[pathname] || pages["/about"];

    return (
        <>
            <Header />
            <main className="info-page">
                <section className="info-hero">
                    <span className="info-eyebrow">{page.eyebrow}</span>
                    <h1>{page.title}</h1>
                    <p>{page.intro}</p>
                </section>
                <section className="info-sections">
                    {page.sections.map((section) => (
                        <article className="info-section-card" key={section.title}>
                            <span className="info-section-mark" aria-hidden="true">✦</span>
                            <div>
                                <h2>{section.title}</h2>
                                <p>{section.body}</p>
                            </div>
                        </article>
                    ))}
                </section>
                <section className="info-closing">
                    <p>{page.closing}</p>
                    <Link to={page.actionTo} className="info-action">{page.action} <span aria-hidden="true">→</span></Link>
                </section>
            </main>
            <Footer />
        </>
    );
}

export default InfoPage;
