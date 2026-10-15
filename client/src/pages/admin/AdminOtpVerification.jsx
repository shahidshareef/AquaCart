
import "../../styles/AdminOtpVerification.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import AdminHeader from "./AdminHeader";
import Footer from "../../components/common/Footer";
import { verifyAdminOtp } from "../../services/authApi";

const AdminOtpVerification = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email || "";

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) {
            return;
        }

        const updatedOtp = [...otp];
        updatedOtp[index] = value.slice(-1);

        setOtp(updatedOtp);
        setMessage("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const enteredOtp = otp.join("");

        if (!email) {
            setMessage(
                "Admin email is missing. Please return to Admin Login and sign in again."
            );
            return;
        }

        if (enteredOtp.length !== 6) {
            setMessage("Please enter the complete 6-digit OTP.");
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            // Send the admin email and OTP to the existing backend API.
            const response = await verifyAdminOtp(email, enteredOtp);

            const token = response.data.token;
            const admin = response.data.admin;

            if (!token) {
                setMessage(
                    "Verification response did not contain an authentication token. Please try again."
                );
                return;
            }

            // Save the JWT used by protected admin API requests.
            localStorage.setItem("token", token);

            if (admin) {
                localStorage.setItem("admin", JSON.stringify(admin));
            }

            // Continue to the existing admin dashboard.
            navigate("/admin/dashboard", { replace: true });
        } catch (error) {
            console.error(
                "Admin OTP verification error:",
                error.response?.data || error.message
            );

            setMessage(
                error.response?.data?.message ||
                "Unable to verify OTP. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <AdminHeader />

            <main className="admin-otp-page">
                <div className="admin-otp-container">
                    <h1>Admin OTP Verification</h1>

                    <p>
                        Enter the 6-digit admin login verification code.
                    </p>

                    {email && (
                        <p className="admin-otp-email">
                            Verification email: <strong>{email}</strong>
                        </p>
                    )}

                    {!email && (
                        <p role="alert">
                            Admin email is missing. Please return to Admin
                            Login and sign in again.
                        </p>
                    )}

                    <form onSubmit={handleSubmit}>
                        {message && (
                            <p role="alert" aria-live="polite">
                                {message}
                            </p>
                        )}

                        <div className="admin-otp-inputs">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(event) =>
                                        handleOtpChange(
                                            index,
                                            event.target.value
                                        )
                                    }
                                    aria-label={`OTP digit ${index + 1}`}
                                    autoComplete={
                                        index === 0 ? "one-time-code" : "off"
                                    }
                                    required
                                    disabled={loading}
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            className="admin-otp-submit"
                            disabled={loading || !email}
                        >
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>
                    </form>
                </div>
            </main>

            <Footer />
        </>
    );
};

export default AdminOtpVerification;