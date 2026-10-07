import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Home.css";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";

function Home() {
    const navigate = useNavigate();

    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFeaturedProducts() {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/products/featured"
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Failed to fetch products"
                    );
                }

                setFeaturedProducts(result.data);
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        }

        fetchFeaturedProducts();
    }, []);

    return (
        <>
            <Header />

            <main className="home-page">

                {/* Hero Section */}
                <section className="home-hero">
                    <div className="home-hero-content">
                        <span className="home-hero-tag">
                            ENGINEERED FOR PURE HYDRATION
                        </span>

                        <h1>
                            Stay Hydrated.
                            <br />
                            Stay Stylish.
                        </h1>

                        <p>
                            Premium double-walled surgical steel bottles
                            designed to keep your drinks cold for 24 hours
                            and hot for 12 hours.
                        </p>

                        <button type="button">
                            Shop Now →
                        </button>
                    </div>

                    <div className="home-hero-image">
                        <img
                            src="/images/1.png"
                            alt="AquaCart stainless steel water bottle"
                        />
                    </div>
                </section>


                {/* Feature Highlights */}
                <section className="home-features">

                    <div className="home-feature-card">
                        <div className="feature-icon">🚚</div>

                        <div>
                            <h3>Free Shipping</h3>
                            <p>Complimentary above ₹999</p>
                        </div>
                    </div>

                    <div className="home-feature-card">
                        <div className="feature-icon">🌡️</div>

                        <div>
                            <h3>TempShield™ Tech</h3>
                            <p>24h Cold - 12h Hot</p>
                        </div>
                    </div>

                    <div className="home-feature-card">
                        <div className="feature-icon">🛡️</div>

                        <div>
                            <h3>Lifetime Guarantee</h3>
                            <p>Protected against thermal defects</p>
                        </div>
                    </div>

                    <div className="home-feature-card">
                        <div className="feature-icon">🌿</div>

                        <div>
                            <h3>Eco-Friendly</h3>
                            <p>100% Recyclable 18/8 Steel</p>
                        </div>
                    </div>

                </section>


                {/* Featured Products */}
                <section className="home-featured-products">

                    <div className="featured-products-header">

                        <div>
                            <span className="section-label">
                                CURATED COLLECTION
                            </span>

                            <h2>Featured Bottles</h2>

                            <p>
                                Crafted with premium triple-insulated steel
                                and sweat-proof exterior coatings.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="view-all-products"
                            onClick={() => navigate("/products")}
                        >
                            View All Products →
                        </button>

                    </div>


                    <div className="featured-products-grid">

                        {loading ? (
                            <p>Loading featured products...</p>
                        ) : featuredProducts.length === 0 ? (
                            <p>No featured products available.</p>
                        ) : (
                            featuredProducts.map((product) => {

                                const firstVariant = product.variants?.[0];

                                return (
                                    <div
                                        className="featured-product-card"
                                        key={product._id}
                                    >

                                        <img
                                            className="featured-product-image"
                                            src={
                                                product.images?.length > 0
                                                    ? `http://localhost:5000${product.images[0]}`
                                                    : "/images/1.png"
                                            }
                                            alt={product.name}
                                        />


                                        <div className="featured-product-info">

                                            <h3>
                                                {product.name}
                                            </h3>

                                            {firstVariant && (
                                                <p className="featured-product-meta">
                                                    {firstVariant.size}
                                                </p>
                                            )}

                                            {firstVariant && (
                                                <div className="featured-product-bottom">

                                                    <p className="featured-product-price">
                                                        ₹{firstVariant.price}
                                                    </p>

                                                    <button
                                                        type="button"
                                                        className="featured-product-button"
                                                        onClick={() =>
                                                            navigate(
                                                                `/products/${product._id}`
                                                            )
                                                        }
                                                    >
                                                        View Product
                                                    </button>

                                                </div>
                                            )}

                                        </div>

                                    </div>
                                );
                            })
                        )}

                    </div>

                </section>

            </main>

            <Footer />
        </>
    );
}

export default Home;