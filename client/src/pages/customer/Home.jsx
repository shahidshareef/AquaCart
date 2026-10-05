import "../../styles/Home.css";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";

function Home() {
    return (
        <>
            <Header />

            <main className="home-page">
                <section className="home-hero">
                    <div className="home-hero-content">
                        <h1>
                            Stay Hydrated.
                            <br />
                            Stay Better.
                        </h1>

                        <p>
                            Discover premium stainless steel water bottles
                            designed for everyday hydration.
                        </p>

                        <button type="button">
                            Shop Now →
                        </button>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}

export default Home;