import "../../styles/Login.css";
import { useState } from "react";
import { loginUser } from "../../services/authApi";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";

function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const navigate = useNavigate();

    async function handleSubmit(event) {
        event.preventDefault();

        setMessage("");

        if (!email || !password) {
            setMessage("Email and password are required");
            setMessageType("error");
            return;
        }

        try {
            const response = await loginUser(email, password);

            localStorage.setItem(
                "token",
                response.data.token
            );

            console.log(response.data);

            setMessage(response.data.message);
            setMessageType("success");

            setTimeout(() => {
                navigate("/");
            }, 500);

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Something went wrong"
            );
            setMessageType("error");
        }
    }

    function handleForgotPassword() {
        navigate("/forgot-password");
    }

    function handleSignUp() {
        navigate("/register");
    }

    return (
        <>
            <Header />

            <div className="login-page">
                <div className="login-card">

                    <h1>Welcome Back</h1>

                    <p>
                        Sign in to your AquaCart account.
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

                        <div className="form-group">
                            <label>Password</label>

                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                            />
                        </div>

                        <p
                            className="forgot-password"
                            onClick={handleForgotPassword}
                        >
                            Forgot Password?
                        </p>

                        <button type="submit">
                            Sign In →
                        </button>

                    </form>

                    <p className="register-link">
                        Don't have an account?{" "}
                        <span onClick={handleSignUp}>
                            Sign Up
                        </span>
                    </p>

                </div>
            </div>

            <Footer />
        </>
    );
}

export default Login;