import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";

import "../../styles/Checkout.css";
import { API_BASE_URL } from "../../config/apiConfig.js";

const emptyAddressForm = {
    fullName: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false
};

function Checkout() {
    const navigate = useNavigate();

    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [loading, setLoading] = useState(true);

    const [checkoutSummary, setCheckoutSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summaryError, setSummaryError] = useState("");

    // Coupon state
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState("");
    const [couponLoading, setCouponLoading] = useState(false);

    // Address management state
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [savingAddress, setSavingAddress] = useState(false);
    const [deletingAddressId, setDeletingAddressId] = useState(null);
    const [addressToDelete, setAddressToDelete] = useState(null);

    const [addressError, setAddressError] = useState("");
    const [addressSuccess, setAddressSuccess] = useState("");
    const [addressForm, setAddressForm] = useState(emptyAddressForm);

    // Payment state
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [placingOrder, setPlacingOrder] = useState(false);
    const [orderError, setOrderError] = useState("");
    const [razorpayReady, setRazorpayReady] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [walletLoading, setWalletLoading] = useState(true);
    const [walletAmount, setWalletAmount] = useState("0");
    const [walletError, setWalletError] = useState("");

    // Automatically apply the available wallet balance, capped at the
    // current order total. The backend independently validates this amount.
    useEffect(() => {
        if (walletLoading || summaryLoading || !checkoutSummary) {
            return;
        }

        const orderTotal = Number(
            checkoutSummary.totalAmount ?? checkoutSummary.total ?? 0
        );
        const safeBalance = Number.isFinite(Number(walletBalance))
            ? Math.max(0, Number(walletBalance))
            : 0;
        const safeTotal = Number.isFinite(orderTotal)
            ? Math.max(0, orderTotal)
            : 0;
        const suggestedWalletAmount = Math.round(
            Math.min(safeBalance, safeTotal) * 100
        ) / 100;

        setWalletAmount(String(suggestedWalletAmount));
        setWalletError("");
    }, [walletBalance, walletLoading, checkoutSummary, summaryLoading]);

    // Load Razorpay Checkout SDK
    useEffect(() => {
        if (window.Razorpay) {
            setRazorpayReady(true);
            return;
        }

        const scriptUrl =
            "https://checkout.razorpay.com/v1/checkout.js";

        let script = document.querySelector(
            `script[src="${scriptUrl}"]`
        );

        const createdHere = !script;

        if (!script) {
            script = document.createElement("script");
            script.src = scriptUrl;
            script.async = true;
        }

        function handleScriptLoad() {
            setRazorpayReady(Boolean(window.Razorpay));
        }

        function handleScriptError() {
            setRazorpayReady(false);
            setOrderError(
                "Unable to load Razorpay. Please refresh the page and try again."
            );
        }

        script.addEventListener("load", handleScriptLoad);
        script.addEventListener("error", handleScriptError);

        if (createdHere) {
            document.body.appendChild(script);
        }

        return () => {
            script.removeEventListener("load", handleScriptLoad);
            script.removeEventListener("error", handleScriptError);

            if (createdHere && script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

    // Fetch saved addresses
    async function fetchAddresses() {
        const token = localStorage.getItem("token");

        if (!token) {
            setAddresses([]);
            setSelectedAddress(null);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/addresses`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to fetch addresses."
                );
            }

            const fetchedAddresses = result.data || [];

            setAddresses(fetchedAddresses);

            setSelectedAddress((currentAddress) =>
                fetchedAddresses.find(
                    (address) =>
                        address._id === currentAddress?._id
                ) ||
                fetchedAddresses.find(
                    (address) => address.isDefault
                ) ||
                fetchedAddresses[0] ||
                null
            );
        } catch (error) {
            console.error(error);
            setAddressError(
                error.message || "Failed to fetch addresses."
            );
        } finally {
            setLoading(false);
        }
    }

    // Fetch the signed-in customer's wallet balance.
    async function fetchWalletBalance() {
        const token = localStorage.getItem("token");

        if (!token) {
            setWalletBalance(0);
            setWalletLoading(false);
            return;
        }

        try {
            setWalletLoading(true);
            setWalletError("");

            const response = await fetch(`${API_BASE_URL}/api/wallet`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Unable to load wallet balance.");
            }

            const balance = Number(result.data?.balance);
            setWalletBalance(Number.isFinite(balance) && balance >= 0 ? balance : 0);
        } catch (error) {
            console.error(error);
            setWalletBalance(0);
            setWalletError("Your wallet balance could not be loaded. You can still pay with Razorpay without using your wallet.");
        } finally {
            setWalletLoading(false);
        }
    }

    // Fetch checkout summary
    async function fetchCheckoutSummary() {
        const token = localStorage.getItem("token");

        if (!token) {
            setCheckoutSummary(null);
            setSummaryError("Please log in to continue checkout.");
            setSummaryLoading(false);
            return;
        }

        try {
            setSummaryLoading(true);
            setSummaryError("");

            const response = await fetch(
                `${API_BASE_URL}/api/checkout/summary`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to load checkout summary."
                );
            }

            setCheckoutSummary(result.data);
        } catch (error) {
            console.error(error);
            setCheckoutSummary(null);
            setSummaryError(
                error.message || "Failed to load checkout summary."
            );
        } finally {
            setSummaryLoading(false);
        }
    }

    useEffect(() => {
        fetchAddresses();
        fetchCheckoutSummary();
        fetchWalletBalance();
    }, []);

    // Apply coupon
    async function handleApplyCoupon(event) {
        event.preventDefault();

        if (!couponCode.trim()) {
            setCouponError("Please enter a coupon code.");
            return;
        }

        try {
            setCouponLoading(true);
            setCouponError("");

            const token = localStorage.getItem("token");

            if (!token) {
                setCouponError("Please log in to apply a coupon.");
                return;
            }

            const response = await fetch(
                `${API_BASE_URL}/api/checkout/apply-coupon`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        couponCode: couponCode.trim()
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to apply coupon."
                );
            }

            if (!result.data?.coupon) {
                throw new Error(
                    "The server did not return the applied coupon details."
                );
            }

            setCheckoutSummary(result.data);
            setAppliedCoupon(result.data.coupon);
            setCouponCode(result.data.coupon.code);
        } catch (error) {
            console.error(error);
            setCouponError(
                error.message ||
                    "Something went wrong while applying the coupon."
            );
        } finally {
            setCouponLoading(false);
        }
    }

    // Remove coupon and restore the original summary
    async function handleRemoveCoupon() {
        try {
            setCouponLoading(true);
            setCouponError("");

            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await fetch(
                `${API_BASE_URL}/api/checkout/summary`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to remove coupon."
                );
            }

            if (!result.data) {
                throw new Error(
                    "The server did not return the checkout summary."
                );
            }

            setCheckoutSummary(result.data);
            setAppliedCoupon(null);
            setCouponCode("");
            setCouponError("");
        } catch (error) {
            console.error(error);
            setCouponError(
                error.message || "Failed to remove coupon."
            );
        } finally {
            setCouponLoading(false);
        }
    }

    // Place order using COD or Razorpay
    async function handlePlaceOrder() {
        if (placingOrder) {
            return;
        }

        setOrderError("");

        if (!selectedAddress) {
            setOrderError("Please select a delivery address.");
            return;
        }

        if (
            !checkoutSummary ||
            summaryLoading ||
            !checkoutSummary.items?.length
        ) {
            setOrderError(
                "Your cart is empty or the order summary is not ready."
            );
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            setPlacingOrder(true);

            const requestBody = {
                addressId: selectedAddress._id,
                couponCode: appliedCoupon?.code || undefined
            };

            // Cash on Delivery
            if (paymentMethod === "cod") {
                const response = await fetch(
                    `${API_BASE_URL}/api/orders`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            ...requestBody,
                            paymentMethod: "cod"
                        })
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Failed to place your order."
                    );
                }

                navigate("/order-success", {
                    state: {
                        orderId: result.data?._id
                    }
                });

                return;
            }

            // Online payment: use the selected wallet amount first, then pay
            // only the remaining balance through Razorpay.
            if (paymentMethod === "razorpay") {
                const orderTotal = Number(
                    checkoutSummary.totalAmount ?? checkoutSummary.total
                );
                const requestedWalletAmount = Number(walletAmount);
                const maximumWalletAmount = Math.min(
                    Math.max(0, Number(walletBalance) || 0),
                    Math.max(0, orderTotal || 0)
                );

                if (
                    !Number.isFinite(requestedWalletAmount) ||
                    requestedWalletAmount < 0 ||
                    requestedWalletAmount > maximumWalletAmount + 0.001
                ) {
                    throw new Error("Choose a wallet amount within your available balance and order total.");
                }

                const normalizedWalletAmount =
                    Math.round(requestedWalletAmount * 100) / 100;

                // Ask the backend to calculate the total and decide whether
                // this is a wallet-only order or a mixed wallet/Razorpay order.
                const response = await fetch(
                    `${API_BASE_URL}/api/payments/create-order`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            ...requestBody,
                            walletAmount: normalizedWalletAmount
                        })
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || "Failed to initialize payment.");
                }

                const paymentData = result.data;

                // A wallet-only order has no Razorpay order ID or SDK step.
                if (paymentData?.paymentMethod === "wallet") {
                    navigate("/order-success", {
                        state: { orderId: paymentData.orderId }
                    });
                    return;
                }

                const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

                if (!keyId) {
                    throw new Error("Razorpay Key ID is missing. Check client/.env and restart Vite.");
                }

                if (!razorpayReady || !window.Razorpay) {
                    throw new Error("Razorpay is still loading. Please try again in a moment.");
                }

                if (
                    !paymentData?.razorpayOrderId ||
                    !paymentData?.orderId ||
                    !Number.isSafeInteger(paymentData.amount) ||
                    paymentData.amount <= 0 ||
                    paymentData.currency !== "INR"
                ) {
                    throw new Error("The server returned invalid payment details.");
                }

                // Verify that the backend used the wallet contribution before
                // opening Razorpay. Razorpay amount is always in paise.
                const expectedRazorpayAmount = Math.round(
                    (orderTotal - normalizedWalletAmount) * 100
                ) / 100;
                const expectedRazorpayPaise = Math.round(
                    expectedRazorpayAmount * 100
                );

                console.log("[wallet-checkout:client-response]", {
                    orderTotal,
                    requestedWalletAmount: normalizedWalletAmount,
                    serverWalletAmount: paymentData.walletAmount,
                    serverRazorpayAmount: paymentData.razorpayAmount,
                    serverAmountPaise: paymentData.amount,
                    expectedRazorpayAmount,
                    expectedRazorpayPaise
                });

                if (
                    Math.round(Number(paymentData.walletAmount) * 100) !==
                        Math.round(normalizedWalletAmount * 100) ||
                    Math.round(Number(paymentData.razorpayAmount) * 100) !==
                        Math.round(expectedRazorpayAmount * 100) ||
                    paymentData.amount !== expectedRazorpayPaise
                ) {
                    throw new Error(
                        `Wallet checkout mismatch. Razorpay should charge ₹${expectedRazorpayAmount.toFixed(2)}, but the server returned ₹${(Number(paymentData.amount) / 100).toFixed(2)}. Payment was not opened.`
                    );
                }

                const options = {
                    key: keyId,
                    amount: paymentData.amount,
                    currency: paymentData.currency,
                    name: "AquaCart",
                    description: normalizedWalletAmount > 0
                        ? `Wallet ₹${normalizedWalletAmount.toFixed(2)} + Razorpay payment`
                        : "Payment for your AquaCart order",
                    order_id: paymentData.razorpayOrderId,
                    prefill: {
                        name: selectedAddress.fullName || "",
                        contact: selectedAddress.phone || ""
                    },
                    theme: { color: "#0EA5E9" },
                    handler: async function (paymentResponse) {
                        try {
                            setOrderError("");
                            setPlacingOrder(true);

                            const verificationResponse = await fetch(
                                `${API_BASE_URL}/api/payments/verify-payment`,
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify({
                                        razorpay_order_id: paymentResponse.razorpay_order_id,
                                        razorpay_payment_id: paymentResponse.razorpay_payment_id,
                                        razorpay_signature: paymentResponse.razorpay_signature
                                    })
                                }
                            );

                            const verificationResult = await verificationResponse.json();

                            if (!verificationResponse.ok) {
                                throw new Error(
                                    verificationResult.message ||
                                    "Payment verification failed. If money was deducted, contact support before retrying."
                                );
                            }

                            navigate("/order-success", {
                                state: {
                                    orderId: verificationResult.data?.orderId || paymentData.orderId
                                }
                            });
                        } catch (error) {
                            console.error(error);
                            setOrderError(
                                error.message || "Payment verification failed. Contact support before retrying."
                            );
                        } finally {
                            setPlacingOrder(false);
                        }
                    },
                    modal: {
                        ondismiss: function () {
                            setPlacingOrder(false);
                            setOrderError(
                                "Payment was not completed. If you completed it before closing this window, check the order status before retrying."
                            );
                        }
                    }
                };

                const razorpay = new window.Razorpay(options);

                razorpay.on("payment.failed", function (paymentFailure) {
                    console.error("Razorpay payment failed:", paymentFailure.error);
                    setPlacingOrder(false);
                    setOrderError(
                        paymentFailure.error?.description || "Payment failed. Please try again."
                    );
                });

                
                razorpay.open();
                return;
            }
        } catch (error) {
            console.error("Checkout error:", error);
            setOrderError(
                error.message ||
                    "Failed to place your order. Please try again."
            );
            setPlacingOrder(false);
        }
    }

    // Address form handling
    function handleAddressFormChange(event) {
        const { name, value, checked, type } = event.target;

        setAddressForm((currentForm) => ({
            ...currentForm,
            [name]: type === "checkbox" ? checked : value
        }));
    }

    function openNewAddressForm() {
        setAddressForm(emptyAddressForm);
        setEditingAddressId(null);
        setShowAddressForm(true);
        setAddressError("");
        setAddressSuccess("");
    }

    function handleEditAddress(address) {
        setAddressForm({
            fullName: address.fullName || "",
            phone: address.phone || "",
            addressLine: address.addressLine || "",
            city: address.city || "",
            state: address.state || "",
            pincode: address.pincode || "",
            isDefault: Boolean(address.isDefault)
        });

        setEditingAddressId(address._id);
        setShowAddressForm(true);
        setAddressError("");
        setAddressSuccess("");
    }

    function handleCancelAddressForm() {
        setShowAddressForm(false);
        setEditingAddressId(null);
        setAddressForm(emptyAddressForm);
        setAddressError("");
    }

    // Save or update address
    async function handleSaveAddress(event) {
        event.preventDefault();

        try {
            setAddressError("");
            setAddressSuccess("");
            setSavingAddress(true);

            const token = localStorage.getItem("token");

            if (!token) {
                setAddressError(
                    "Please log in to manage your addresses."
                );
                return;
            }

            const isEditing = Boolean(editingAddressId);

            const response = await fetch(
                isEditing
                    ? `${API_BASE_URL}/api/addresses/${editingAddressId}`
                    : `${API_BASE_URL}/api/addresses`,
                {
                    method: isEditing ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(addressForm)
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message ||
                        (isEditing
                            ? "Failed to update address."
                            : "Failed to save address.")
                );
            }

            await fetchAddresses();

            setShowAddressForm(false);
            setEditingAddressId(null);
            setAddressForm(emptyAddressForm);

            setAddressSuccess(
                isEditing
                    ? "Address updated successfully."
                    : "Address saved successfully."
            );
        } catch (error) {
            console.error(error);
            setAddressError(
                error.message || "Something went wrong."
            );
        } finally {
            setSavingAddress(false);
        }
    }

    // Request address deletion, protecting default/only address
    function requestDeleteAddress(address) {
        setAddressError("");
        setAddressSuccess("");

        if (address.isDefault) {
            setAddressError(
                "The default address cannot be deleted. Set another address as default first."
            );
            return;
        }

        if (addresses.length <= 1) {
            setAddressError(
                "You must keep at least one saved address."
            );
            return;
        }

        setAddressToDelete(address);
    }

    // Confirm address deletion
    async function handleConfirmDelete() {
        if (!addressToDelete) {
            return;
        }

        const addressId = addressToDelete._id;

        if (addressToDelete.isDefault || addresses.length <= 1) {
            setAddressToDelete(null);

            setAddressError(
                addressToDelete.isDefault
                    ? "The default address cannot be deleted."
                    : "You must keep at least one saved address."
            );

            return;
        }

        try {
            setAddressError("");
            setAddressSuccess("");
            setDeletingAddressId(addressId);

            const token = localStorage.getItem("token");

            if (!token) {
                setAddressError(
                    "Please log in to manage your addresses."
                );
                return;
            }

            const response = await fetch(
                `${API_BASE_URL}/api/addresses/${addressId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to delete address."
                );
            }

            setAddressToDelete(null);

            if (editingAddressId === addressId) {
                handleCancelAddressForm();
            }

            await fetchAddresses();

            setAddressSuccess("Address deleted successfully.");
        } catch (error) {
            console.error(error);
            setAddressError(
                error.message || "Something went wrong."
            );
        } finally {
            setDeletingAddressId(null);
        }
    }

    return (
        <>
            <Header />

            <main className="checkout-page">
                <div className="checkout-breadcrumb">
                    <Link to="/">Home</Link>
                    <span>/</span>
                    <Link to="/cart">Cart</Link>
                    <span>/</span>
                    <span>Checkout</span>
                </div>

                <div className="checkout-header">
                    <h1>Checkout</h1>
                    <p>
                        Confirm your delivery details and review your order.
                    </p>
                </div>

                <div className="checkout-layout">
                    <section className="checkout-details-section">
                        <h2>Shipping Address</h2>

                        <button
                            type="button"
                            className="checkout-add-address-button"
                            onClick={() => {
                                if (showAddressForm) {
                                    handleCancelAddressForm();
                                } else {
                                    openNewAddressForm();
                                }
                            }}
                        >
                            {showAddressForm
                                ? "Cancel"
                                : "+ Add New Address"}
                        </button>

                        {showAddressForm && (
                            <form
                                className="checkout-address-form"
                                onSubmit={handleSaveAddress}
                            >
                                <h3 className="checkout-form-title">
                                    {editingAddressId
                                        ? "Edit Address"
                                        : "New Delivery Address"}
                                </h3>

                                <label>
                                    Full Name
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={addressForm.fullName}
                                        onChange={handleAddressFormChange}
                                        required
                                    />
                                </label>

                                <label>
                                    Phone Number
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={addressForm.phone}
                                        onChange={handleAddressFormChange}
                                        required
                                    />
                                </label>

                                <label>
                                    Address
                                    <textarea
                                        name="addressLine"
                                        value={addressForm.addressLine}
                                        onChange={handleAddressFormChange}
                                        required
                                    />
                                </label>

                                <label>
                                    City
                                    <input
                                        type="text"
                                        name="city"
                                        value={addressForm.city}
                                        onChange={handleAddressFormChange}
                                        required
                                    />
                                </label>

                                <label>
                                    State
                                    <input
                                        type="text"
                                        name="state"
                                        value={addressForm.state}
                                        onChange={handleAddressFormChange}
                                        required
                                    />
                                </label>

                                <label>
                                    PIN Code
                                    <input
                                        type="text"
                                        name="pincode"
                                        value={addressForm.pincode}
                                        onChange={handleAddressFormChange}
                                        required
                                    />
                                </label>

                                <label className="checkout-default-checkbox">
                                    <input
                                        type="checkbox"
                                        name="isDefault"
                                        checked={addressForm.isDefault}
                                        onChange={handleAddressFormChange}
                                    />
                                    Set as default address
                                </label>

                                <button
                                    type="submit"
                                    className="checkout-save-address-button"
                                    disabled={savingAddress}
                                >
                                    {savingAddress
                                        ? "Saving..."
                                        : editingAddressId
                                        ? "Update Address"
                                        : "Save Address"}
                                </button>
                            </form>
                        )}

                        {addressError && (
                            <p
                                className="checkout-address-error"
                                role="alert"
                            >
                                {addressError}
                            </p>
                        )}

                        {addressSuccess && (
                            <p
                                className="checkout-address-success"
                                role="status"
                            >
                                {addressSuccess}
                            </p>
                        )}

                        {loading ? (
                            <p>Loading your saved addresses...</p>
                        ) : addresses.length === 0 ? (
                            <p>
                                No saved addresses found. Add a delivery
                                address to continue.
                            </p>
                        ) : (
                            <div className="checkout-address-list">
                                {addresses.map((address) => {
                                    const cannotDelete =
                                        address.isDefault ||
                                        addresses.length <= 1;

                                    return (
                                        <div
                                            className={
                                                selectedAddress?._id === address._id
                                                    ? "checkout-address-item selected"
                                                    : "checkout-address-item"
                                            }
                                            key={address._id}
                                        >
                                            <button
                                                type="button"
                                                className="checkout-address-card"
                                                onClick={() =>
                                                    setSelectedAddress(address)
                                                }
                                            >
                                                <span className="checkout-address-radio">
                                                    {selectedAddress?._id ===
                                                    address._id
                                                        ? "●"
                                                        : "○"}
                                                </span>

                                                <span className="checkout-address-content">
                                                    <strong>
                                                        {address.fullName}
                                                    </strong>

                                                    {address.isDefault && (
                                                        <span className="checkout-default-badge">
                                                            Default
                                                        </span>
                                                    )}

                                                    <span>{address.phone}</span>
                                                    <span>{address.addressLine}</span>

                                                    <span>
                                                        {address.city},{" "}
                                                        {address.state} -{" "}
                                                        {address.pincode}
                                                    </span>
                                                </span>
                                            </button>

                                            <div className="checkout-address-actions">
                                                <button
                                                    type="button"
                                                    className="checkout-edit-address-button"
                                                    onClick={() =>
                                                        handleEditAddress(address)
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="checkout-delete-address-button"
                                                    disabled={
                                                        deletingAddressId ===
                                                            address._id ||
                                                        cannotDelete
                                                    }
                                                    title={
                                                        address.isDefault
                                                            ? "Default addresses cannot be deleted"
                                                            : addresses.length <= 1
                                                            ? "At least one address must remain"
                                                            : "Delete address"
                                                    }
                                                    onClick={() =>
                                                        requestDeleteAddress(
                                                            address
                                                        )
                                                    }
                                                >
                                                    {deletingAddressId ===
                                                    address._id
                                                        ? "Deleting..."
                                                        : "Delete"}
                                                </button>
                                            </div>

                                            {cannotDelete && (
                                                <p className="checkout-delete-hint">
                                                    {address.isDefault
                                                        ? "Default address — set another address as default before deleting this one."
                                                        : "Your only saved address cannot be deleted."}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <h2>Payment Method</h2>
                        <p>Choose your preferred payment method.</p>

                        <div className="checkout-payment-options">
                            <label
                                className={
                                    paymentMethod === "cod"
                                        ? "checkout-payment-option selected"
                                        : "checkout-payment-option"
                                }
                            >
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="cod"
                                    checked={paymentMethod === "cod"}
                                    onChange={() => {
                                        setPaymentMethod("cod");
                                        setOrderError("");
                                    }}
                                />

                                <span className="checkout-payment-option-content">
                                    <strong>Cash on Delivery</strong>
                                    <span>Pay when your order arrives.</span>
                                </span>
                            </label>

                            <label
                                className={
                                    paymentMethod === "razorpay"
                                        ? "checkout-payment-option selected"
                                        : "checkout-payment-option"
                                }
                            >
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="razorpay"
                                    checked={paymentMethod === "razorpay"}
                                    onChange={() => {
                                        setPaymentMethod("razorpay");
                                        setOrderError("");
                                    }}
                                />

                                <span className="checkout-payment-option-content">
                                    <strong>Pay Online with Razorpay</strong>
                                    <span>
                                        Pay securely using the available online
                                        payment options.
                                    </span>
                                </span>
                            </label>
                        </div>

                        {paymentMethod === "razorpay" && (
                            <div className="checkout-wallet-payment">
                                <div className="checkout-wallet-payment-heading">
                                    <strong>Use AquaCart Wallet</strong>
                                    <span>
                                        {walletLoading
                                            ? "Loading balance…"
                                            : `Available balance: ₹${walletBalance.toFixed(2)}`}
                                    </span>
                                </div>

                                <label htmlFor="walletAmount">
                                    Wallet amount to use (₹)
                                </label>
                                <input
                                    id="walletAmount"
                                    type="number"
                                    min="0"
                                    max={Math.min(
                                        walletBalance,
                                        Number(checkoutSummary?.totalAmount ?? checkoutSummary?.total) || 0
                                    )}
                                    step="0.01"
                                    inputMode="decimal"
                                    value={walletAmount}
                                    disabled={walletLoading || walletBalance <= 0 || placingOrder}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        const maximum = Math.min(
                                            Math.max(0, Number(walletBalance) || 0),
                                            Math.max(
                                                0,
                                                Number(
                                                    checkoutSummary?.totalAmount ??
                                                    checkoutSummary?.total ??
                                                    0
                                                ) || 0
                                            )
                                        );

                                        // Let the customer clear the field while
                                        // editing, but never retain a value above
                                        // the wallet balance or order total.
                                        if (value === "") {
                                            setWalletAmount("");
                                        } else {
                                            const parsed = Number(value);
                                            setWalletAmount(
                                                String(
                                                    Math.round(
                                                        Math.min(
                                                            Math.max(0, Number.isFinite(parsed) ? parsed : 0),
                                                            maximum
                                                        ) * 100
                                                    ) / 100
                                                )
                                            );
                                        }
                                        setWalletError("");
                                        setOrderError("");
                                    }}
                                    aria-describedby="walletAmountHelp"
                                />
                                <p id="walletAmountHelp">
                                    Enter any amount up to ₹{Math.min(
                                        walletBalance,
                                        Number(checkoutSummary?.totalAmount ?? checkoutSummary?.total) || 0
                                    ).toFixed(2)}. The remaining amount will be paid through Razorpay.
                                </p>
                                {walletError && (
                                    <p className="checkout-wallet-error" role="status">
                                        {walletError}
                                    </p>
                                )}
                                {Number(walletAmount) > 0 && (checkoutSummary?.totalAmount ?? checkoutSummary?.total) != null && (
                                    <p className="checkout-wallet-breakdown">
                                        Wallet: ₹{Math.min(
                                            Math.max(0, Number(walletAmount) || 0),
                                            walletBalance,
                                            Number(checkoutSummary.totalAmount ?? checkoutSummary.total)
                                        ).toFixed(2)}
                                        <span> · </span>
                                        Razorpay: ₹{Math.max(
                                            0,
                                            Number(checkoutSummary.totalAmount ?? checkoutSummary.total) - Math.min(
                                                Math.max(0, Number(walletAmount) || 0),
                                                walletBalance,
                                                Number(checkoutSummary.totalAmount ?? checkoutSummary.total)
                                            )
                                        ).toFixed(2)}
                                    </p>
                                )}
                            </div>
                        )}
                    </section>

                    <aside className="checkout-summary">
                        <h2>Order Summary</h2>

                        {summaryLoading ? (
                            <p>Loading order summary...</p>
                        ) : summaryError ? (
                            <p role="alert">{summaryError}</p>
                        ) : checkoutSummary ? (
                            <>
                                <div>
                                    {checkoutSummary.items?.map(
                                        (item, index) => (
                                            <div
                                                key={`${item.variant?._id || index}-${index}`}
                                            >
                                                <p>
                                                    {item.product?.name ||
                                                        "Product"}
                                                </p>
                                                <p>
                                                    Quantity: {item.quantity}
                                                </p>
                                                <p>
                                                    ₹{item.price} ×{" "}
                                                    {item.quantity} = ₹
                                                    {item.itemTotal}
                                                </p>
                                            </div>
                                        )
                                    )}
                                </div>

                                <hr />

                                <div className="checkout-coupon-section">
                                    <h3>Have a coupon?</h3>

                                    <form
                                        className="checkout-coupon-form"
                                        onSubmit={handleApplyCoupon}
                                    >
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(event) => {
                                                setCouponCode(
                                                    event.target.value
                                                );
                                                setCouponError("");
                                            }}
                                            placeholder="Enter coupon code"
                                            aria-label="Coupon code"
                                            disabled={
                                                couponLoading ||
                                                Boolean(appliedCoupon)
                                            }
                                        />

                                        <button
                                            type="submit"
                                            className="checkout-coupon-button"
                                            disabled={
                                                !couponCode.trim() ||
                                                couponLoading ||
                                                Boolean(appliedCoupon)
                                            }
                                        >
                                            {couponLoading
                                                ? "Please wait..."
                                                : "Apply Coupon"}
                                        </button>
                                    </form>

                                    {couponError && (
                                        <p
                                            className="checkout-coupon-error"
                                            role="alert"
                                        >
                                            {couponError}
                                        </p>
                                    )}

                                    {appliedCoupon && (
                                        <div className="checkout-coupon-applied">
                                            <p
                                                className="checkout-coupon-success"
                                                role="status"
                                            >
                                                Coupon{" "}
                                                <strong>
                                                    {appliedCoupon.code}
                                                </strong>{" "}
                                                applied successfully.
                                            </p>

                                            <button
                                                type="button"
                                                className="checkout-coupon-remove-button"
                                                onClick={handleRemoveCoupon}
                                                disabled={couponLoading}
                                            >
                                                {couponLoading
                                                    ? "Removing..."
                                                    : "Remove Coupon"}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <hr />

                                <p>
                                    Subtotal: ₹{checkoutSummary.subtotal}
                                </p>

                                <p>
                                    Discount: ₹{checkoutSummary.discount}
                                </p>

                                <p>
                                    Delivery: ₹
                                    {checkoutSummary.deliveryCharge ?? 0}
                                </p>

                                <h3>
                                    Total: ₹
                                    {checkoutSummary.totalAmount ??
                                        checkoutSummary.total}
                                </h3>
                            </>
                        ) : (
                            <p>Your cart summary is unavailable.</p>
                        )}
                    </aside>

                    <div className="checkout-place-order-section">
                        {orderError && (
                            <p
                                className="checkout-order-error"
                                role="alert"
                            >
                                {orderError}
                            </p>
                        )}

                        <button
                            type="button"
                            className="checkout-place-order-button"
                            onClick={handlePlaceOrder}
                            disabled={
                                placingOrder ||
                                loading ||
                                summaryLoading ||
                                !selectedAddress ||
                                !checkoutSummary ||
                                !checkoutSummary.items?.length ||
                                (paymentMethod === "razorpay" &&
                                    Number(walletAmount) < Number(checkoutSummary?.totalAmount || 0) &&
                                    !razorpayReady)
                            }
                        >
                            {placingOrder
                                ? "Processing..."
                                : paymentMethod === "razorpay" &&
                                  Number(walletAmount) < Number(checkoutSummary?.totalAmount || 0) &&
                                  !razorpayReady
                                ? "Loading Payment..."
                                : "Place Order"}
                        </button>
                    </div>
                </div>
            </main>

            <Footer />

            {addressToDelete && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setAddressToDelete(null);
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-address-title"
                        aria-describedby="delete-address-description"
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                    >
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl text-red-600">
                            !
                        </div>

                        <h2
                            id="delete-address-title"
                            className="mb-2 text-xl font-semibold text-slate-900"
                        >
                            Delete this address?
                        </h2>

                        <p
                            id="delete-address-description"
                            className="mb-6 text-sm leading-6 text-slate-600"
                        >
                            This will permanently remove the address for{" "}
                            <strong>{addressToDelete.fullName}</strong>. You
                            cannot undo this action.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                                disabled={deletingAddressId !== null}
                                onClick={() => setAddressToDelete(null)}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={deletingAddressId !== null}
                                onClick={handleConfirmDelete}
                            >
                                {deletingAddressId
                                    ? "Deleting..."
                                    : "Yes, delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Checkout;