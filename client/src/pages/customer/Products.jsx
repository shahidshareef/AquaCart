import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Products.css";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import { API_BASE_URL } from "../../config/apiConfig.js";

function Products() {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [sort, setSort] = useState("featured");

    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalProducts: 0,
        limit: 9,
    });

    useEffect(() => {
        const controller = new AbortController();

        async function fetchCategories() {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/products/categories`,
                    { signal: controller.signal }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Failed to fetch categories."
                    );
                }

                setCategories(
                    (result.data || []).filter(
                        (category) => category.status === "active"
                    )
                );
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("Failed to fetch categories:", error);
                }
            }
        }

        fetchCategories();

        return () => controller.abort();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedCategory, sort]);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchProducts() {
            setLoading(true);
            setError("");

            try {
                const params = new URLSearchParams();

                if (search.trim()) {
                    params.append("search", search.trim());
                }

                if (selectedCategory) {
                    params.append("category", selectedCategory);
                }

                if (sort !== "featured") {
                    params.append("sort", sort);
                }

                params.append("page", currentPage);
                params.append("limit", 9);

                const response = await fetch(
                    `${API_BASE_URL}/api/products?${params.toString()}`,
                    { signal: controller.signal }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Failed to fetch products."
                    );
                }

                setProducts(Array.isArray(result.data) ? result.data : []);
                setPagination(
                    result.pagination || {
                        currentPage: 1,
                        totalPages: 1,
                        totalProducts: 0,
                        limit: 9,
                    }
                );
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("Failed to fetch products:", error);
                    setProducts([]);
                    setError(
                        "Unable to load products. Please refresh the page and try again."
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        fetchProducts();

        return () => controller.abort();
    }, [search, selectedCategory, sort, currentPage]);

    return (
        <>
            <Header />

            <main className="products-page">
                <section className="products-header">
                    <div className="products-breadcrumb">
                        COLLECTION / WATER BOTTLES
                    </div>

                    <h1>Steel Water Bottles</h1>

                    <p>
                        Find the right bottle for you. Engineered with
                        double-walled surgical stainless steel to keep drinks
                        icy cold for 24h or steaming hot for 12h.
                    </p>
                </section>

                <section className="products-section">
                    <div className="products-toolbar">
                        <div className="products-search">
                            <span className="search-icon">⌕</span>

                            <input
                                type="text"
                                placeholder="Search products (e.g. Navy, 750ml, Ceramic...)"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                            />
                        </div>

                        <div className="products-sort-area">
                            <label htmlFor="product-sort">Sort by:</label>

                            <select
                                id="product-sort"
                                value={sort}
                                onChange={(event) =>
                                    setSort(event.target.value)
                                }
                            >
                                <option value="featured">Featured</option>
                                <option value="newest">Newest</option>
                                <option value="price-low">
                                    Price: Low to High
                                </option>
                                <option value="price-high">
                                    Price: High to Low
                                </option>
                            </select>

                            <span className="products-count">
                                • {pagination.totalProducts} Products Available
                            </span>
                        </div>
                    </div>

                    <div className="products-filters">
                        <button
                            type="button"
                            className={
                                selectedCategory === ""
                                    ? "filter-chip active"
                                    : "filter-chip"
                            }
                            onClick={() => setSelectedCategory("")}
                        >
                            All Bottles
                        </button>

                        {categories.map((category) => (
                            <button
                                type="button"
                                key={category._id}
                                className={
                                    selectedCategory === category._id
                                        ? "filter-chip active"
                                        : "filter-chip"
                                }
                                onClick={() =>
                                    setSelectedCategory(category._id)
                                }
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <p className="products-message">
                            Loading products...
                        </p>
                    ) : error ? (
                        <p className="products-message">{error}</p>
                    ) : products.length === 0 ? (
                        <p className="products-message">
                            No products available.
                        </p>
                    ) : (
                        <div className="products-grid">
                            {products.map((product) => {
                                const firstVariant = product.variants?.[0];
                                const imagePath = product.images?.[0];

                                const imageUrl = imagePath
                                    ? /^https?:\/\//i.test(imagePath)
                                        ? imagePath
                                        : `${API_BASE_URL}${
                                              imagePath.startsWith("/")
                                                  ? ""
                                                  : "/"
                                          }${imagePath}`
                                    : "/images/1.png";

                                return (
                                    <article
                                        className="product-card"
                                        key={product._id}
                                    >
                                        <div className="product-image">
                                            <img
                                                src={imageUrl}
                                                alt={product.name}
                                                onError={(event) => {
                                                    event.currentTarget.onerror =
                                                        null;
                                                    event.currentTarget.src =
                                                        "/images/1.png";
                                                }}
                                            />
                                        </div>

                                        <div className="product-info">
                                            {firstVariant && (
                                                <p className="product-specification">
                                                    {firstVariant.size} ·
                                                    SURGICAL-GRADE 18/8
                                                </p>
                                            )}

                                            <h2>{product.name}</h2>

                                            {firstVariant && (
                                                <p className="product-price">
                                                    ₹{firstVariant.price}
                                                </p>
                                            )}

                                            {firstVariant && (
                                                <p
                                                    className={
                                                        firstVariant.stock > 0
                                                            ? "product-availability"
                                                            : "product-availability out-of-stock"
                                                    }
                                                >
                                                    •{" "}
                                                    {firstVariant.stock > 0
                                                        ? `In Stock · ${firstVariant.stock} units available`
                                                        : "Out of Stock"}
                                                </p>
                                            )}

                                            <button
                                                type="button"
                                                className="view-details-button"
                                                onClick={() =>
                                                    navigate(
                                                        `/products/${product._id}`
                                                    )
                                                }
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                <section className="products-pagination">
                    <p>
                        Showing{" "}
                        {pagination.totalProducts === 0
                            ? 0
                            : (pagination.currentPage - 1) *
                                  pagination.limit +
                              1}{" "}
                        –{" "}
                        {Math.min(
                            pagination.currentPage * pagination.limit,
                            pagination.totalProducts
                        )}{" "}
                        of {pagination.totalProducts} products
                    </p>

                    <div className="pagination-controls">
                        <button
                            type="button"
                            disabled={pagination.currentPage <= 1}
                            onClick={() =>
                                setCurrentPage(
                                    Math.max(1, pagination.currentPage - 1)
                                )
                            }
                        >
                            &lt; Previous
                        </button>

                        {Array.from(
                            { length: pagination.totalPages },
                            (_, index) => index + 1
                        ).map((page) => (
                            <button
                                type="button"
                                key={page}
                                className={
                                    pagination.currentPage === page
                                        ? "active"
                                        : ""
                                }
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            type="button"
                            disabled={
                                pagination.currentPage >=
                                pagination.totalPages
                            }
                            onClick={() =>
                                setCurrentPage(
                                    pagination.currentPage + 1
                                )
                            }
                        >
                            Next &gt;
                        </button>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}

export default Products;