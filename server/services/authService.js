const User = require("../models/User");
const bcrypt = require("bcryptjs");

const registerUser = async (userData) => {
    const name = userData.name.trim();
    const phone = userData.phone.trim();
    const email = userData.email.toLowerCase().trim();
    const existingUser = await User.findOne({
        email: userData.email
    });

    if (existingUser) {
    if (existingUser.status === "blocked") {
        throw new Error("This account is blocked");
    }

    throw new Error("Email already registered");
}

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await User.create({
    name,
    email,
    phone,
    passwordHash: hashedPassword
});

const otp = generateEmailOtp();

user.emailVerificationOtp = otp;
user.emailVerificationOtpExpiresAt =
    new Date(Date.now() + 10 * 60 * 1000);

await user.save();

return user;

};
const generateEmailOtp = ()=>{
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString(); 
}

module.exports = {registerUser, generateEmailOtp}; 