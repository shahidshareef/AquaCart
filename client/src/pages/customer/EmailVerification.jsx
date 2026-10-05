import { useRef, useState } from "react";
import "../../styles/EmailVerification.css";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import { verifyEmail, resendOtp } from "../../services/authApi";
import { useLocation, useNavigate } from "react-router-dom";

function EmailVerification() {

    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email || "";

    const [otp, setOtp] = useState([
        "",
        "",
        "",
        "",
        "",
        ""
    ]);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const inputRefs = useRef([]);

    function handleOtpChange(index, value) {

        if (!/^\d?$/.test(value)) {
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;

        setOtp(newOtp);
    }

    async function handleVerify() {

        const enteredOtp = otp.join("");

        setMessage("");

        try {

            const response = await verifyEmail(
                email,
                enteredOtp
            );

            setMessage(response.data.message);
            setMessageType("success");

            setTimeout(() => {
                navigate("/login");
            }, 500);

        } catch (error) {

            setMessage(
                error.response?.data?.message ||
                "Something went wrong"
            );

            setMessageType("error");
        }
    }

    async function handleResendOtp() {

        setMessage("");

        try {

            const response = await resendOtp(email);

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

            <div className="verification-page">

                <div className="verification-card">

                    <div className="verification-icon">
                        🔐
                    </div>

                    <h1>Verify Your Email</h1>

                    <p>
                        We've sent a 6-digit verification code to{" "}
                        <strong>{email}</strong>
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

                    <div className="otp-container">

                        <input
                            type="text"
                            maxLength="1"
                            value={otp[0]}
                            onChange={(event) => {
                                handleOtpChange(
                                    0,
                                    event.target.value
                                );

                                if (event.target.value) {
                                    inputRefs.current[1].focus();
                                }
                            }}
                            ref={(element) => {
                                inputRefs.current[0] = element;
                            }}
                        />

                        <input
                            type="text"
                            maxLength="1"
                            value={otp[1]}
                            onChange={(event) => {
                                handleOtpChange(
                                    1,
                                    event.target.value
                                );

                                if (event.target.value) {
                                    inputRefs.current[2].focus();
                                }
                            }}
                            onKeyDown={(event) => {
                                if (
                                    event.key === "Backspace" &&
                                    !otp[1]
                                ) {
                                    inputRefs.current[0].focus();
                                }
                            }}
                            ref={(element) => {
                                inputRefs.current[1] = element;
                            }}
                        />

                        <input
                            type="text"
                            maxLength="1"
                            value={otp[2]}
                            onChange={(event) => {
                                handleOtpChange(
                                    2,
                                    event.target.value
                                );

                                if (event.target.value) {
                                    inputRefs.current[3].focus();
                                }
                            }}
                            onKeyDown={(event) => {
                                if (
                                    event.key === "Backspace" &&
                                    !otp[2]
                                ) {
                                    inputRefs.current[1].focus();
                                }
                            }}
                            ref={(element) => {
                                inputRefs.current[2] = element;
                            }}
                        />

                        <input
                            type="text"
                            maxLength="1"
                            value={otp[3]}
                            onChange={(event) => {
                                handleOtpChange(
                                    3,
                                    event.target.value
                                );

                                if (event.target.value) {
                                    inputRefs.current[4].focus();
                                }
                            }}
                            onKeyDown={(event) => {
                                if (
                                    event.key === "Backspace" &&
                                    !otp[3]
                                ) {
                                    inputRefs.current[2].focus();
                                }
                            }}
                            ref={(element) => {
                                inputRefs.current[3] = element;
                            }}
                        />

                        <input
                            type="text"
                            maxLength="1"
                            value={otp[4]}
                            onChange={(event) => {
                                handleOtpChange(
                                    4,
                                    event.target.value
                                );

                                if (event.target.value) {
                                    inputRefs.current[5].focus();
                                }
                            }}
                            onKeyDown={(event) => {
                                if (
                                    event.key === "Backspace" &&
                                    !otp[4]
                                ) {
                                    inputRefs.current[3].focus();
                                }
                            }}
                            ref={(element) => {
                                inputRefs.current[4] = element;
                            }}
                        />

                        <input
                            type="text"
                            maxLength="1"
                            value={otp[5]}
                            onChange={(event) => {
                                handleOtpChange(
                                    5,
                                    event.target.value
                                );
                            }}
                            onKeyDown={(event) => {
                                if (
                                    event.key === "Backspace" &&
                                    !otp[5]
                                ) {
                                    inputRefs.current[4].focus();
                                }
                            }}
                            ref={(element) => {
                                inputRefs.current[5] = element;
                            }}
                        />

                    </div>

                    <button
                        className="verify-button"
                        onClick={handleVerify}
                    >
                        Verify Code →
                    </button>

                    <p className="resend-text">
                        Didn't receive the code?{" "}
                        <span onClick={handleResendOtp}>
                            Resend OTP
                        </span>
                    </p>

                    <p
                        className="back-login"
                        onClick={handleBackToLogin}
                    >
                        ← Back to Login
                    </p>

                </div>

            </div>

            <Footer />
        </>
    );
}

export default EmailVerification;