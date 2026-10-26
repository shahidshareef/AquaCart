import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import "../../styles/ProductDetails.css";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";

const API_URL = (
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD
        ? "https://aquacart.onrender.com"
        : "http://localhost:5000")
).replace(/\/+$/, "");

const MAX_REVIEW_PHOTOS = 3;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const photoInputRef = useRef(null);

    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [selectedImage, setSelectedImage] = useState("");
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [reviews, setReviews] = useState([]);
    const [reviewEligibility, setReviewEligibility] = useState({
        canReview: false,
        loading: true,
        reason: ""
    });
    const [cartMessage, setCartMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [reviewTitle, setReviewTitle] = useState("");
    const [reviewComment, setReviewComment] = useState("");
    const [reviewPhotos, setReviewPhotos] = useState([]);
    const [reviewError, setReviewError] = useState("");
    const [reviewSuccess, setReviewSuccess] = useState("");
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [selectedReviewImage, setSelectedReviewImage] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function fetchProduct() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(`${API_URL}/api/products/${id}`);
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || "Failed to fetch product");
                }

                if (!isMounted) return;

                setProduct(result.data);
                setSelectedImage(result.data.images?.[0] || "");
                setSelectedVariant(result.data.variants?.[0] || null);

                const [relatedResponse, reviewsResponse] = await Promise.all([
                    fetch(`${API_URL}/api/products/${id}/related`),
                    fetch(`${API_URL}/api/products/${id}/reviews`)
                ]);

                const [relatedResult, reviewsResult] = await Promise.all([
                    relatedResponse.json(),
                    reviewsResponse.json()
                ]);

                if (!isMounted) return;

                if (relatedResponse.ok) {
                    setRelatedProducts(
                        Array.isArray(relatedResult.data)
                            ? relatedResult.data
                            : []
                    );
                }

                if (reviewsResponse.ok) {
                    const fetchedReviews = Array.isArray(reviewsResult.data)
                        ? reviewsResult.data
                        : [];

                    setReviews(
                        fetchedReviews.filter(
                            (review) => review.status === "approved"
                        )
                    );
                }

                const token = localStorage.getItem("token");

                if (token) {
                    try {
                        const eligibilityResponse = await fetch(
                            `${API_URL}/api/reviews/eligibility/${id}`,
                            {
                                method: "GET",
                                cache: "no-store",
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Cache-Control": "no-cache"
                                }
                            }
                        );

                        const eligibilityResult =
                            await eligibilityResponse.json();

                        if (isMounted && eligibilityResponse.ok) {
                            setReviewEligibility({
                                loading: false,
                                ...(eligibilityResult.data || {})
                            });
                        } else if (isMounted) {
                            setReviewEligibility({
                                canReview: false,
                                loading: false,
                                reason: eligibilityResult.message || ""
                            });
                        }
                    } catch {
                        if (isMounted) {
                            setReviewEligibility({
                                canReview: false,
                                loading: false,
                                reason: ""
                            });
                        }
                    }
                } else if (isMounted) {
                    setReviewEligibility({
                        canReview: false,
                        loading: false,
                        reason: ""
                    });
                }
            } catch (fetchError) {
                console.error(fetchError);

                if (isMounted) {
                    setError(fetchError.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchProduct();

        return () => {
            isMounted = false;
        };
    }, [id]);

    useEffect(() => {
        if (
            location.state?.openReview &&
            !loading &&
            product &&
            !reviewEligibility.loading &&
            reviewEligibility.canReview
        ) {
            openReviewModal();
            navigate(location.pathname, {
                replace: true,
                state: {}
            });
        }
    }, [
        location.state,
        location.pathname,
        loading,
        product,
        reviewEligibility.loading,
        reviewEligibility.canReview
    ]);

    const ratingSummary = useMemo(() => {
        const count = reviews.length;

        const total = reviews.reduce(
            (sum, review) => sum + Number(review.rating || 0),
            0
        );

        const breakdown = [5, 4, 3, 2, 1].map((rating) => ({
            rating,
            count: reviews.filter(
                (review) => Number(review.rating) === rating
            ).length
        }));

        return {
            count,
            average: count ? total / count : 0,
            breakdown
        };
    }, [reviews]);

    function handleVariantChange(variant) {
        setSelectedVariant(variant);
        setQuantity(1);
        setCartMessage("");
    }

    function decreaseQuantity() {
        setQuantity((currentQuantity) =>
            Math.max(1, currentQuantity - 1)
        );
    }

    function increaseQuantity() {
        if (!selectedVariant) return;

        setQuantity((currentQuantity) =>
            Math.min(selectedVariant.stock, currentQuantity + 1)
        );
    }

    async function handleAddToCart() {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            setCartMessage("");

            const response = await fetch(`${API_URL}/api/cart`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: product._id,
                    variantId: selectedVariant._id,
                    quantity
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to add item to cart"
                );
            }

            setCartMessage(
                result.alreadyInCart
                    ? "This item is already in your cart. Quantity updated."
                    : "Item added to cart successfully."
            );

            setTimeout(() => setCartMessage(""), 3000);
        } catch (cartError) {
            console.error(cartError);

            setCartMessage(
                cartError.message || "Failed to add item to cart."
            );

            setTimeout(() => setCartMessage(""), 3000);
        }
    }

    function openReviewModal() {
        if (!localStorage.getItem("token")) {
            navigate("/login", {
                state: {
                    from: `/products/${id}`
                }
            });
            return;
        }

        setReviewRating(0);
        setHoveredRating(0);
        setReviewTitle("");
        setReviewComment("");
        setReviewPhotos([]);
        setReviewError("");
        setReviewSuccess("");
        setShowReviewModal(true);
    }

    function handlePhotoSelection(event) {
        const selectedFiles = Array.from(event.target.files || []);

        setReviewError("");

        if (reviewPhotos.length + selectedFiles.length > MAX_REVIEW_PHOTOS) {
            setReviewError(
                `You can upload up to ${MAX_REVIEW_PHOTOS} photos per review.`
            );
            event.target.value = "";
            return;
        }

        for (const file of selectedFiles) {
            if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
                setReviewError("Only JPG, PNG, and WEBP photos are allowed.");
                event.target.value = "";
                return;
            }

            if (file.size > MAX_PHOTO_SIZE) {
                setReviewError("Each photo must be 5 MB or smaller.");
                event.target.value = "";
                return;
            }
        }

        setReviewPhotos((previous) => [...previous, ...selectedFiles]);
        event.target.value = "";
    }

    function removeReviewPhoto(indexToRemove) {
        setReviewPhotos((previous) =>
            previous.filter((_, index) => index !== indexToRemove)
        );
    }

    async function handleSubmitReview(event) {
        event.preventDefault();

        setReviewError("");
        setReviewSuccess("");

        if (!localStorage.getItem("token")) {
            navigate("/login", {
                state: {
                    from: `/products/${id}`
                }
            });
            return;
        }

        if (!reviewRating) {
            setReviewError("Please select a star rating from 1 to 5.");
            return;
        }

        if (!reviewTitle.trim()) {
            setReviewError("Please enter a review title.");
            return;
        }

        if (!reviewComment.trim()) {
            setReviewError("Please write your review.");
            return;
        }

        if (reviewTitle.trim().length > 120) {
            setReviewError("Review title must be 120 characters or fewer.");
            return;
        }

        if (reviewComment.trim().length > 2000) {
            setReviewError("Review must be 2000 characters or fewer.");
            return;
        }

        const token = localStorage.getItem("token");
        const formData = new FormData();

        formData.append("productId", product._id);
        formData.append("rating", String(reviewRating));
        formData.append("title", reviewTitle.trim());
        formData.append("comment", reviewComment.trim());

        reviewPhotos.forEach((photo) => {
            formData.append("images", photo);
        });

        setReviewSubmitting(true);

        try {
            const response = await fetch(`${API_URL}/api/reviews`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Unable to submit your review."
                );
            }

            setReviewSuccess(
                "Your review has been submitted and is awaiting admin approval."
            );

            setReviewTitle("");
            setReviewComment("");
            setReviewRating(0);
            setReviewPhotos([]);

            setReviewEligibility({
                canReview: false,
                loading: false,
                alreadyReviewed: true,
                reason: "You have already submitted a review for this product."
            });
        } catch (submitError) {
            setReviewError(
                submitError.message || "Unable to submit your review."
            );
        } finally {
            setReviewSubmitting(false);
        }
    }

    function formatReviewDate(dateValue) {
        if (!dateValue) return "";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) return "";

        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    function getPhotoUrl(photoPath) {
        if (!photoPath) return "";

        if (/^https?:\/\//i.test(photoPath)) {
            return photoPath;
        }

        const normalizedPath = photoPath.startsWith("/")
            ? photoPath
            : `/${photoPath}`;

        return `${API_URL}${normalizedPath}`;
    }

    if (loading) {
        return (
            <>
                <Header />
                <main className="product-details-page">
                    <p className="product-details-message">
                        Loading product...
                    </p>
                </main>
                <Footer />
            </>
        );
    }

    if (error || !product) {
        return (
            <>
                <Header />
                <main className="product-details-page">
                    <p className="product-details-message">
                        {error || "Product not found."}
                    </p>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />

            <main className="product-details-page">
                <div className="product-details-breadcrumb">
                    <Link to="/">
                        <span>⌂</span> Home
                    </Link>

                    <span className="breadcrumb-separator">/</span>

                    <Link to="/products">Products</Link>

                    <span className="breadcrumb-separator">/</span>

                    {product.category?.name && (
                        <>
                            <span className="breadcrumb-category">
                                {product.category.name}
                            </span>
                            <span className="breadcrumb-separator">/</span>
                        </>
                    )}

                    <span className="breadcrumb-current">
                        {product.name}
                    </span>
                </div>

                <section className="product-details-container">
                    <div className="product-details-gallery">
                        <div className="product-details-main-image">
                            <img
                                src={
                                    selectedImage
                                        ? getPhotoUrl(selectedImage)
                                        : "/images/1.png"
                                }
                                alt={product.name}
                            />
                        </div>

                        {product.images?.length > 0 && (
                            <div className="product-details-thumbnails">
                                {product.images.map((image) => (
                                    <button
                                        type="button"
                                        key={image}
                                        className={
                                            selectedImage === image
                                                ? "product-thumbnail active"
                                                : "product-thumbnail"
                                        }
                                        onClick={() => setSelectedImage(image)}
                                    >
                                        <img
                                            src={getPhotoUrl(image)}
                                            alt={product.name}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="product-details-info">
                        <h1>{product.name}</h1>

                        <div
                            className="product-details-rating-summary"
                            aria-label={`${ratingSummary.average.toFixed(1)} out of 5 stars from ${ratingSummary.count} reviews`}
                        >
                            <span className="product-details-rating-stars">
                                {"★".repeat(Math.round(ratingSummary.average))}
                                {"☆".repeat(
                                    5 - Math.round(ratingSummary.average)
                                )}
                            </span>

                            <strong>
                                {ratingSummary.count
                                    ? ratingSummary.average.toFixed(1)
                                    : "New"}
                            </strong>

                            <a href="#product-reviews">
                                ({ratingSummary.count}{" "}
                                {ratingSummary.count === 1
                                    ? "review"
                                    : "reviews"}
                                )
                            </a>
                        </div>

                        {selectedVariant && (
                            <p className="product-details-price">
                                ₹{selectedVariant.price}
                            </p>
                        )}

                        <p className="product-details-description">
                            {product.description}
                        </p>

                        <div className="product-details-variant-section">
                            <h3>Select Size:</h3>

                            <div className="product-details-variants">
                                {product.variants?.map((variant) => (
                                    <button
                                        type="button"
                                        key={variant._id}
                                        className={
                                            selectedVariant?._id === variant._id
                                                ? "product-variant-button active"
                                                : "product-variant-button"
                                        }
                                        onClick={() =>
                                            handleVariantChange(variant)
                                        }
                                    >
                                        {variant.size} - ₹{variant.price}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedVariant && (
                            <p className="product-details-stock">
                                In Stock: {selectedVariant.stock} items
                                available
                            </p>
                        )}

                        <div className="product-details-actions">
                            <div className="quantity-control">
                                <button
                                    type="button"
                                    onClick={decreaseQuantity}
                                    disabled={quantity <= 1}
                                    aria-label="Decrease quantity"
                                >
                                    −
                                </button>

                                <span>{quantity}</span>

                                <button
                                    type="button"
                                    onClick={increaseQuantity}
                                    disabled={
                                        !selectedVariant ||
                                        quantity >= selectedVariant.stock
                                    }
                                    aria-label="Increase quantity"
                                >
                                    +
                                </button>
                            </div>

                            <button
                                type="button"
                                className="add-to-cart-button"
                                disabled={
                                    !selectedVariant ||
                                    selectedVariant.stock === 0
                                }
                                onClick={handleAddToCart}
                            >
                                Add to Cart
                            </button>
                        </div>

                        {cartMessage && (
                            <div className="product-cart-message">
                                {cartMessage}
                            </div>
                        )}
                    </div>
                </section>

                <section
                    className="product-reviews-section"
                    id="product-reviews"
                >
                    <div className="product-reviews-title-row">
                        <div>
                            <h2>Customer Reviews</h2>
                            <p>Reviews for {product.name}</p>
                        </div>
                    </div>

                    <div className="product-reviews-overview">
                        <div className="product-reviews-average">
                            <strong>
                                {ratingSummary.count
                                    ? ratingSummary.average.toFixed(1)
                                    : "—"}
                            </strong>

                            <span className="product-details-rating-stars">
                                {"★".repeat(Math.round(ratingSummary.average))}
                                {"☆".repeat(
                                    5 - Math.round(ratingSummary.average)
                                )}
                            </span>

                            <span>
                                {ratingSummary.count}{" "}
                                {ratingSummary.count === 1
                                    ? "review"
                                    : "reviews"}
                            </span>
                        </div>

                        <div className="product-rating-breakdown">
                            {ratingSummary.breakdown.map(
                                ({ rating, count }) => (
                                    <div
                                        className="product-rating-breakdown-row"
                                        key={rating}
                                    >
                                        <span>
                                            {rating} star
                                            {rating !== 1 ? "s" : ""}
                                        </span>

                                        <div className="product-rating-track">
                                            <span
                                                style={{
                                                    width: `${
                                                        ratingSummary.count
                                                            ? (count /
                                                                  ratingSummary.count) *
                                                              100
                                                            : 0
                                                    }%`
                                                }}
                                            />
                                        </div>

                                        <span>{count}</span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {reviews.length === 0 ? (
                        <p className="product-reviews-message">
                            No reviews yet. Be the first to share your
                            experience.
                        </p>
                    ) : (
                        <div className="product-reviews-list">
                            {reviews.map((review) => (
                                <article
                                    className="product-review"
                                    key={review._id}
                                >
                                    <div className="product-review-header">
                                        <div>
                                            <h3>
                                                {review.user?.name || "Customer"}
                                            </h3>
                                            <span className="product-review-date">
                                                {formatReviewDate(
                                                    review.createdAt
                                                )}
                                            </span>
                                        </div>

                                        <div
                                            className="product-review-rating"
                                            aria-label={`${review.rating} out of 5 stars`}
                                        >
                                            {"★".repeat(
                                                Number(review.rating) || 0
                                            )}
                                            {"☆".repeat(
                                                5 - (Number(review.rating) || 0)
                                            )}
                                        </div>
                                    </div>

                                    {review.title && (
                                        <h4 className="product-review-title">
                                            {review.title}
                                        </h4>
                                    )}

                                    {(review.comment || review.body) && (
                                        <p className="product-review-comment">
                                            {review.comment || review.body}
                                        </p>
                                    )}

                                    {Array.isArray(review.images) &&
                                        review.images.length > 0 && (
                                            <div className="product-review-photos">
                                                {review.images.map(
                                                    (photo, index) => (
                                                        <button
                                                            type="button"
                                                            className="product-review-photo-button"
                                                            key={`${photo}-${index}`}
                                                            onClick={() =>
                                                                setSelectedReviewImage(
                                                                    getPhotoUrl(photo)
                                                                )
                                                            }
                                                            aria-label={`Open review photo ${index + 1}`}
                                                        >
                                                            <img
                                                                src={getPhotoUrl(photo)}
                                                                alt={`Customer review ${index + 1}`}
                                                                loading="lazy"
                                                            />
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        )}
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {selectedReviewImage && (
                    <div
                        className="review-image-modal-backdrop"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Review image preview"
                        onClick={() => setSelectedReviewImage("")}
                    >
                        <div
                            className="review-image-modal"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <button
                                type="button"
                                className="review-image-modal-close"
                                onClick={() => setSelectedReviewImage("")}
                                aria-label="Close image preview"
                            >
                                ×
                            </button>

                            <img
                                src={selectedReviewImage}
                                alt="Customer review"
                            />
                        </div>
                    </div>
                )}

                <section className="related-products-section">
                    <h2>Related Products</h2>

                    {relatedProducts.length === 0 ? (
                        <p className="related-products-message">
                            No related products available.
                        </p>
                    ) : (
                        <div className="related-products-grid">
                            {relatedProducts.map((relatedProduct) => {
                                const firstVariant = relatedProduct.variants?.[0];

                                return (
                                    <div
                                        className="related-product-card"
                                        key={relatedProduct._id}
                                    >
                                        <div className="related-product-image">
                                            <img
                                                src={
                                                    relatedProduct.images?.length > 0
                                                        ? getPhotoUrl(
                                                              relatedProduct.images[0]
                                                          )
                                                        : "/images/1.png"
                                                }
                                                alt={relatedProduct.name}
                                            />
                                        </div>

                                        <div className="related-product-info">
                                            <h3>{relatedProduct.name}</h3>

                                            {firstVariant && (
                                                <p className="related-product-size">
                                                    Size: {firstVariant.size}
                                                </p>
                                            )}

                                            {firstVariant && (
                                                <p className="related-product-price">
                                                    ₹{firstVariant.price}
                                                </p>
                                            )}

                                            <button
                                                type="button"
                                                className="related-product-button"
                                                onClick={() =>
                                                    navigate(
                                                        `/products/${relatedProduct._id}`
                                                    )
                                                }
                                            >
                                                View Product
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>

            {showReviewModal && (
                <div
                    className="review-modal-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !reviewSubmitting
                        ) {
                            setShowReviewModal(false);
                        }
                    }}
                >
                    <section
                        className="review-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="write-review-heading"
                    >
                        <div className="review-modal-header">
                            <div>
                                <h2 id="write-review-heading">Write a Review</h2>
                                <p>Share your experience with {product.name}</p>
                            </div>

                            <button
                                type="button"
                                className="review-modal-close"
                                onClick={() => setShowReviewModal(false)}
                                disabled={reviewSubmitting}
                                aria-label="Close review form"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmitReview}>
                            <div className="review-modal-body">
                                {reviewSuccess && (
                                    <div className="review-form-success" role="status">
                                        {reviewSuccess}
                                    </div>
                                )}

                                {!reviewSuccess && (
                                    <>
                                        <div className="review-form-field">
                                            <label>
                                                Overall rating{" "}
                                                <span className="review-required">*</span>
                                            </label>

                                            <div
                                                className="review-star-picker"
                                                onMouseLeave={() => setHoveredRating(0)}
                                            >
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        type="button"
                                                        key={star}
                                                        className={
                                                            (hoveredRating || reviewRating) >= star
                                                                ? "selected"
                                                                : ""
                                                        }
                                                        onMouseEnter={() =>
                                                            setHoveredRating(star)
                                                        }
                                                        onFocus={() =>
                                                            setHoveredRating(star)
                                                        }
                                                        onBlur={() =>
                                                            setHoveredRating(0)
                                                        }
                                                        onClick={() =>
                                                            setReviewRating(star)
                                                        }
                                                        aria-label={`${star} star${star > 1 ? "s" : ""}`}
                                                        aria-pressed={reviewRating === star}
                                                    >
                                                        ★
                                                    </button>
                                                ))}

                                                <span>
                                                    {reviewRating
                                                        ? [
                                                              "",
                                                              "Poor",
                                                              "Fair",
                                                              "Good",
                                                              "Very good",
                                                              "Excellent"
                                                          ][reviewRating]
                                                        : "Select a rating"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="review-form-field">
                                            <label htmlFor="review-title">
                                                Review title{" "}
                                                <span className="review-required">*</span>
                                            </label>

                                            <input
                                                id="review-title"
                                                type="text"
                                                value={reviewTitle}
                                                onChange={(event) =>
                                                    setReviewTitle(event.target.value)
                                                }
                                                maxLength={120}
                                                placeholder="Summarize your experience"
                                                required
                                            />

                                            <small>{reviewTitle.length}/120</small>
                                        </div>

                                        <div className="review-form-field">
                                            <label htmlFor="review-comment">
                                                Your review{" "}
                                                <span className="review-required">*</span>
                                            </label>

                                            <textarea
                                                id="review-comment"
                                                value={reviewComment}
                                                onChange={(event) =>
                                                    setReviewComment(event.target.value)
                                                }
                                                maxLength={2000}
                                                rows={5}
                                                placeholder="What did you like or dislike about this product?"
                                                required
                                            />

                                            <small>{reviewComment.length}/2000</small>
                                        </div>

                                        <div className="review-form-field">
                                            <label>
                                                Photos{" "}
                                                <span className="review-optional">
                                                    (optional, up to 3)
                                                </span>
                                            </label>

                                            <input
                                                ref={photoInputRef}
                                                className="review-photo-input"
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                multiple
                                                onChange={handlePhotoSelection}
                                                disabled={
                                                    reviewPhotos.length >= MAX_REVIEW_PHOTOS
                                                }
                                            />

                                            <button
                                                type="button"
                                                className="review-upload-button"
                                                onClick={() =>
                                                    photoInputRef.current?.click()
                                                }
                                                disabled={
                                                    reviewPhotos.length >= MAX_REVIEW_PHOTOS
                                                }
                                            >
                                                ＋ Add Photos
                                            </button>

                                            <small>
                                                JPG, PNG or WEBP · Maximum 5 MB each
                                            </small>

                                            {reviewPhotos.length > 0 && (
                                                <div className="review-photo-preview-list">
                                                    {reviewPhotos.map((photo, index) => (
                                                        <div
                                                            className="review-photo-preview"
                                                            key={`${photo.name}-${photo.lastModified}-${index}`}
                                                        >
                                                            <img
                                                                src={URL.createObjectURL(photo)}
                                                                alt={`Selected upload ${index + 1}`}
                                                            />

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeReviewPhoto(index)
                                                                }
                                                                aria-label={`Remove photo ${index + 1}`}
                                                            >
                                                                ×
                                                            </button>

                                                            <span>{photo.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {reviewError && (
                                            <p className="review-form-error" role="alert">
                                                {reviewError}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="review-modal-footer">
                                <button
                                    type="button"
                                    className="review-secondary-button"
                                    onClick={() => setShowReviewModal(false)}
                                    disabled={reviewSubmitting}
                                >
                                    {reviewSuccess ? "Close" : "Cancel"}
                                </button>

                                {!reviewSuccess && (
                                    <button
                                        type="submit"
                                        className="review-submit-button"
                                        disabled={reviewSubmitting}
                                    >
                                        {reviewSubmitting
                                            ? "Submitting..."
                                            : "Submit Review"}
                                    </button>
                                )}
                            </div>
                        </form>
                    </section>
                </div>
            )}

            <Footer />
        </>
    );
}

export default ProductDetails;