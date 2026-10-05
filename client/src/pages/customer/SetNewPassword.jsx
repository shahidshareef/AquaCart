import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import "../../styles/SetNewPassword.css";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import { resetPassword } from "../../services/authApi";

function SetNewPassword() {

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    async function handleSubmit(event) {

        event.preventDefault();

        setMessage("");

        if (!newPassword || !confirmPassword) {
            setMessage("All fields are required");
            setMessageType("error");
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage("Passwords do not match");
            setMessageType("error");
            return;
        }

        const passwordPattern =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

        if (!passwordPattern.test(newPassword)) {
            setMessage(
                "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character"
            );
            setMessageType("error");
            return;
        }

        if (!token) {
            setMessage("Reset token is missing");
            setMessageType("error");
            return;
        }

        try {

            const response = await resetPassword(
                token,
                newPassword
            );

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

    return (
        <>
            <Header />

            <div className="set-password-page">

                <div className="set-password-card">

                    <h1>Set New Password</h1>

                    <p>
                        Enter your new password below to secure your account.
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

                            <label>New Password</label>

                            <input
                                type="password"
                                placeholder="Enter your new password"
                                value={newPassword}
                                onChange={(event) =>
                                    setNewPassword(event.target.value)
                                }
                            />

                        </div>

                        <div className="form-group">

                            <label>Confirm Password</label>

                            <input
                                type="password"
                                placeholder="Confirm your new password"
                                value={confirmPassword}
                                onChange={(event) =>
                                    setConfirmPassword(event.target.value)
                                }
                            />

                        </div>

                        <button type="submit">
                            Update Password →
                        </button>

                    </form>

                    <p className="back-login">
                        ← Back to Login
                    </p>

                </div>

            </div>

            <Footer />
        </>
    );
}

export default SetNewPassword;