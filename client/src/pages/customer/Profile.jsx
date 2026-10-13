import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import "../../styles/Profile.css";

function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [addresses, setAddresses] = useState([]);
    const [addressLoading, setAddressLoading] = useState(true);
    const [addressError, setAddressError] = useState("");

    const [orders, setOrders] = useState([]);
    const [orderLoading, setOrderLoading] = useState(true);
    const [orderError, setOrderError] = useState("");

    // Edit Profile state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState("");
    const [profileMessageType, setProfileMessageType] = useState("");

    useEffect(() => {
        const fetchAddresses = async (token) => {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/addresses",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Failed to load addresses."
                    );
                }

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

        const fetchOrders = async (token) => {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/orders/my-orders",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Failed to load order history."
                    );
                }

                setOrders(Array.isArray(data.data) ? data.data : []);
            } catch (error) {
                setOrderError(error.message);
            } finally {
                setOrderLoading(false);
            }
        };

        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");

                if (!token) {
                    setError("Please log in to view your profile.");
                    setAddressError(
                        "Please log in to view your addresses."
                    );
                    setOrderError(
                        "Please log in to view your order history."
                    );

                    setAddressLoading(false);
                    setOrderLoading(false);
                    return;
                }

                fetchAddresses(token);
                fetchOrders(token);

                const response = await fetch(
                    "http://localhost:5000/api/auth/profile",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Failed to load profile."
                    );
                }

                setUser(data.user);
                setEditName(data.user.name || "");
                setEditPhone(data.user.phone || "");
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

    // Open the form and fill it with the current profile information.
    const handleEditProfile = () => {
        setEditName(user?.name || "");
        setEditPhone(user?.phone || "");
        setProfileMessage("");
        setIsEditing(true);
    };

    // Close the form without saving any changes.
    const handleCancelEdit = () => {
        setEditName(user?.name || "");
        setEditPhone(user?.phone || "");
        setProfileMessage("");
        setIsEditing(false);
    };

    // Save the edited name and phone number to the backend.
    const handleSaveProfile = async (event) => {
        event.preventDefault();

        const name = editName.trim();
        const phone = editPhone.trim();

        if (!name || !phone) {
            setProfileMessage("Name and phone number are required.");
            setProfileMessageType("error");
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            setProfileMessage("Please log in again to update your profile.");
            setProfileMessageType("error");
            return;
        }

        setSavingProfile(true);
        setProfileMessage("");

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/profile",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name,
                        phone,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to update profile."
                );
            }

            setUser(data.user);

            localStorage.setItem("user", JSON.stringify(data.user));
            window.dispatchEvent(new Event("userUpdated"));

            setEditName(data.user.name || "");
            setEditPhone(data.user.phone || "");
            setIsEditing(false);
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
                        <h1>My Profile</h1>
                        <p>
                            View your personal details, saved addresses,
                            and order history.
                        </p>
                    </div>

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
                                        value={user?.email || ""}
                                        readOnly
                                        disabled
                                    />
                                    <small>
                                        Email cannot be changed here.
                                    </small>
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

                                {profileMessageType === "error" &&
                                    profileMessage && (
                                        <p className="profile-message profile-message-error" role="alert">
                                            {profileMessage}
                                        </p>
                                    )}

                                <div className="profile-edit-actions">
                                    <button
                                        type="submit"
                                        className="profile-save-button"
                                        disabled={savingProfile}
                                    >
                                        {savingProfile
                                            ? "Saving..."
                                            : "Save Changes"}
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
                            <div className="profile-information">
                                {addresses.map((address, index) => (
                                    <div
                                        key={
                                            address._id ||
                                            address.id ||
                                            index
                                        }
                                    >
                                        <span>
                                            {address.fullName ||
                                                "Saved Address"}

                                            {address.isDefault &&
                                                " — DEFAULT"}
                                        </span>

                                        <p>
                                            {formatAddress(address) ||
                                                "Address details unavailable"}
                                        </p>

                                        <p>
                                            {address.phone ||
                                                "No phone number provided"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Order History */}
                    <section className="profile-section">
                        <h2>Order History</h2>

                        {orderLoading ? (
                            <p>Loading your orders...</p>
                        ) : orderError ? (
                            <p role="alert">{orderError}</p>
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
                                                    {formatDate(
                                                        order.createdAt
                                                    )}
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
                                                        <div>
                                                            <p>
                                                                {item.product
                                                                    ?.name ||
                                                                    "Product unavailable"}
                                                            </p>

                                                            <span>
                                                                Size:{" "}
                                                                {item.variant
                                                                    ?.size ||
                                                                    "N/A"}
                                                                {" · "}
                                                                Quantity:{" "}
                                                                {item.quantity}
                                                            </span>
                                                        </div>

                                                        <p>
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
                                                    {order.shippingAddress
                                                        .phone || ""}
                                                </p>
                                            </div>
                                        )}
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <Footer />
        </>
    );
}

export default Profile;