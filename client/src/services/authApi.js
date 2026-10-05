import axios from "axios";

function registerUser(userData) {
    return axios.post(
        "http://localhost:5000/api/auth/register",
        userData
    );
}

function loginUser(email, password) {
    return axios.post(
        "http://localhost:5000/api/auth/login",
        {
            email,
            password
        }
    );
}

function verifyEmail(email, otp) {
    return axios.post(
        "http://localhost:5000/api/auth/verify-email",
        {
            email,
            otp
        }
    );
}

function resendOtp(email) {
    return axios.post(
        "http://localhost:5000/api/auth/resend-otp",
        {
            email
        }
    );
}

function forgotPassword(email) {
    return axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        {
            email
        }
    );
}

function resetPassword(token, newPassword) {
    return axios.post(
        "http://localhost:5000/api/auth/reset-password",
        {
            token,
            newPassword
        }
    );
}

function adminLogin(email, password) {
    return axios.post(
        "http://localhost:5000/api/auth/admin-login",
        {
            email,
            password
        }
    );
}

function verifyAdminOtp(email, otp) {
    return axios.post(
        "http://localhost:5000/api/auth/admin/verify-otp",
        {
            email,
            otp
        }
    );
}   

export {registerUser,verifyEmail,resendOtp,forgotPassword, resetPassword, loginUser, adminLogin, verifyAdminOtp};