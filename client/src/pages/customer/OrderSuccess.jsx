import { Link, useLocation } from "react-router-dom";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";

function OrderSuccess() {
    const location = useLocation();

    const orderId = location.state?.orderId;

    return (
        <>
            <Header />

            <main className="order-success-page">
                <div className="order-success-card">
                    <div className="order-success-icon">✓</div>

                    <h1>Order Placed Successfully!</h1>

                    <p>
                        Thank you for shopping with AquaCart.
                        Your Cash on Delivery order has been placed.
                    </p>

                    {orderId && (
                        <p className="order-success-id">
                            Order ID: <strong>{orderId}</strong>
                        </p>
                    )}

                    <div className="order-success-actions">
                        <Link to="/products">
                            Continue Shopping
                        </Link>

                        <Link to="/">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}

export default OrderSuccess;