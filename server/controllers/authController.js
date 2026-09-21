const { registerUser: registerUserService, generateEmailOtp } = require("../services/authService");
// Take the registerUser from the service, but call it registerUserService inside this file."
const User = require("../models/User");

const verifyEmail = async (req, res) => {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
    return res.status(404).json({
        message: "User not found, please register"
    });
}
if (user.isEmailVerified) {
    return res.status(400).json({
        message: "Email is already verified"
    });
}

if (otp !== user.emailVerificationOtp) {
    return res.status(400).json({
        message: "Invalid OTP"
    });
}
if (new Date() > user.emailVerificationOtpExpiresAt) {
    return res.status(400).json({
        message: "OTP has expired"
    });
}

user.isEmailVerified = true;
user.emailVerificationOtp = undefined;
user.emailVerificationOtpExpiresAt = undefined;
await user.save();

    res.json({
    message: "Email verified successfully",
});
};

const registerUser = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !phone || !password) {
    return res.status(400).json({
        message: "All fields are required"
    });
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailPattern.test(email)) {
    return res.status(400).json({
        message: "Please enter a valid email"
    });
}
        
const passwordPattern =/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
        if (!passwordPattern.test(password)) {
    return res.status(400).json({
        message:
            "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character"
    });
}

const phonePattern = /^[6-9]\d{9}$/;
        if(!phonePattern.test(phone)){
            return res.status(400).json({
               message: "please enter a valid 10-digit phone number"
            })
        }

        const user = await registerUserService({
            name,
            email,
            phone,
            password
        });

        res.status(201).json({
            message: "Registration successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isEmailVerified: user.isEmailVerified
            }
        });
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

module.exports = {registerUser, verifyEmail};