import api from "./api";

/**
 * Send OTP to user mobile
 * POST /api/auth/sendotpskyvoouser
 * Body: { "mobile": "7087362399" }
 */
export const sendOtpSkyvooUser = async (mobile) => {
    const response = await api.post("/auth/sendotpskyvoouser", {
        mobile: String(mobile).trim(),
    });
    return response.data;
};

/**
 * Verify Mobile OTP
 * POST /api/auth/verifyotpskyvoouser
 * Body: { "Mobile": "7087362399", "OTP": "771689" }
 */
export const verifyOtpSkyvooUser = async ({ mobile, otp }) => {
    const response = await api.post("/auth/verifyotpskyvoouser", {
        Mobile: String(mobile).trim(),
        OTP: String(otp).trim(),
    });
    return response.data;
};

/**
 * Register Skyvoo User
 * POST /api/auth/registerskyvoouser
 * Body: { "Name": "...", "Mobile": "...", "Email": "...", "UserType": "b2c" }
 */
export const registerSkyvooUser = async ({ name, mobile, email, userType = "b2c" }) => {
    const response = await api.post("/auth/registerskyvoouser", {
        Name: String(name).trim(),
        Mobile: String(mobile).trim(),
        Email: String(email).trim(),
        UserType: userType,
    });
    return response.data;
};

/**
 * Login user with username and password (legacy fallback).
 * POST /api/auth/login
 */
export const loginUser = async ({ username, password }) => {
    const response = await api.post("/auth/login", {
        Username: username,
        Password: password,
    });
    return response.data.Data;
};

/**
 * Refresh the access token using the stored refresh token.
 * POST /api/Auth/refresh
 */
export const refreshToken = async (refreshToken) => {
    const response = await api.post("/Auth/refresh", {
        RefreshToken: refreshToken,
    });
    return response.data;
};

/**
 * Get Skyvoo User Profile
 * POST /api/auth/userprofile
 */
export const getUserProfile = async () => {
    const response = await api.post("/auth/userprofile", {});
    return response.data;
};

/**
 * Update Skyvoo User Profile
 * POST /api/auth/updateuserprofile
 * Body: { "Name": "...", "Email": "...", "Mobile": "..." }
 */
export const updateUserProfile = async ({ Name, Email, Mobile, name, email, mobile }) => {
    const response = await api.post("/auth/updateuserprofile", {
        Name: String(Name ?? name ?? "").trim(),
        Email: String(Email ?? email ?? "").trim(),
        Mobile: String(Mobile ?? mobile ?? "").trim(),
    });
    return response.data;
};

