import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import "../../styles/CustomerReviews.css";

const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const RATING_FILTERS = [
    { value: "all", label: "All ratings" },
    { value: "5", label: "5 stars" },
    { value: "4", label: "4 stars" },
    { value: "3", label: "3 stars" },
    { value: "2", label: "2 stars" },
    { value: "1", label: "1 star" },
];

function CustomerReviews() {
    const [reviews, setReviews] = useState([]);
    const [selectedRating, setSelectedRating] = useState("all");
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchReviews() {
            setLoading(true);
            setErrorMessage("");

            try {
                const query =
                    selectedRating === "all"
                        ? ""
                        : `?rating=${encodeURIComponent(selectedRating)}`;

                const response = await fetch(
                    `${API_BASE_URL}/api/reviews${query}`,
                    { signal: controller.signal }
                );

                const result = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        result.message || "Unable to load customer reviews."
                    );
                }

                setReviews(Array.isArray(result.data) ? result.data : []);
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("Failed to fetch customer reviews:", error);
                    setErrorMessage(
                        error.message || "Unable to load customer reviews."
                    );
                    setReviews([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        fetchReviews();

        return () => controller.abort();
    }, [selectedRating, refreshKey]);

    function getProductImage(product) {
        const image = product?.images?.[0];

        if (typeof image !== "string" || !image.trim()) {
            return "";
        }

        if (/^https?:\/\//i.test(image)) {
            return image;
        }

        return `${API_BASE_URL}${image.startsWith("/") ? image : `/${image}`}`;
    }

    function formatDate(value) {
        if (!value) return "";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "";

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    function renderStars(rating) {
        const value = Number(rating) || 0;

        return (
            <span
                className="customer-review-stars"
                aria-label={`${value} out of 5 stars`}
            >
                {Array.from({ length: 5 }, (_, index) => (
                    <span
                        key={index}
                        className={index < value ? "filled" : ""}
                    >
                        ★
                    </span>
                ))}
            </span>
        );
    }

    return (
        <div className="customer-reviews-page">
            <Header />

            <main className="customer-reviews-main">
                <section className="customer-reviews-hero">
                    <span className="customer-reviews-eyebrow">
                        REAL CUSTOMER EXPERIENCES
                    </span>
                    <h1>What our customers say</h1>
                    <p>
                        Honest feedback from customers who have purchased from AquaCart.
                    </p>
                </section>

                <section
                    className="customer-reviews-content"
                    aria-label="Customer reviews"
                >
                    <div className="customer-reviews-toolbar">
                        <div>
                            <h2>Customer reviews</h2>
                            <p>Highest ratings are shown first.</p>
                        </div>

                        <label className="customer-review-filter">
                            <span>Filter by rating</span>
                            <select
                                value={selectedRating}
                                onChange={(event) =>
                                    setSelectedRating(event.target.value)
                                }
                            >
                                {RATING_FILTERS.map((filter) => (
                                    <option
                                        key={filter.value}
                                        value={filter.value}
                                    >
                                        {filter.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {loading ? (
                        <div className="customer-reviews-state">
                            Loading customer reviews…
                        </div>
                    ) : errorMessage ? (
                        <div
                            className="customer-reviews-state error"
                            role="alert"
                        >
                            <p>{errorMessage}</p>
                            <button
                                type="button"
                                onClick={() =>
                                    setRefreshKey((value) => value + 1)
                                }
                            >
                                Try again
                            </button>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="customer-reviews-state">
                            <span className="customer-reviews-empty-icon">
                                ☆
                            </span>
                            <h3>No reviews found</h3>
                            <p>
                                {selectedRating === "all"
                                    ? "There are no approved customer reviews yet. Please check back soon."
                                    : `There are no approved ${selectedRating}-star reviews yet.`}
                            </p>

                            {selectedRating !== "all" && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedRating("all")}
                                >
                                    Show all ratings
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="customer-reviews-list">
                            {reviews.map((review) => {
                                const image = getProductImage(review.product);
                                const productId = review.product?._id;
                                const customerName =
                                    review.user?.name || "AquaCart customer";

                                return (
                                    <article
                                        className="customer-review-card"
                                        key={review._id}
                                    >
                                        <div className="customer-review-product">
                                            {image ? (
                                                <img
                                                    src={image}
                                                    alt={
                                                        review.product?.name ||
                                                        "Reviewed product"
                                                    }
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div
                                                    className="customer-review-product-placeholder"
                                                    aria-hidden="true"
                                                >
                                                    💧
                                                </div>
                                            )}

                                            <div className="customer-review-product-info">
                                                <span className="customer-review-product-label">
                                                    REVIEWED PRODUCT
                                                </span>

                                                {productId ? (
                                                    <Link
                                                        to={`/products/${productId}`}
                                                        className="customer-review-product-name"
                                                    >
                                                        {review.product?.name ||
                                                            "Product unavailable"}
                                                    </Link>
                                                ) : (
                                                    <strong className="customer-review-product-name">
                                                        {review.product?.name ||
                                                            "Product unavailable"}
                                                    </strong>
                                                )}

                                                <span className="customer-review-date">
                                                    {formatDate(review.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="customer-review-body">
                                            <div className="customer-review-rating-row">
                                                {renderStars(review.rating)}
                                                <strong>
                                                    {Number(review.rating)}.0 / 5
                                                </strong>
                                            </div>

                                            <h3>{review.title}</h3>

                                            <p className="customer-review-comment">
                                                {review.comment}
                                            </p>

                                            {Array.isArray(review.images) &&
                                                review.images.length > 0 && (
                                                    <div className="customer-review-photos">
                                                        {review.images.map(
                                                            (reviewImage, index) => {
                                                                const photoUrl =
                                                                    /^https?:\/\//i.test(
                                                                        reviewImage
                                                                    )
                                                                        ? reviewImage
                                                                        : `${API_BASE_URL}${reviewImage.startsWith("/") ? reviewImage : `/${reviewImage}`}`;

                                                                return (
                                                                    <a
                                                                        href={photoUrl}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        key={`${review._id}-photo-${index}`}
                                                                    >
                                                                        <img
                                                                            src={photoUrl}
                                                                            alt={`Customer review photo ${index + 1}`}
                                                                            loading="lazy"
                                                                        />
                                                                    </a>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                )}

                                            <div className="customer-review-author">
                                                <span
                                                    className="customer-review-avatar"
                                                    aria-hidden="true"
                                                >
                                                    {customerName
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>

                                                <span>
                                                    <strong>{customerName}</strong>
                                                    <small>
                                                        Verified purchase review
                                                    </small>
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default CustomerReviews;