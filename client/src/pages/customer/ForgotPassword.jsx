import { useState } from "react";
import "../../styles/ForgotPassword.css";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import { forgotPassword } from "../../services/authApi";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {

    const [email, setEmail] = useState("");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const navigate = useNavigate();

    async function handleSubmit(event) {

        event.preventDefault();

        setMessage("");

        if (!email) {
            setMessage("Email is required");
            setMessageType("error");
            return;
        }

        try {

            const response = await forgotPassword(email);

            setMessage(response.data.message);
            setMessageType("success");

        } catch (error) {

            setMessage(
                error.response?.data?.message ||
                "Something went wrong"
            );

            setMessageType("error");
        }
    }

    function handleBackToLogin() {
        navigate("/login");
    }

    return (
        <>
            <Header />

            <div className="forgot-password-page">

                <div className="forgot-password-card">

                    <div className="forgot-password-icon">
                        🔑
                    </div>

                    <h1>Forgot Password?</h1>

                    <p>
                        Enter your email address and we'll send you a password
                        reset link.
                    </p>

                    {message && (
                        <div
                            className={`mb-5 rounded-md px-4 py-3 text-sm ${
                                messageType === "error"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                            }`}
                        >
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        <div className="form-group">

                            <label>Email</label>

                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                            />

                        </div>

                        <button type="submit">
                            Send Reset Link →
                        </button>

                    </form>

                    <button
                        type="button"
                        className="back-login"
                        onClick={handleBackToLogin}
                    >
                        ← Back to Login
                    </button>

                </div>

            </div>

            <Footer />
        </>
    );
}

export default ForgotPassword;