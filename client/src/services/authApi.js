import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const authApi = axios.create({
    baseURL: `${API_BASE_URL}/api`,
});

function registerUser(userData) {
    return authApi.post("/auth/register", userData);
}

function loginUser(email, password) {
    return authApi.post("/auth/login", {
        email,
        password,
    });
}

function verifyEmail(email, otp) {
    return authApi.post("/auth/verify-email", {
        email,
        otp,
    });
}

function resendOtp(email) {
    return authApi.post("/auth/resend-otp", {
        email,
    });
}

function forgotPassword(email) {
    return authApi.post("/auth/forgot-password", {
        email,
    });
}

function resetPassword(token, newPassword) {
    return authApi.post("/auth/reset-password", {
        token,
        newPassword,
    });
}

function adminLogin(email, password) {
    return authApi.post("/auth/admin-login", {
        email,
        password,
    });
}

function verifyAdminOtp(email, otp) {
    return authApi.post("/auth/admin/verify-otp", {
        email,
        otp,
    });
}

export {
    registerUser,
    verifyEmail,
    resendOtp,
    forgotPassword,
    resetPassword,
    loginUser,
    adminLogin,
    verifyAdminOtp,
};