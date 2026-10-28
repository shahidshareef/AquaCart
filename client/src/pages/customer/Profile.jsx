import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import "../../styles/Profile.css";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");

const emptyAddress = {
    fullName: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
};

function Profile() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [addresses, setAddresses] = useState([]);
    const [addressLoading, setAddressLoading] = useState(true);
    const [addressError, setAddressError] = useState("");

    const [orders, setOrders] = useState([]);
    const [wallet, setWallet] = useState(null);
    const [walletTransactions, setWalletTransactions] = useState([]);
    const [walletLoading, setWalletLoading] = useState(true);
    const [walletError, setWalletError] = useState("");
    const [showWallet, setShowWallet] = useState(false);
    const [orderLoading, setOrderLoading] = useState(false);
    const [orderError, setOrderError] = useState("");
    const [showOrders, setShowOrders] = useState(false);
    const [ordersFetched, setOrdersFetched] = useState(false);
    const [reviewEligibilityByProduct, setReviewEligibilityByProduct] = useState({});

    // Profile editing
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [emailCurrentPassword, setEmailCurrentPassword] =
        useState("");
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState("");
    const [profileMessageType, setProfileMessageType] = useState("");

    // Password changing
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordMessageType, setPasswordMessageType] = useState("");

    // Address editing
    const [editingAddress, setEditingAddress] = useState(null);
    const [addressForm, setAddressForm] = useState(emptyAddress);
    const [savingAddress, setSavingAddress] = useState(false);
    const [addressFormMessage, setAddressFormMessage] = useState("");
    const [addressFormMessageType, setAddressFormMessageType] =
        useState("");

    // Order cancellation / return request flow
    const [selectedOrderAction, setSelectedOrderAction] = useState(null);
    const [orderActionType, setOrderActionType] = useState("");
    const [orderActionReason, setOrderActionReason] = useState("");
    const [orderActionDetails, setOrderActionDetails] = useState("");
    const [orderActionLoading, setOrderActionLoading] = useState(false);
    const [orderActionError, setOrderActionError] = useState("");

    const getToken = () => localStorage.getItem("token");

    const getErrorMessage = async (response, fallbackMessage) => {
        try {
            const data = await response.json();
            return data.message || fallbackMessage;
        } catch {
            return fallbackMessage;
        }
    };

    // Log out the customer and update the common header.
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);
        setAddresses([]);
        setOrders([]);
        setOrdersFetched(false);
        setShowOrders(false);

        window.dispatchEvent(new Event("userUpdated"));

        navigate("/login", { replace: true });
    };

    const loadWallet = async (tokenOverride = getToken()) => {
        if (!tokenOverride) {
            setWalletError("Please log in to view your wallet.");
            setWalletLoading(false);
            return;
        }

        setWalletLoading(true);
        setWalletError("");

        try {
            const [walletResponse, transactionsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/api/wallet`, {
                    headers: { Authorization: `Bearer ${tokenOverride}` },
                }),
                fetch(`${API_BASE_URL}/api/wallet/transactions?limit=5`, {
                    headers: { Authorization: `Bearer ${tokenOverride}` },
                }),
            ]);

            if (!walletResponse.ok) {
                throw new Error(await getErrorMessage(walletResponse, "Unable to load wallet balance."));
            }

            if (!transactionsResponse.ok) {
                throw new Error(await getErrorMessage(transactionsResponse, "Unable to load wallet transactions."));
            }

            const walletResult = await walletResponse.json();
            const transactionsResult = await transactionsResponse.json();

            setWallet(walletResult.data || null);
            setWalletTransactions(transactionsResult.data?.transactions || []);
        } catch (walletLoadError) {
            setWalletError(walletLoadError.message || "Unable to load your wallet.");
        } finally {
            setWalletLoading(false);
        }
    };

    useEffect(() => {
        const fetchAddresses = async (token) => {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/addresses`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        await getErrorMessage(
                            response,
                            "Failed to load addresses."
                        )
                    );
                }

                const data = await response.json();

                const savedAddresses = Array.isArray(data)
                    ? data
                    : Array.isArray(data.data)
                        ? data.data
                        : Array.isArray(data.addresses)
                            ? data.addresses
                            : [];

                setAddresses(savedAddresses);
            } catch (error) {
                setAddressError(error.message);
            } finally {
                setAddressLoading(false);
            }
        };

        const fetchProfile = async () => {
            const token = getToken();

            if (!token) {
                setError("Please log in to view your profile.");
                setAddressError("Please log in to view your addresses.");
                setAddressLoading(false);
                setLoading(false);
                return;
            }

            fetchAddresses(token);
            loadWallet(token);

            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/auth/profile`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        await getErrorMessage(
                            response,
                            "Failed to load profile."
                        )
                    );
                }

                const data = await response.json();
                const profileUser = data.user;

                setUser(profileUser);
                setEditName(profileUser.name || "");
                setEditPhone(profileUser.phone || "");
                setEditEmail(profileUser.email || "");
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const defaultAddress = addresses.find(
        (address) => address.isDefault
    );

    const formatAddress = (address) => {
        return [
            address.fullName,
            address.addressLine,
            address.city,
            address.state,
            address.pincode,
        ]
            .filter(Boolean)
            .join(", ");
    };

    const formatDate = (date) => {
        if (!date) {
            return "Date unavailable";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "Date unavailable";
        }

        return parsedDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(amount || 0);
    };

    const formatStatus = (status) => {
        if (!status) {
            return "Unknown";
        }

        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case "paid":
            case "confirmed":
            case "delivered":
                return "status-success";

            case "pending":
            case "processing":
                return "status-pending";

            case "shipped":
                return "status-shipped";

            case "failed":
            case "cancelled":
            case "returned":
                return "status-danger";

            case "refunded":
                return "status-refunded";

            default:
                return "status-unknown";
        }
    };

    // Open profile editing and populate the current values.
    const handleEditProfile = () => {
        setEditName(user?.name || "");
        setEditPhone(user?.phone || "");
        setEditEmail(user?.email || "");
        setEmailCurrentPassword("");
        setProfileMessage("");
        setProfileMessageType("");
        setPasswordMessage("");
        setPasswordMessageType("");
        setShowPasswordForm(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setEditName(user?.name || "");
        setEditPhone(user?.phone || "");
        setEditEmail(user?.email || "");
        setEmailCurrentPassword("");
        setProfileMessage("");
        setProfileMessageType("");
        setPasswordMessage("");
        setPasswordMessageType("");
        setShowPasswordForm(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsEditing(false);
    };

    const handleSaveProfile = async (event) => {
        event.preventDefault();

        const name = editName.trim();
        const phone = editPhone.trim();
        const email = editEmail.trim().toLowerCase();
        const emailIsChanging =
            email !== (user?.email || "").toLowerCase();

        if (!name || !phone || !email) {
            setProfileMessage(
                "Name, phone number, and email are required."
            );
            setProfileMessageType("error");
            return;
        }

        if (emailIsChanging && !emailCurrentPassword) {
            setProfileMessage(
                "Enter your current password to change your email."
            );
            setProfileMessageType("error");
            return;
        }

        const token = getToken();

        if (!token) {
            setProfileMessage("Please log in again.");
            setProfileMessageType("error");
            return;
        }

        setSavingProfile(true);
        setProfileMessage("");
        setProfileMessageType("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/auth/profile`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name,
                        phone,
                        email,
                        currentPassword: emailIsChanging
                            ? emailCurrentPassword
                            : undefined,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    await getErrorMessage(
                        response,
                        "Failed to update profile."
                    )
                );
            }

            const data = await response.json();

            setUser(data.user);
            localStorage.setItem("user", JSON.stringify(data.user));
            window.dispatchEvent(new Event("userUpdated"));

            setEditName(data.user.name || "");
            setEditPhone(data.user.phone || "");
            setEditEmail(data.user.email || "");
            setEmailCurrentPassword("");
            setProfileMessage(
                data.message || "Profile updated successfully."
            );
            setProfileMessageType("success");
        } catch (error) {
            setProfileMessage(error.message);
            setProfileMessageType("error");
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async (event) => {
        event.preventDefault();

        setPasswordMessage("");
        setPasswordMessageType("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordMessage("Please complete all password fields.");
            setPasswordMessageType("error");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage("The new passwords do not match.");
            setPasswordMessageType("error");
            return;
        }

        const passwordPattern =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

        if (!passwordPattern.test(newPassword)) {
            setPasswordMessage(
                "Use at least 8 characters, including uppercase and lowercase letters, a number, and a special character."
            );
            setPasswordMessageType("error");
            return;
        }

        const token = getToken();

        if (!token) {
            setPasswordMessage("Please log in again.");
            setPasswordMessageType("error");
            return;
        }

        setSavingPassword(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/auth/change-password`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    await getErrorMessage(
                        response,
                        "Failed to change password."
                    )
                );
            }

            const data = await response.json();

            setPasswordMessage(
                data.message || "Password changed successfully."
            );
            setPasswordMessageType("success");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setShowPasswordForm(false);
        } catch (error) {
            setPasswordMessage(error.message);
            setPasswordMessageType("error");
        } finally {
            setSavingPassword(false);
        }
    };

    // Fetch orders separately from the View/Hide toggle.
    const loadOrders = async (forceReload = false) => {
        if (orderLoading) {
            return;
        }

        if (ordersFetched && !forceReload) {
            return;
        }

        const token = getToken();

        if (!token) {
            setOrderError("Please log in to view your order history.");
            return;
        }

        setOrderLoading(true);
        setOrderError("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/orders/my-orders`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    await getErrorMessage(
                        response,
                        "Failed to load order history."
                    )
                );
            }

            const data = await response.json();
            const fetchedOrders = Array.isArray(data.data) ? data.data : [];

            setOrders(fetchedOrders);
            setOrdersFetched(true);

            // Check review eligibility for each unique product in delivered orders.
            const deliveredProductIds = [
                ...new Set(
                    fetchedOrders
                        .filter((order) => order.orderStatus === "delivered")
                        .flatMap((order) =>
                            (order.orderItems || [])
                                .map((item) => item.product?._id)
                                .filter(Boolean)
                        )
                ),
            ];

            setReviewEligibilityByProduct((previous) => {
                const next = { ...previous };
                deliveredProductIds.forEach((productId) => {
                    next[productId] = { ...(next[productId] || {}), loading: true };
                });
                return next;
            });

            await Promise.all(
                deliveredProductIds.map(async (productId) => {
                    try {
                        const eligibilityResponse = await fetch(
                            `${API_BASE_URL}/api/reviews/eligibility/${productId}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Cache-Control": "no-cache",
                                },
                                cache: "no-store",
                            }
                        );
                        const eligibilityResult = await eligibilityResponse.json();

                        if (!eligibilityResponse.ok) {
                            throw new Error(
                                eligibilityResult.message ||
                                    "Unable to check review eligibility."
                            );
                        }

                        setReviewEligibilityByProduct((previous) => ({
                            ...previous,
                            [productId]: {
                                loading: false,
                                ...(eligibilityResult.data || {}),
                            },
                        }));
                    } catch (eligibilityError) {
                        console.error(
                            "Failed to check review eligibility:",
                            productId,
                            eligibilityError
                        );
                        setReviewEligibilityByProduct((previous) => ({
                            ...previous,
                            [productId]: {
                                loading: false,
                                canReview: false,
                                alreadyReviewed: false,
                                checkFailed: true,
                            },
                        }));
                    }
                })
            );
        } catch (error) {
            setOrderError(error.message);
            setOrdersFetched(false);
        } finally {
            setOrderLoading(false);
        }
    };

    // Toggle visibility without clearing the loaded orders.
    const handleToggleOrders = () => {
        if (showOrders) {
            setShowOrders(false);
            return;
        }

        setShowOrders(true);

        if (!ordersFetched && !orderLoading) {
            loadOrders();
        }
    };

    const updateOrderInState = (updatedOrder) => {
        if (!updatedOrder?._id) {
            return;
        }

        setOrders((previousOrders) =>
            previousOrders.map((order) =>
                order._id === updatedOrder._id ? updatedOrder : order
            )
        );
    };

    const canCancelOrder = (order) =>
        ["pending", "confirmed", "processing"].includes(
            order?.orderStatus
        );

    const canRequestReturn = (order) => {
        const returnStatus = order?.returnRequest?.status;

        return (
            order?.orderStatus === "delivered" &&
            !["pending", "approved", "completed"].includes(returnStatus)
        );
    };

    const getReturnStatusLabel = (status) => {
        switch (status) {
            case "pending":
                return "Return request pending review";
            case "approved":
                return "Return request approved";
            case "rejected":
                return "Return request rejected";
            case "completed":
                return "Return completed";
            default:
                return "";
        }
    };

    const getRefundNotice = (order) => {
        if (!order?.refundStatus || order.refundStatus === "not_applicable") {
            return "";
        }

        const amount = formatCurrency(order.refundAmount || 0);

        switch (order.refundStatus) {
            case "pending":
                return `Refund of ${amount} is pending processing. It will be handled separately from the order cancellation.`;
            case "processing":
                return `Refund of ${amount} is being processed.`;
            case "completed":
                return `Refund of ${amount} has been credited to your AquaCart wallet.`;
            case "failed":
                return `Refund of ${amount} could not be completed yet. Please contact support.`;
            default:
                return "";
        }
    };

    const openCancelOrderModal = (order) => {
        setSelectedOrderAction(order);
        setOrderActionType("cancel");
        setOrderActionReason("");
        setOrderActionDetails("");
        setOrderActionError("");
    };

    const openReturnOrderModal = (order) => {
        setSelectedOrderAction(order);
        setOrderActionType("return");
        setOrderActionReason("");
        setOrderActionDetails("");
        setOrderActionError("");
    };

    const closeOrderActionModal = (force = false) => {
        if (orderActionLoading && !force) {
            return;
        }

        setSelectedOrderAction(null);
        setOrderActionType("");
        setOrderActionReason("");
        setOrderActionDetails("");
        setOrderActionError("");
    };

    const handleCancelOrder = async () => {
        if (!selectedOrderAction || !canCancelOrder(selectedOrderAction)) {
            return;
        }

        const token = getToken();

        if (!token) {
            setOrderActionError("Please log in again.");
            return;
        }

        if (orderActionReason.trim().length > 500) {
            setOrderActionError(
                "Cancellation reason cannot exceed 500 characters."
            );
            return;
        }

        setOrderActionLoading(true);
        setOrderActionError("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/orders/${selectedOrderAction._id}/cancel`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        reason: orderActionReason.trim(),
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    await getErrorMessage(
                        response,
                        "Failed to cancel this order."
                    )
                );
            }

            const data = await response.json();
            updateOrderInState(data.data);
            await loadWallet(token);
            setOrderActionLoading(false);
            closeOrderActionModal(true);
        } catch (error) {
            setOrderActionError(error.message);
        } finally {
            setOrderActionLoading(false);
        }
    };

    const handleReturnRequest = async () => {
        if (
            !selectedOrderAction ||
            !canRequestReturn(selectedOrderAction)
        ) {
            return;
        }

        const token = getToken();

        if (!token) {
            setOrderActionError("Please log in again.");
            return;
        }

        if (!orderActionReason.trim()) {
            setOrderActionError("Please select a return reason.");
            return;
        }

        if (orderActionReason.trim().length > 200) {
            setOrderActionError(
                "Return reason cannot exceed 200 characters."
            );
            return;
        }

        if (orderActionDetails.trim().length > 1000) {
            setOrderActionError(
                "Return details cannot exceed 1000 characters."
            );
            return;
        }

        setOrderActionLoading(true);
        setOrderActionError("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/orders/${selectedOrderAction._id}/return-request`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        reason: orderActionReason.trim(),
                        details: orderActionDetails.trim(),
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    await getErrorMessage(
                        response,
                        "Failed to submit the return request."
                    )
                );
            }

            const data = await response.json();
            updateOrderInState(data.data);
            setOrderActionLoading(false);
            closeOrderActionModal(true);
        } catch (error) {
            setOrderActionError(error.message);
        } finally {
            setOrderActionLoading(false);
        }
    };

    // Open the selected address in the existing address form.
    const handleEditAddress = (address) => {
        setEditingAddress(address);
        setAddressForm({
            fullName: address.fullName || "",
            phone: address.phone || "",
            addressLine: address.addressLine || "",
            city: address.city || "",
            state: address.state || "",
            pincode: address.pincode || "",
            isDefault: Boolean(address.isDefault),
        });
        setAddressFormMessage("");
        setAddressFormMessageType("");
    };

    const handleAddressFieldChange = (event) => {
        const { name, value, checked, type } = event.target;

        setAddressForm((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleCancelAddressEdit = () => {
        setEditingAddress(null);
        setAddressForm(emptyAddress);
        setAddressFormMessage("");
        setAddressFormMessageType("");
    };

    const handleSaveAddress = async (event) => {
        event.preventDefault();

        const requiredFields = [
            "fullName",
            "phone",
            "addressLine",
            "city",
            "state",
            "pincode",
        ];

        const hasMissingField = requiredFields.some(
            (field) => !addressForm[field].trim()
        );

        if (hasMissingField) {
            setAddressFormMessage("Please complete all address fields.");
            setAddressFormMessageType("error");
            return;
        }

        const token = getToken();

        if (!token) {
            setAddressFormMessage("Please log in again.");
            setAddressFormMessageType("error");
            return;
        }

        setSavingAddress(true);
        setAddressFormMessage("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/addresses/${editingAddress._id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(addressForm),
                }
            );

            if (!response.ok) {
                throw new Error(
                    await getErrorMessage(
                        response,
                        "Failed to update address."
                    )
                );
            }

            const data = await response.json();
            const updatedAddress = data.data;

            setAddresses((previous) =>
                previous.map((address) =>
                    address._id === updatedAddress._id
                        ? updatedAddress
                        : address.isDefault && updatedAddress.isDefault
                            ? { ...address, isDefault: false }
                            : address
                )
            );

            setAddressFormMessage(
                data.message || "Address updated successfully."
            );
            setAddressFormMessageType("success");
            setEditingAddress(null);
            setAddressForm(emptyAddress);
        } catch (error) {
            setAddressFormMessage(error.message);
            setAddressFormMessageType("error");
        } finally {
            setSavingAddress(false);
        }
    };

    return (
        <>
            <Header />

            <main className="profile-page">
                <div className="profile-container">
                    <div className="profile-breadcrumb">
                        <Link to="/">Home</Link>
                        <span>/</span>
                        <span>My Profile</span>
                    </div>

                    <div className="profile-header">
                        <div>
                            <h1>My Profile</h1>
                            <p>
                                View your personal details, saved addresses,
                                and order history.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="profile-logout-button"
                            onClick={handleLogout}
                        >
                            Log Out
                        </button>
                    </div>

                    {/* Wallet is collapsed by default; open it on demand. */}
                    <section className="profile-section">
                        <button
                            type="button"
                            onClick={() => {
                                setShowWallet(true);
                                loadWallet();
                            }}
                            className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-sky-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                            aria-haspopup="dialog"
                            aria-expanded={showWallet}
                        >
                            <span className="flex min-w-0 items-center gap-4">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-xl font-bold text-sky-700" aria-hidden="true">₹</span>
                                <span className="min-w-0">
                                    <span className="block text-xs font-bold uppercase tracking-wider text-sky-700">AquaCart Wallet</span>
                                    <span className="mt-1 block text-lg font-semibold text-slate-900">{walletLoading ? "Loading balance…" : wallet ? formatCurrency(wallet.balance) : "View wallet balance"}</span>
                                    <span className="mt-1 block text-sm text-slate-500">View balance and transaction history</span>
                                </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-sky-700">Open wallet <span aria-hidden="true">→</span></span>
                        </button>
                    </section>

                    {showWallet && (
                        <div
                            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
                            onClick={() => setShowWallet(false)}
                        >
                            <section
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="profile-wallet-title"
                                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
                                onClick={(event) => event.stopPropagation()}
                            >
                                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-sky-700">AquaCart Wallet</p>
                                        <h2 id="profile-wallet-title" className="mt-1 text-xl font-bold text-slate-900">Your wallet</h2>
                                        <p className="mt-1 text-sm text-slate-500">Refund credits and wallet activity for your account.</p>
                                    </div>
                                    <button type="button" onClick={() => setShowWallet(false)} aria-label="Close wallet" className="rounded-lg px-3 py-1 text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700">×</button>
                                </div>
                                <div className="space-y-5 p-5 sm:p-6">
                                    <div className="rounded-2xl bg-gradient-to-br from-sky-700 to-indigo-800 p-5 text-white">
                                        <p className="text-sm font-medium text-sky-100">Available balance</p>
                                        <p className="mt-2 text-3xl font-bold">{walletLoading ? "Loading…" : wallet ? formatCurrency(wallet.balance) : "—"}</p>
                                        <p className="mt-2 text-xs text-sky-100">Currency: {wallet?.currency || "INR"}</p>
                                    </div>
                                    {walletError && (
                                        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
                                            <span>{walletError}</span>
                                            <button type="button" onClick={() => loadWallet()} disabled={walletLoading} className="shrink-0 rounded-md border border-red-200 px-3 py-1.5 font-semibold hover:bg-red-100 disabled:opacity-50">Retry</button>
                                        </div>
                                    )}
                                    <div>
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <h3 className="font-semibold text-slate-900">Recent activity</h3>
                                            <button type="button" onClick={() => loadWallet()} disabled={walletLoading} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">{walletLoading ? "Refreshing…" : "Refresh"}</button>
                                        </div>
                                        {walletLoading && walletTransactions.length === 0 ? (
                                            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Loading wallet activity…</p>
                                        ) : walletTransactions.length === 0 ? (
                                            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No wallet transactions yet. Eligible refunds and wallet purchases will appear here.</p>
                                        ) : (
                                            <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                                                {walletTransactions.map((transaction) => (
                                                    <div className="flex items-center gap-3 p-3 sm:p-4" key={transaction._id}>
                                                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-bold ${transaction.type === "credit" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{transaction.type === "credit" ? "+" : "−"}</span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block break-words text-sm font-semibold text-slate-800">{transaction.description || (transaction.source === "refund" ? "Order refund" : transaction.source === "purchase" ? "Wallet purchase" : "Wallet adjustment")}</span>
                                                            <span className="mt-1 block text-xs text-slate-500">{formatDate(transaction.createdAt)} · {formatStatus(transaction.source)}</span>
                                                        </span>
                                                        <span className={`shrink-0 text-right text-sm font-bold ${transaction.type === "credit" ? "text-emerald-700" : "text-rose-700"}`}>
                                                            <span className="block">{transaction.type === "credit" ? "+" : "−"}{formatCurrency(transaction.amount)}</span>
                                                            <span className="mt-1 block text-xs font-normal text-slate-500">Balance: {formatCurrency(transaction.balanceAfter)}</span>
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
                                    <button type="button" onClick={() => setShowWallet(false)} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">Close wallet</button>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* Personal Information */}
                    <section className="profile-section">
                        <div className="profile-section-heading">
                            <h2>Personal Information</h2>

                            {!loading && !error && user && !isEditing && (
                                <button
                                    type="button"
                                    className="profile-edit-button"
                                    onClick={handleEditProfile}
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        {profileMessage && (
                            <p
                                className={`profile-message profile-message-${profileMessageType}`}
                                role={
                                    profileMessageType === "error"
                                        ? "alert"
                                        : "status"
                                }
                            >
                                {profileMessage}
                            </p>
                        )}

                        {loading ? (
                            <p>Loading profile...</p>
                        ) : error ? (
                            <p role="alert">{error}</p>
                        ) : isEditing ? (
                            <>
                                <form
                                    className="profile-edit-form"
                                    onSubmit={handleSaveProfile}
                                >
                                    <div className="profile-edit-field">
                                        <label htmlFor="edit-name">
                                            Full Name
                                        </label>
                                        <input
                                            id="edit-name"
                                            type="text"
                                            value={editName}
                                            onChange={(event) =>
                                                setEditName(event.target.value)
                                            }
                                            maxLength={100}
                                            required
                                            disabled={savingProfile}
                                        />
                                    </div>

                                    <div className="profile-edit-field">
                                        <label htmlFor="edit-email">
                                            Email Address
                                        </label>
                                        <input
                                            id="edit-email"
                                            type="email"
                                            value={editEmail}
                                            onChange={(event) =>
                                                setEditEmail(event.target.value)
                                            }
                                            required
                                            disabled={savingProfile}
                                        />

                                        {editEmail.trim().toLowerCase() !==
                                            (user?.email || "").toLowerCase() && (
                                                <>
                                                    <small>
                                                        Enter your current password
                                                        to confirm this email change.
                                                    </small>
                                                    <input
                                                        aria-label="Current password to confirm email change"
                                                        type="password"
                                                        autoComplete="current-password"
                                                        placeholder="Current password"
                                                        value={emailCurrentPassword}
                                                        onChange={(event) =>
                                                            setEmailCurrentPassword(
                                                                event.target.value
                                                            )
                                                        }
                                                        required
                                                        disabled={savingProfile}
                                                    />
                                                </>
                                            )}
                                    </div>

                                    <div className="profile-edit-field">
                                        <label htmlFor="edit-phone">
                                            Phone Number
                                        </label>
                                        <input
                                            id="edit-phone"
                                            type="tel"
                                            value={editPhone}
                                            onChange={(event) =>
                                                setEditPhone(event.target.value)
                                            }
                                            maxLength={15}
                                            required
                                            disabled={savingProfile}
                                        />
                                    </div>

                                    <div className="profile-edit-actions">
                                        <button
                                            type="submit"
                                            className="profile-save-button"
                                            disabled={savingProfile}
                                        >
                                            {savingProfile
                                                ? "Saving..."
                                                : "Save Profile"}
                                        </button>

                                        <button
                                            type="button"
                                            className="profile-cancel-button"
                                            onClick={handleCancelEdit}
                                            disabled={savingProfile}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>

                                <div className="profile-password-area">
                                    <div className="profile-password-heading">
                                        <div>
                                            <h3>Change Password</h3>
                                            <p>
                                                Keep your account secure by
                                                using a strong password.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            className="profile-secondary-button"
                                            onClick={() => {
                                                setShowPasswordForm(
                                                    (previous) => !previous
                                                );
                                                setPasswordMessage("");
                                                setPasswordMessageType("");
                                            }}
                                        >
                                            {showPasswordForm
                                                ? "Cancel"
                                                : "Change Password"}
                                        </button>
                                    </div>

                                    {passwordMessage && (
                                        <p
                                            className={`profile-message profile-message-${passwordMessageType}`}
                                            role={
                                                passwordMessageType === "error"
                                                    ? "alert"
                                                    : "status"
                                            }
                                        >
                                            {passwordMessage}
                                        </p>
                                    )}

                                    {showPasswordForm && (
                                        <form
                                            className="profile-edit-form"
                                            onSubmit={handleChangePassword}
                                        >
                                            <div className="profile-edit-field">
                                                <label htmlFor="current-password">
                                                    Current Password
                                                </label>
                                                <input
                                                    id="current-password"
                                                    type="password"
                                                    autoComplete="current-password"
                                                    value={currentPassword}
                                                    onChange={(event) =>
                                                        setCurrentPassword(
                                                            event.target.value
                                                        )
                                                    }
                                                    required
                                                    disabled={savingPassword}
                                                />
                                            </div>

                                            <div className="profile-edit-field">
                                                <label htmlFor="new-password">
                                                    New Password
                                                </label>
                                                <input
                                                    id="new-password"
                                                    type="password"
                                                    autoComplete="new-password"
                                                    value={newPassword}
                                                    onChange={(event) =>
                                                        setNewPassword(
                                                            event.target.value
                                                        )
                                                    }
                                                    minLength={8}
                                                    required
                                                    disabled={savingPassword}
                                                />
                                                <small>
                                                    At least 8 characters,
                                                    including uppercase and
                                                    lowercase letters, a number,
                                                    and a special character.
                                                </small>
                                            </div>

                                            <div className="profile-edit-field">
                                                <label htmlFor="confirm-password">
                                                    Confirm New Password
                                                </label>
                                                <input
                                                    id="confirm-password"
                                                    type="password"
                                                    autoComplete="new-password"
                                                    value={confirmPassword}
                                                    onChange={(event) =>
                                                        setConfirmPassword(
                                                            event.target.value
                                                        )
                                                    }
                                                    required
                                                    disabled={savingPassword}
                                                />
                                            </div>

                                            <div className="profile-edit-actions">
                                                <button
                                                    type="submit"
                                                    className="profile-save-button"
                                                    disabled={savingPassword}
                                                >
                                                    {savingPassword
                                                        ? "Updating..."
                                                        : "Update Password"}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="profile-information">
                                <div>
                                    <span>FULL NAME</span>
                                    <p>{user?.name || "Not provided"}</p>
                                </div>

                                <div>
                                    <span>EMAIL ADDRESS</span>
                                    <p>{user?.email || "Not provided"}</p>
                                </div>

                                <div>
                                    <span>PHONE NUMBER</span>
                                    <p>{user?.phone || "Not provided"}</p>
                                </div>

                                <div>
                                    <span>DELIVERY ADDRESS</span>

                                    {addressLoading ? (
                                        <p>Loading address...</p>
                                    ) : addressError ? (
                                        <p role="alert">{addressError}</p>
                                    ) : defaultAddress ? (
                                        <p>
                                            {formatAddress(defaultAddress) ||
                                                "Address details unavailable"}
                                        </p>
                                    ) : addresses.length > 0 ? (
                                        <p>No default address selected</p>
                                    ) : (
                                        <p>No saved addresses</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Address Book */}
                    <section className="profile-section">
                        <h2>Address Book</h2>

                        {addressLoading ? (
                            <p>Loading saved addresses...</p>
                        ) : addressError ? (
                            <p role="alert">{addressError}</p>
                        ) : addresses.length === 0 ? (
                            <p>You haven't saved any addresses yet.</p>
                        ) : (
                            <div className="profile-address-list">
                                {addresses.map((address, index) => (
                                    <article
                                        className="profile-address-card"
                                        key={address._id || address.id || index}
                                    >
                                        <div className="profile-address-heading">
                                            <div>
                                                <span className="profile-address-name">
                                                    {address.fullName ||
                                                        "Saved Address"}
                                                </span>

                                                {address.isDefault && (
                                                    <span className="profile-default-badge">
                                                        Default
                                                    </span>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                className="profile-secondary-button"
                                                onClick={() =>
                                                    handleEditAddress(address)
                                                }
                                            >
                                                Edit Address
                                            </button>
                                        </div>

                                        <p>
                                            {formatAddress(address) ||
                                                "Address details unavailable"}
                                        </p>
                                        <p>
                                            {address.phone ||
                                                "No phone number provided"}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        )}

                        {editingAddress && (
                            <div className="profile-address-edit">
                                <h3>Edit Address</h3>

                                {addressFormMessage && (
                                    <p
                                        className={`profile-message profile-message-${addressFormMessageType}`}
                                        role={
                                            addressFormMessageType === "error"
                                                ? "alert"
                                                : "status"
                                        }
                                    >
                                        {addressFormMessage}
                                    </p>
                                )}

                                <form
                                    className="profile-edit-form"
                                    onSubmit={handleSaveAddress}
                                >
                                    <div className="profile-edit-field">
                                        <label htmlFor="address-full-name">
                                            Full Name
                                        </label>
                                        <input
                                            id="address-full-name"
                                            name="fullName"
                                            value={addressForm.fullName}
                                            onChange={handleAddressFieldChange}
                                            required
                                            disabled={savingAddress}
                                        />
                                    </div>

                                    <div className="profile-edit-field">
                                        <label htmlFor="address-phone">
                                            Phone Number
                                        </label>
                                        <input
                                            id="address-phone"
                                            name="phone"
                                            type="tel"
                                            value={addressForm.phone}
                                            onChange={handleAddressFieldChange}
                                            required
                                            disabled={savingAddress}
                                        />
                                    </div>

                                    <div className="profile-edit-field">
                                        <label htmlFor="address-line">
                                            Address
                                        </label>
                                        <input
                                            id="address-line"
                                            name="addressLine"
                                            value={addressForm.addressLine}
                                            onChange={handleAddressFieldChange}
                                            required
                                            disabled={savingAddress}
                                        />
                                    </div>

                                    <div className="profile-address-form-grid">
                                        <div className="profile-edit-field">
                                            <label htmlFor="address-city">
                                                City
                                            </label>
                                            <input
                                                id="address-city"
                                                name="city"
                                                value={addressForm.city}
                                                onChange={handleAddressFieldChange}
                                                required
                                                disabled={savingAddress}
                                            />
                                        </div>

                                        <div className="profile-edit-field">
                                            <label htmlFor="address-state">
                                                State
                                            </label>
                                            <input
                                                id="address-state"
                                                name="state"
                                                value={addressForm.state}
                                                onChange={handleAddressFieldChange}
                                                required
                                                disabled={savingAddress}
                                            />
                                        </div>

                                        <div className="profile-edit-field">
                                            <label htmlFor="address-pincode">
                                                PIN Code
                                            </label>
                                            <input
                                                id="address-pincode"
                                                name="pincode"
                                                value={addressForm.pincode}
                                                onChange={handleAddressFieldChange}
                                                required
                                                disabled={savingAddress}
                                            />
                                        </div>
                                    </div>

                                    <label className="profile-default-checkbox">
                                        <input
                                            type="checkbox"
                                            name="isDefault"
                                            checked={addressForm.isDefault}
                                            onChange={handleAddressFieldChange}
                                            disabled={
                                                savingAddress ||
                                                Boolean(editingAddress.isDefault)
                                            }
                                        />
                                        <span>
                                            {editingAddress.isDefault
                                                ? "This is your default address"
                                                : "Make this my default address"}
                                        </span>
                                    </label>

                                    <div className="profile-edit-actions">
                                        <button
                                            type="submit"
                                            className="profile-save-button"
                                            disabled={savingAddress}
                                        >
                                            {savingAddress
                                                ? "Saving..."
                                                : "Save Address"}
                                        </button>

                                        <button
                                            type="button"
                                            className="profile-cancel-button"
                                            onClick={handleCancelAddressEdit}
                                            disabled={savingAddress}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </section>

                    {/* Order History */}
                    <section className="profile-section">
                        <div className="profile-section-heading">
                            <h2>Order History</h2>

                            <button
                                type="button"
                                className="profile-edit-button"
                                onClick={handleToggleOrders}
                            >
                                {showOrders ? "Hide Orders" : "View Orders"}
                            </button>
                        </div>

                        {!showOrders ? (
                            <p>
                                Click “View Orders” to see your previous
                                purchases and order details.
                            </p>
                        ) : orderLoading ? (
                            <p>Loading your orders...</p>
                        ) : orderError ? (
                            <div>
                                <p role="alert">{orderError}</p>

                                <button
                                    type="button"
                                    className="profile-secondary-button"
                                    onClick={() => loadOrders(true)}
                                    disabled={orderLoading}
                                >
                                    {orderLoading ? "Loading..." : "Try Again"}
                                </button>
                            </div>
                        ) : orders.length === 0 ? (
                            <p>You haven't placed any orders yet.</p>
                        ) : (
                            <div className="profile-order-list">
                                {orders.map((order) => (
                                    <article
                                        className="profile-order-card"
                                        key={order._id}
                                    >
                                        <div className="profile-order-header">
                                            <div>
                                                <span>ORDER ID</span>
                                                <p>{order._id}</p>
                                            </div>

                                            <div>
                                                <span>ORDER DATE</span>
                                                <p>
                                                    {formatDate(order.createdAt)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="profile-order-items">
                                            {order.orderItems?.map(
                                                (item, index) => (
                                                    <div
                                                        className="profile-order-item"
                                                        key={
                                                            item._id ||
                                                            `${order._id}-${index}`
                                                        }
                                                    >
                                                        <div className="profile-order-item-main">
                                                            <div>
                                                                <p>
                                                                    {item.product
                                                                        ?.name ||
                                                                        "Product unavailable"}
                                                                </p>
                                                                <span>
                                                                    Size:{" "}
                                                                    {item.variant
                                                                        ?.size || "N/A"}
                                                                    {" · "}
                                                                    Quantity:{" "}
                                                                    {item.quantity}
                                                                </span>
                                                            </div>

                                                            {order.orderStatus === "delivered" && item.product?._id && (
                                                                <div className="profile-order-review-area">
                                                                    {reviewEligibilityByProduct[item.product._id]?.loading ||
                                                                    !reviewEligibilityByProduct[item.product._id] ? (
                                                                        <span className="profile-review-status">
                                                                            Checking review...
                                                                        </span>
                                                                    ) : reviewEligibilityByProduct[item.product._id]?.checkFailed ? (
                                                                        <button
                                                                            type="button"
                                                                            className="profile-write-review-button"
                                                                            onClick={() => loadOrders(true)}
                                                                        >
                                                                            Check Review Status
                                                                        </button>
                                                                    ) : reviewEligibilityByProduct[item.product._id]?.alreadyReviewed ? (
                                                                        reviewEligibilityByProduct[item.product._id]?.reviewStatus === "pending" ? (
                                                                            <span className="profile-review-status profile-review-status-pending">
                                                                                Review pending approval
                                                                            </span>
                                                                        ) : reviewEligibilityByProduct[item.product._id]?.reviewStatus === "approved" ? (
                                                                            <span className="profile-review-status profile-review-status-approved">
                                                                                Review submitted
                                                                            </span>
                                                                        ) : (
                                                                            <span className="profile-review-status profile-review-status-rejected">
                                                                                Review already submitted · Rejected
                                                                            </span>
                                                                        )
                                                                    ) : reviewEligibilityByProduct[item.product._id]?.canReview ? (
                                                                        <Link
                                                                            to={`/products/${item.product._id}`}
                                                                            state={{ openReview: true }}
                                                                            className="profile-write-review-button"
                                                                        >
                                                                            Write a Review
                                                                        </Link>
                                                                    ) : (
                                                                        <span className="profile-review-status">
                                                                            Review unavailable
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <p className="profile-order-item-price">
                                                            {formatCurrency(
                                                                (item.price || 0) *
                                                                (item.quantity || 0)
                                                            )}
                                                        </p>
                                                    </div>
                                                )
                                            )}
                                        </div>

                                        <div className="profile-order-details">
                                            <div>
                                                <span>PAYMENT METHOD</span>
                                                <p>
                                                    {(
                                                        order.paymentMethod ||
                                                        "N/A"
                                                    ).toUpperCase()}
                                                </p>
                                            </div>

                                            <div>
                                                <span>PAYMENT STATUS</span>
                                                <p
                                                    className={`profile-status-badge ${getStatusClass(
                                                        order.paymentStatus
                                                    )}`}
                                                >
                                                    {formatStatus(
                                                        order.paymentStatus
                                                    )}
                                                </p>
                                            </div>

                                            <div>
                                                <span>ORDER STATUS</span>
                                                <p
                                                    className={`profile-status-badge ${getStatusClass(
                                                        order.orderStatus
                                                    )}`}
                                                >
                                                    {formatStatus(
                                                        order.orderStatus
                                                    )}
                                                </p>
                                            </div>

                                            <div>
                                                <span>ORDER TOTAL</span>
                                                <p>
                                                    {formatCurrency(
                                                        order.totalAmount
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {order.shippingAddress && (
                                            <div className="profile-order-shipping">
                                                <span>DELIVERY ADDRESS</span>
                                                <p>
                                                    {formatAddress(
                                                        order.shippingAddress
                                                    ) || "Address unavailable"}
                                                </p>
                                                <p>
                                                    {order.shippingAddress.phone ||
                                                        ""}
                                                </p>
                                            </div>
                                        )}

                                        {(order.refundStatus &&
                                            order.refundStatus !== "not_applicable") && (
                                            <div className={`profile-refund-notice ${
                                                order.refundStatus === "failed"
                                                    ? "profile-refund-notice-danger"
                                                    : order.refundStatus === "completed"
                                                        ? "profile-refund-notice-success"
                                                        : "profile-refund-notice-pending"
                                            }`}>
                                                <strong>Refund Notice</strong>
                                                <p>{getRefundNotice(order)}</p>
                                            </div>
                                        )}

                                        {order.returnRequest?.status &&
                                            order.returnRequest.status !== "not_requested" && (
                                                <div className="profile-return-status">
                                                    <div>
                                                        <span>RETURN REQUEST</span>
                                                        <p>
                                                            {getReturnStatusLabel(
                                                                order.returnRequest.status
                                                            )}
                                                        </p>
                                                    </div>

                                                    {order.returnRequest.adminNote && (
                                                        <div>
                                                            <span>ADMIN NOTE</span>
                                                            <p>
                                                                {order.returnRequest.adminNote}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                        {(canCancelOrder(order) ||
                                            canRequestReturn(order)) && (
                                            <div className="profile-order-actions">
                                                {canCancelOrder(order) && (
                                                    <button
                                                        type="button"
                                                        className="profile-order-cancel-button"
                                                        onClick={() =>
                                                            openCancelOrderModal(order)
                                                        }
                                                    >
                                                        Cancel Order
                                                    </button>
                                                )}

                                                {canRequestReturn(order) && (
                                                    <button
                                                        type="button"
                                                        className="profile-order-return-button"
                                                        onClick={() =>
                                                            openReturnOrderModal(order)
                                                        }
                                                    >
                                                        Request Return
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {selectedOrderAction && (
                <div
                    className="profile-modal-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeOrderActionModal();
                        }
                    }}
                >
                    <div
                        className="profile-action-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="profile-order-action-title"
                    >
                        <div className="profile-action-modal-header">
                            <div>
                                <h2 id="profile-order-action-title">
                                    {orderActionType === "cancel"
                                        ? "Cancel Order"
                                        : "Request a Return"}
                                </h2>
                                <p>
                                    Order #{selectedOrderAction._id?.slice(0, 8)}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="profile-modal-close-button"
                                onClick={closeOrderActionModal}
                                disabled={orderActionLoading}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <div className="profile-action-modal-body">
                            {orderActionType === "cancel" ? (
                                <>
                                    <div className="profile-confirmation-box profile-confirmation-danger">
                                        <strong>Are you sure you want to cancel this order?</strong>
                                        <p>
                                            This action cannot be undone. Your order will be marked as cancelled and stock will be restored where applicable.
                                        </p>
                                    </div>

                                    {selectedOrderAction.paymentMethod === "razorpay" &&
                                        selectedOrderAction.paymentStatus === "paid" && (
                                            <div className="profile-refund-info-box">
                                                <strong>Refund notice</strong>
                                                <p>
                                                    Because this order was paid through Razorpay, {formatCurrency(selectedOrderAction.totalAmount)} will be credited to your AquaCart wallet when the cancellation succeeds.
                                                </p>
                                            </div>
                                        )}

                                    {selectedOrderAction.paymentMethod === "cod" && (
                                        <div className="profile-refund-info-box profile-refund-info-neutral">
                                            <strong>No payment refund is due</strong>
                                            <p>
                                                This order uses Cash on Delivery, so no online payment has been collected.
                                            </p>
                                        </div>
                                    )}

                                    <div className="profile-modal-field">
                                        <label htmlFor="cancel-reason">
                                            Cancellation reason <span>(optional)</span>
                                        </label>
                                        <textarea
                                            id="cancel-reason"
                                            value={orderActionReason}
                                            onChange={(event) =>
                                                setOrderActionReason(event.target.value)
                                            }
                                            maxLength={500}
                                            rows={4}
                                            placeholder="Tell us why you want to cancel this order..."
                                            disabled={orderActionLoading}
                                        />
                                        <small>{orderActionReason.length}/500</small>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="profile-confirmation-box profile-confirmation-info">
                                        <strong>Submit a return request for this delivered order.</strong>
                                        <p>
                                            Your request will be reviewed by the AquaCart team. A return request does not immediately mark the order as returned.
                                        </p>
                                    </div>

                                    {selectedOrderAction.paymentMethod === "razorpay" && (
                                        <div className="profile-refund-info-box">
                                            <strong>Refund notice</strong>
                                            <p>
                                                If your return is approved, any eligible refund will be handled separately after review. This request does not mean the refund has already been issued.
                                            </p>
                                        </div>
                                    )}

                                    <div className="profile-modal-field">
                                        <label htmlFor="return-reason">
                                            Return reason
                                        </label>
                                        <select
                                            id="return-reason"
                                            value={orderActionReason}
                                            onChange={(event) =>
                                                setOrderActionReason(event.target.value)
                                            }
                                            disabled={orderActionLoading}
                                        >
                                            <option value="">Select a reason</option>
                                            <option value="Damaged product">Damaged product</option>
                                            <option value="Wrong product received">Wrong product received</option>
                                            <option value="Product not as described">Product not as described</option>
                                            <option value="Quality issue">Quality issue</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div className="profile-modal-field">
                                        <label htmlFor="return-details">
                                            Additional details <span>(optional)</span>
                                        </label>
                                        <textarea
                                            id="return-details"
                                            value={orderActionDetails}
                                            onChange={(event) =>
                                                setOrderActionDetails(event.target.value)
                                            }
                                            maxLength={1000}
                                            rows={5}
                                            placeholder="Describe the issue with the product..."
                                            disabled={orderActionLoading}
                                        />
                                        <small>{orderActionDetails.length}/1000</small>
                                    </div>
                                </>
                            )}

                            {orderActionError && (
                                <p className="profile-modal-error" role="alert">
                                    {orderActionError}
                                </p>
                            )}
                        </div>

                        <div className="profile-action-modal-footer">
                            <button
                                type="button"
                                className="profile-cancel-button"
                                onClick={closeOrderActionModal}
                                disabled={orderActionLoading}
                            >
                                Go Back
                            </button>

                            <button
                                type="button"
                                className={
                                    orderActionType === "cancel"
                                        ? "profile-modal-danger-button"
                                        : "profile-modal-primary-button"
                                }
                                onClick={
                                    orderActionType === "cancel"
                                        ? handleCancelOrder
                                        : handleReturnRequest
                                }
                                disabled={orderActionLoading}
                            >
                                {orderActionLoading
                                    ? orderActionType === "cancel"
                                        ? "Cancelling..."
                                        : "Submitting..."
                                    : orderActionType === "cancel"
                                        ? "Confirm Cancellation"
                                        : "Submit Return Request"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
}

export default Profile;