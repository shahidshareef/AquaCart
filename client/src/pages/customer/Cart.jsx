import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";

import "../../styles/Cart.css";

function Cart() {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingItem, setUpdatingItem] = useState(null);

    const navigate = useNavigate();

    const subtotal = cart?.items?.reduce(
        (total, item) =>
            total + item.variant.price * item.quantity,
        0
    ) || 0;

    useEffect(() => {
        async function fetchCart() {
            try {
                const token = localStorage.getItem("token");

                if (!token) {
                    navigate("/login");
                    return;
                }

                const response = await fetch(
                    "http://localhost:5000/api/cart",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message);
                }

                setCart(result.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        fetchCart();
    }, [navigate]);

    async function handleQuantityChange(variantId, newQuantity) {
        try {
            const token = localStorage.getItem("token");

            setUpdatingItem(variantId);

            const response = await fetch(
                "http://localhost:5000/api/cart",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        variantId,
                        quantity: newQuantity
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }

            setCart(result.data);
        } catch (error) {
            console.error(error);
        } finally {
            setUpdatingItem(null);
        }
    }

    async function handleRemoveItem(variantId) {
        try {
            const token = localStorage.getItem("token");

            setUpdatingItem(variantId);

            const response = await fetch(
                `http://localhost:5000/api/cart/${variantId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }

            setCart(result.data);
        } catch (error) {
            console.error(error);
        } finally {
            setUpdatingItem(null);
        }
    }

    if (loading) {
        return (
            <>
                <Header />

                <main className="cart-page">
                    <p className="cart-message">
                        Loading cart...
                    </p>
                </main>

                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />

            <main className="cart-page">

                <div className="cart-breadcrumb">
                    <Link to="/">Home</Link>
                    <span>/</span>
                    <Link to="/products">Products</Link>
                    <span>/</span>
                    <span>Cart</span>
                </div>

                <div className="cart-header">
                    <div>
                        <h1>Your Cart</h1>
                        <p>Review your items before checkout.</p>
                    </div>
                </div>

                <div className="cart-layout">

                    <section className="cart-items-section">

                        {!cart || cart.items.length === 0 ? (
                            <p className="cart-message">
                                Your cart is empty.
                            </p>
                        ) : (
                            cart.items.map((item) => {

                                const isUpdating =
                                    updatingItem === item.variant._id;

                                return (
                                    <div
                                        className="cart-item"
                                        key={item.variant._id}
                                    >

                                        <div className="cart-item-image">
                                            <img
                                                src={
                                                    item.product.images?.[0]
                                                        ? `http://localhost:5000${item.product.images[0]}`
                                                        : "/images/1.png"
                                                }
                                                alt={item.product.name}
                                            />
                                        </div>

                                        <div className="cart-item-info">

                                            <h2>
                                                {item.product.name}
                                            </h2>

                                            <p className="cart-item-variant">
                                                Variant: {item.variant.size}
                                            </p>

                                            <p className="cart-item-price">
                                                ₹{item.variant.price} each
                                            </p>

                                            <p className="cart-item-delivery">
                                                Free Express Delivery
                                            </p>

                                            <div className="cart-item-actions">

                                                <div className="quantity-control">

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            isUpdating ||
                                                            item.quantity <= 1
                                                        }
                                                        onClick={() =>
                                                            handleQuantityChange(
                                                                item.variant._id,
                                                                item.quantity - 1
                                                            )
                                                        }
                                                    >
                                                        −
                                                    </button>

                                                    <span>
                                                        {item.quantity}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            isUpdating ||
                                                            item.quantity >=
                                                                item.variant.stock
                                                        }
                                                        onClick={() =>
                                                            handleQuantityChange(
                                                                item.variant._id,
                                                                item.quantity + 1
                                                            )
                                                        }
                                                    >
                                                        +
                                                    </button>

                                                </div>

                                                <button
                                                    type="button"
                                                    className="cart-remove-button"
                                                    disabled={isUpdating}
                                                    onClick={() =>
                                                        handleRemoveItem(
                                                            item.variant._id
                                                        )
                                                    }
                                                >
                                                    Remove
                                                </button>

                                            </div>

                                        </div>

                                        <div className="cart-item-total">
                                            ₹{item.variant.price * item.quantity}
                                        </div>

                                    </div>
                                );
                            })
                        )}

                    </section>

                    {cart && cart.items.length > 0 && (
                        <aside className="cart-summary">

                            <h2>Order Summary</h2>

                            <div className="cart-summary-row">
                                <span>Subtotal</span>
                                <span>₹{subtotal}</span>
                            </div>

                            <div className="cart-summary-row">
                                <span>Shipping</span>
                                <span className="cart-free">
                                    Free
                                </span>
                            </div>

                            <div className="cart-summary-divider"></div>

                            <div className="cart-summary-total">
                                <span>Total</span>
                                <strong>₹{subtotal}</strong>
                            </div>

                            <button
                                type="button"
                                className="cart-checkout-button"
                            >
                                Proceed to Checkout
                            </button>

                            <Link
                                to="/products"
                                className="cart-continue-button"
                            >
                                Continue Shopping
                            </Link>

                        </aside>
                    )}

                </div>

            </main>

            <Footer />
        </>
    );
}

export default Cart;