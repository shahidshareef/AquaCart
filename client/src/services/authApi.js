
import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function registerUser(userData) {
    return axios.post(
        `${API_BASE_URL}/api/auth/register`,
        userData
    );
}

function loginUser(email, password) {
    return axios.post(
        `${API_BASE_URL}/api/auth/login`,
        {
            email,
            password
        }
    );
}

function verifyEmail(email, otp) {
    return axios.post(
        `${API_BASE_URL}/api/auth/verify-email`,
        {
            email,
            otp
        }
    );
}

function resendOtp(email) {
    return axios.post(
        `${API_BASE_URL}/api/auth/resend-otp`,
        {
            email
        }
    );
}

function forgotPassword(email) {
    return axios.post(
        `${API_BASE_URL}/api/auth/forgot-password`,
        {
            email
        }
    );
}

function resetPassword(token, newPassword) {
    return axios.post(
        `${API_BASE_URL}/api/auth/reset-password`,
        {
            token,
            newPassword
        }
    );
}

function adminLogin(email, password) {
    return axios.post(
        `${API_BASE_URL}/api/auth/admin-login`,
        {
            email,
            password
        }
    );
}

function verifyAdminOtp(email, otp) {
    return axios.post(
        `${API_BASE_URL}/api/auth/admin/verify-otp`,
        {
            email,
            otp
        }
    );
}

export {
    registerUser,
    verifyEmail,
    resendOtp,
    forgotPassword,
    resetPassword,
    loginUser,
    adminLogin,
    verifyAdminOtp
};