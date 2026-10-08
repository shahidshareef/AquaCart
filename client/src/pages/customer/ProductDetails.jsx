import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import "../../styles/ProductDetails.css";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";

function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [selectedImage, setSelectedImage] = useState("");
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [reviews, setReviews] = useState([]);
    const [cartMessage, setCartMessage] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchProduct() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `http://localhost:5000/api/products/${id}`
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Failed to fetch product"
                    );
                }

                setProduct(result.data);

                if (result.data.images?.length > 0) {
                    setSelectedImage(result.data.images[0]);
                }

                if (result.data.variants?.length > 0) {
                    setSelectedVariant(result.data.variants[0]);
                }

                const relatedResponse = await fetch(
                    `http://localhost:5000/api/products/${id}/related`
                );

                const relatedResult = await relatedResponse.json();

                if (relatedResponse.ok) {
                    setRelatedProducts(relatedResult.data);
                }

                const reviewsResponse = await fetch(
                    `http://localhost:5000/api/products/${id}/reviews`
                );

                const reviewsResult = await reviewsResponse.json();

                if (reviewsResponse.ok) {
                    setReviews(reviewsResult.data);
                }

            } catch (error) {
                console.error(error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        fetchProduct();
    }, [id]);

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
        if (!selectedVariant) {
            return;
        }

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

            const response = await fetch(
                "http://localhost:5000/api/cart",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        productId: product._id,
                        variantId: selectedVariant._id,
                        quantity: quantity
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to add item to cart"
                );
            }

            if (result.alreadyInCart) {
                setCartMessage(
                    "This item is already in your cart. Quantity updated."
                );
            } else {
                setCartMessage(
                    "Item added to cart successfully."
                );
            }

            setTimeout(() => {
                setCartMessage("");
            }, 3000);

        } catch (error) {
            console.error(error);

            setCartMessage(
                error.message || "Failed to add item to cart."
            );

            setTimeout(() => {
                setCartMessage("");
            }, 3000);
        }
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

                {/* Breadcrumb */}
                <div className="product-details-breadcrumb">
                    <Link to="/">
                        <span>⌂</span> Home
                    </Link>

                    <span className="breadcrumb-separator">/</span>

                    <Link to="/products">
                        Products
                    </Link>

                    <span className="breadcrumb-separator">/</span>

                    {product.category?.name && (
                        <>
                            <span className="breadcrumb-category">
                                {product.category.name}
                            </span>

                            <span className="breadcrumb-separator">
                                /
                            </span>
                        </>
                    )}

                    <span className="breadcrumb-current">
                        {product.name}
                    </span>
                </div>

                {/* Main Product View */}
                <section className="product-details-container">

                    {/* Left: Product Gallery */}
                    <div className="product-details-gallery">
                        <div className="product-details-main-image">
                            <img
                                src={
                                    selectedImage
                                        ? `http://localhost:5000${selectedImage}`
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
                                            src={`http://localhost:5000${image}`}
                                            alt={product.name}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Product Information */}
                    <div className="product-details-info">

                        <h1>{product.name}</h1>

                        {selectedVariant && (
                            <p className="product-details-price">
                                ₹{selectedVariant.price}
                            </p>
                        )}

                        <p className="product-details-description">
                            {product.description}
                        </p>

                        {/* Variant Selector */}
                        <div className="product-details-variant-section">
                            <h3>Select Size:</h3>

                            <div className="product-details-variants">
                                {product.variants?.map((variant) => (
                                    <button
                                        type="button"
                                        key={variant._id}
                                        className={
                                            selectedVariant?._id ===
                                                variant._id
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

                        {/* Stock */}
                        {selectedVariant && (
                            <p className="product-details-stock">
                                In Stock: {selectedVariant.stock} items
                                available
                            </p>
                        )}

                        {/* Quantity + Cart */}
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

                        {/* Cart Message */}
                        {cartMessage && (
                            <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                                {cartMessage}
                            </div>
                        )}

                    </div>
                </section>

                {/* Customer Reviews */}
                <section className="product-reviews-section">
                    <h2>Customer Reviews</h2>

                    {reviews.length === 0 ? (
                        <p className="product-reviews-message">
                            No reviews yet.
                        </p>
                    ) : (
                        <div className="product-reviews-list">

                            {reviews.map((review) => (
                                <div
                                    className="product-review"
                                    key={review._id}
                                >
                                    <div className="product-review-header">

                                        <h3>
                                            {review.user?.name || "Customer"}
                                        </h3>

                                        <div className="product-review-rating">
                                            {"★".repeat(review.rating)}
                                            {"☆".repeat(5 - review.rating)}
                                        </div>

                                    </div>

                                    {review.comment && (
                                        <p className="product-review-comment">
                                            {review.comment}
                                        </p>
                                    )}

                                </div>
                            ))}

                        </div>
                    )}
                </section>

                {/* Related Products */}
                <section className="related-products-section">
                    <h2>Related Products</h2>

                    {relatedProducts.length === 0 ? (
                        <p className="related-products-message">
                            No related products available.
                        </p>
                    ) : (
                        <div className="related-products-grid">

                            {relatedProducts.map((relatedProduct) => {
                                const firstVariant =
                                    relatedProduct.variants?.[0];

                                return (
                                    <div
                                        className="related-product-card"
                                        key={relatedProduct._id}
                                    >
                                        <div className="related-product-image">
                                            <img
                                                src={
                                                    relatedProduct.images
                                                        ?.length > 0
                                                        ? `http://localhost:5000${relatedProduct.images[0]}`
                                                        : "/images/1.png"
                                                }
                                                alt={relatedProduct.name}
                                            />
                                        </div>

                                        <div className="related-product-info">

                                            <h3>
                                                {relatedProduct.name}
                                            </h3>

                                            {firstVariant && (
                                                <p className="related-product-size">
                                                    Size:{" "}
                                                    {firstVariant.size}
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

            <Footer />
        </>
    );
}

export default ProductDetails;