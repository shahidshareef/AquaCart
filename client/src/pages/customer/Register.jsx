import "../../styles/Register.css";
import { useState } from "react";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import { registerUser } from "../../services/authApi";
import { useNavigate } from "react-router-dom";

function Register() {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const navigate = useNavigate();

    function handleSignIn() {
        navigate("/login");
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setMessage("");

        if (!name || !email || !phone || !password) {
            setMessage("All fields are required");
            setMessageType("error");
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            setMessage("Please enter a valid email");
            setMessageType("error");
            return;
        }

        const phonePattern = /^[6-9]\d{9}$/;

        if (!phonePattern.test(phone)) {
            setMessage("Please enter a valid 10-digit phone number");
            setMessageType("error");
            return;
        }

        const passwordPattern =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

        if (!passwordPattern.test(password)) {
            setMessage(
                "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character"
            );
            setMessageType("error");
            return;
        }

        try {
            const userData = {
                name,
                email,
                phone,
                password
            };

            const response = await registerUser(userData);

            setMessage(response.data.message);
            setMessageType("success");

            setTimeout(() => {
                navigate("/verify-email", {
                    state: {
                        email: email
                    }
                });
            }, 500);

        } catch (error) {
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

            <div className="register-page">
                <div className="register-card">

                    <h1>Create Your Account</h1>

                    <p>
                        Join AquaCart and start shopping.
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
                            <label>Full Name</label>

                            <input
                                type="text"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                            />
                        </div>

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
                            <label>Phone Number</label>

                            <input
                                type="tel"
                                placeholder="Enter your phone number"
                                value={phone}
                                onChange={(event) =>
                                    setPhone(event.target.value)
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>

                            <input
                                type="password"
                                placeholder="Create a password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                            />
                        </div>

                        <button type="submit">
                            Create Account
                        </button>

                    </form>

                    <p>
                        Already have an account?{" "}
                        <span onClick={handleSignIn}>
                            Sign In
                        </span>
                    </p>

                </div>
            </div>

            <Footer />
        </>
    );
}

export default Register;