import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import "../../styles/Reviews.css";
import { API_BASE_URL } from "../../config/apiConfig.js";

function Reviews() {
    const [reviews, setReviews] = useState([]);
    const [statusFilter, setStatusFilter] = useState("pending");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [selectedReview, setSelectedReview] = useState(null);
    const [moderationNote, setModerationNote] = useState("");
    const [showModal, setShowModal] = useState(false);

    function getAuthHeaders() {
        const token = localStorage.getItem("token");

        return {
            Authorization: `Bearer ${token || ""}`,
        };
    }

    async function readResponse(response) {
        return response.json().catch(() => ({}));
    }

    async function loadReviews(filter = statusFilter) {
        setLoading(true);
        setMessage("");
        setMessageType("");

        try {
            const query = filter ? `?status=${encodeURIComponent(filter)}` : "";
            const response = await fetch(
                `${API_BASE_URL}/api/reviews/admin${query}`,
                {
                    headers: getAuthHeaders(),
                }
            );

            const data = await readResponse(response);

            if (!response.ok) {
                setMessage(data.message || "Failed to fetch reviews.");
                setMessageType("error");
                return;
            }

            setReviews(Array.isArray(data.data) ? data.data : []);
        } catch (error) {
            console.error(error);
            setMessage("Something went wrong while loading reviews.");
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadReviews(statusFilter);
    }, [statusFilter]);

    function openModerationModal(review) {
        setSelectedReview(review);
        setModerationNote(review.moderationNote || "");
        setShowModal(true);
        setMessage("");
        setMessageType("");
    }

    function closeModerationModal() {
        if (actionLoading) {
            return;
        }

        setShowModal(false);
        setSelectedReview(null);
        setModerationNote("");
    }

    async function moderateReview(status) {
        if (!selectedReview) {
            return;
        }

        setActionLoading(status);
        setMessage("");
        setMessageType("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/reviews/admin/${selectedReview._id}/moderation`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        ...getAuthHeaders(),
                    },
                    body: JSON.stringify({
                        status,
                        moderationNote: moderationNote.trim(),
                    }),
                }
            );

            const data = await readResponse(response);

            if (!response.ok) {
                setMessage(data.message || "Failed to update the review.");
                setMessageType("error");
                return;
            }

            setMessage(
                status === "approved"
                    ? "Review approved successfully."
                    : "Review rejected successfully."
            );
            setMessageType("success");
            setShowModal(false);
            setSelectedReview(null);
            setModerationNote("");

            await loadReviews(statusFilter);
        } catch (error) {
            console.error(error);
            setMessage("Something went wrong while updating the review.");
            setMessageType("error");
        } finally {
            setActionLoading("");
        }
    }

    function formatDate(dateValue) {
        if (!dateValue) {
            return "—";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function getProductImage(product) {
        if (!product?.images || !Array.isArray(product.images) || !product.images.length) {
            return "";
        }

        const image = product.images[0];

        if (typeof image !== "string") {
            return "";
        }

        if (image.startsWith("http")) {
            return image;
        }

        return `${API_BASE_URL}${image.startsWith("/") ? image : `/${image}`}`;
    }

    function renderStars(rating) {
        return Array.from({ length: 5 }, (_, index) => (
            <span
                key={index}
                className={index < Number(rating) ? "review-star filled" : "review-star"}
            >
                ★
            </span>
        ));
    }

    function getStatusLabel(status) {
        if (status === "pending") {
            return "Pending Approval";
        }

        if (status === "approved") {
            return "Approved";
        }

        return "Rejected";
    }

    return (
        <AdminLayout pageTitle="Reviews">
            <div className="reviews-page">
                <div className="reviews-page-header">
                    <div>
                        <span className="reviews-console-badge">Review Moderation</span>
                        <h2>Customer Reviews</h2>
                        <p>
                            Review customer submissions and approve them before they appear on product pages.
                        </p>
                    </div>
                </div>

                <div className="reviews-filters">
                    <button
                        type="button"
                        className={statusFilter === "pending" ? "review-filter active" : "review-filter"}
                        onClick={() => setStatusFilter("pending")}
                    >
                        Pending Approval
                    </button>

                    <button
                        type="button"
                        className={statusFilter === "approved" ? "review-filter active" : "review-filter"}
                        onClick={() => setStatusFilter("approved")}
                    >
                        Approved
                    </button>

                    <button
                        type="button"
                        className={statusFilter === "rejected" ? "review-filter active" : "review-filter"}
                        onClick={() => setStatusFilter("rejected")}
                    >
                        Rejected
                    </button>
                </div>

                {message && (
                    <div className={`reviews-message ${messageType}`}>
                        {message}
                    </div>
                )}

                {loading ? (
                    <div className="reviews-empty-card">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                    <div className="reviews-empty-card">
                        <h3>No {getStatusLabel(statusFilter).toLowerCase()} reviews</h3>
                        <p>
                            There are currently no reviews in this section.
                        </p>
                    </div>
                ) : (
                    <div className="reviews-list">
                        {reviews.map((review) => {
                            const productImage = getProductImage(review.product);

                            return (
                                <article className="admin-review-card" key={review._id}>
                                    <div className="admin-review-product">
                                        {productImage ? (
                                            <img
                                                src={productImage}
                                                alt={review.product?.name || "Product"}
                                            />
                                        ) : (
                                            <div className="admin-review-image-placeholder">
                                                No image
                                            </div>
                                        )}

                                        <div>
                                            <span className="admin-review-label">Product</span>
                                            <h3>{review.product?.name || "Product unavailable"}</h3>
                                            <p>Submitted {formatDate(review.createdAt)}</p>
                                        </div>
                                    </div>

                                    <div className="admin-review-content">
                                        <div className="admin-review-rating">
                                            {renderStars(review.rating)}
                                            <strong>{review.rating}/5</strong>
                                        </div>

                                        <h4>{review.title}</h4>
                                        <p className="admin-review-comment">{review.comment}</p>

                                        <div className="admin-review-customer">
                                            <span>Customer</span>
                                            <strong>{review.user?.name || "Unknown customer"}</strong>
                                            <small>{review.user?.email || "—"}</small>
                                        </div>

                                        {review.images?.length > 0 && (
                                            <div className="admin-review-photo-count">
                                                {review.images.length} customer photo{review.images.length === 1 ? "" : "s"} attached
                                            </div>
                                        )}
                                    </div>

                                    <div className="admin-review-actions">
                                        <span className={`admin-review-status ${review.status}`}>
                                            {getStatusLabel(review.status)}
                                        </span>

                                        {review.status === "pending" && (
                                            <button
                                                type="button"
                                                className="admin-review-manage-button"
                                                onClick={() => openModerationModal(review)}
                                            >
                                                Review Submission
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {showModal && selectedReview && (
                    <div className="admin-review-modal-backdrop" onMouseDown={closeModerationModal}>
                        <div
                            className="admin-review-modal"
                            onMouseDown={(event) => event.stopPropagation()}
                        >
                            <div className="admin-review-modal-header">
                                <div>
                                    <span className="reviews-console-badge">Moderation</span>
                                    <h3>Review Submission</h3>
                                </div>

                                <button
                                    type="button"
                                    className="admin-review-close-button"
                                    onClick={closeModerationModal}
                                    disabled={Boolean(actionLoading)}
                                    aria-label="Close review moderation"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="admin-review-modal-product">
                                <strong>{selectedReview.product?.name || "Product unavailable"}</strong>
                                <span>
                                    Submitted by {selectedReview.user?.name || "Unknown customer"} · {selectedReview.user?.email || "—"}
                                </span>
                            </div>

                            <div className="admin-review-modal-rating">
                                {renderStars(selectedReview.rating)}
                                <strong>{selectedReview.rating}/5</strong>
                            </div>

                            <h4>{selectedReview.title}</h4>
                            <p className="admin-review-modal-comment">{selectedReview.comment}</p>

                            {selectedReview.images?.length > 0 && (
                                <div className="admin-review-modal-photos">
                                    {selectedReview.images.map((image, index) => (
                                        <img
                                            key={`${image}-${index}`}
                                            src={
                                                image.startsWith("http")
                                                    ? image
                                                    : `${API_BASE_URL}${image.startsWith("/") ? image : `/${image}`}`
                                            }
                                            alt={`Customer review photo ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            )}

                            <label className="admin-review-note-label" htmlFor="moderation-note">
                                Moderation note <span>(optional)</span>
                            </label>
                            <textarea
                                id="moderation-note"
                                value={moderationNote}
                                onChange={(event) => setModerationNote(event.target.value)}
                                maxLength={1000}
                                placeholder="Add a note for the moderation record..."
                                disabled={Boolean(actionLoading)}
                            />

                            <div className="admin-review-modal-actions">
                                <button
                                    type="button"
                                    className="admin-review-reject-button"
                                    onClick={() => moderateReview("rejected")}
                                    disabled={Boolean(actionLoading)}
                                >
                                    {actionLoading === "rejected" ? "Rejecting..." : "Reject Review"}
                                </button>

                                <button
                                    type="button"
                                    className="admin-review-approve-button"
                                    onClick={() => moderateReview("approved")}
                                    disabled={Boolean(actionLoading)}
                                >
                                    {actionLoading === "approved" ? "Approving..." : "Approve Review"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

export default Reviews;