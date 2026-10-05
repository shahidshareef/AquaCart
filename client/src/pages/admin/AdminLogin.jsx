import "../../styles/AdminLogin.css";
import { useState } from "react";
import { adminLogin } from "../../services/authApi";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";

function AdminLogin() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    async function handleSubmit(event) {

        event.preventDefault();

        setMessage("");

        if (!email || !password) {
            setMessage("Email and password are required");
            setMessageType("error");
            return;
        }

        try {

            const response = await adminLogin(
                email,
                password
            );

            console.log(
                "ADMIN LOGIN RESPONSE:",
                response.data
            );

            setMessage(response.data.message);
            setMessageType("success");

            setTimeout(() => {
                navigate("/admin/verify-otp", {
                    state: {
                        email: email
                    }
                });
            }, 500);

        } catch (error) {

            console.log(
                "ADMIN LOGIN ERROR:",
                error.response?.data
            );

            setMessage(
                error.response?.data?.message ||
                "Something went wrong"
            );

            setMessageType("error");
        }
    }

    return (
        <>
            <Header />

            <div className="admin-login-page">

                <div className="admin-login-card">

                    <h1>Admin Login</h1>

                    <p>
                        Sign in to your AquaCart admin account.
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
                                placeholder="Enter admin email"
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

                        <button type="submit">
                            Sign In →
                        </button>

                    </form>

                </div>

            </div>

            <Footer />
        </>
    );
}

export default AdminLogin;