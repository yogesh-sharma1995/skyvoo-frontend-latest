import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import api from "@/services/api";
import { getUserProfile, updateUserProfile as updateUserProfileService } from "@/services/auth";

const AuthContext = createContext(null);

const USER_INFO_KEY = "skyvoo_user";
const TOKEN_KEY = "skyvoo_token";
const REFRESH_TOKEN_KEY = "skyvoo_refresh_token";
const TOKEN_EXPIRY_KEY = "skyvoo_token_expiry";
const RETURN_URL_KEY = "skyvoo_return_url";

// Helper — save return URL to sessionStorage
export const saveReturnUrl = (url) => {
    if (!url || url === "/" || url.startsWith("/sso-login")) return;
    try {
        sessionStorage.setItem(RETURN_URL_KEY, url);
    } catch (e) {
        console.error("Could not save return URL:", e);
    }
};

// Helper — get and remove saved return URL
export const getAndClearReturnUrl = () => {
    try {
        const url = sessionStorage.getItem(RETURN_URL_KEY);
        if (url) {
            sessionStorage.removeItem(RETURN_URL_KEY);
            return url;
        }
    } catch (e) {
        console.error("Could not get return URL:", e);
    }
    return null;
};

// Helper — load persisted user from localStorage
const loadStoredUser = () => {
    try {
        const raw = localStorage.getItem(USER_INFO_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
            const rawType = parsed.UserType || parsed.userType || "B2C";
            return {
                UserType: String(rawType).toUpperCase(),
            };
        }
        return null;
    } catch {
        return null;
    }
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(loadStoredUser);
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const hasFetchedProfileRef = useRef(false);
    const refreshTimerRef = useRef(null);

    const logout = useCallback((options = { redirect: true }) => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }

        // Save current location if on a protected/inner page before logging out
        if (typeof window !== "undefined") {
            const currentPath = window.location.pathname + window.location.search;
            if (currentPath && currentPath !== "/" && !currentPath.startsWith("/sso-login")) {
                saveReturnUrl(currentPath);
            }
        }

        hasFetchedProfileRef.current = false;
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
        localStorage.removeItem(USER_INFO_KEY);
        setUser(null);

        // Redirect to Home Page
        if (options?.redirect !== false && typeof window !== "undefined") {
            if (window.location.pathname !== "/") {
                window.location.href = "/";
            }
        }
    }, []);

    /**
     * Perform silent background refresh of the auth token
     */
    const performSilentRefresh = useCallback(async () => {
        const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!storedRefreshToken || storedRefreshToken === "undefined" || storedRefreshToken === "null") {
            return;
        }

        try {
            console.log("[Auth] Triggering automatic token refresh...");
            const { data } = await axios.post(
                `${api.defaults.baseURL}/Auth/refresh`,
                { RefreshToken: storedRefreshToken },
                { headers: { "Content-Type": "application/json" } }
            );

            const isSuccess = data?.Status === "SUCCESS" || data?.IsSuccess === true;
            const newToken = data?.Token || data?.Data?.Token || data?.AccessToken || data?.Data?.AccessToken;
            const newRefreshToken = data?.RefreshToken || data?.Data?.RefreshToken;
            const newExpiry = data?.TokenExpiryTime || data?.AccessTokenExpiresAt || data?.Data?.TokenExpiryTime || data?.Data?.AccessTokenExpiresAt;

            if (isSuccess && newToken) {
                console.log("[Auth] Automatic token refresh succeeded. New expiry:", newExpiry);
                localStorage.setItem(TOKEN_KEY, newToken);
                if (newRefreshToken) {
                    localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
                }
                if (newExpiry) {
                    localStorage.setItem(TOKEN_EXPIRY_KEY, newExpiry);
                }
                api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

                // Schedule subsequent refresh
                if (newExpiry) {
                    scheduleRefresh(newExpiry);
                }
            } else {
                console.warn("[Auth] Automatic token refresh failed:", data);
                logout({ redirect: false });
            }
        } catch (err) {
            console.error("[Auth] Automatic token refresh error:", err);
            logout({ redirect: false });
        }
    }, [logout]);

    /**
     * Schedule token refresh before it expires
     */
    const scheduleRefresh = useCallback((expiryTimeStr) => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }

        const expiryStr = expiryTimeStr || localStorage.getItem(TOKEN_EXPIRY_KEY);
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

        if (!refreshToken || !expiryStr) return;

        try {
            const expiryDate = new Date(expiryStr).getTime();
            if (isNaN(expiryDate)) return;

            const now = Date.now();
            // Trigger refresh 30 seconds before actual expiry, or immediately if already reached/passed
            const delay = Math.max(0, expiryDate - now - 30 * 1000);

            console.log(`[Auth] Scheduled automatic token refresh in ${Math.round(delay / 1000)}s (Expiry: ${expiryStr})`);

            refreshTimerRef.current = setTimeout(() => {
                performSilentRefresh();
            }, delay);
        } catch (e) {
            console.error("[Auth] Failed to schedule token refresh:", e);
        }
    }, [performSilentRefresh]);

    /**
     * Fetch user profile from {{baseUrl}}/api/auth/userprofile once
     */
    const fetchUserProfile = useCallback(async (force = false) => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return null;

        // If already fetched and not forced, do not hit the API repeatedly
        if (hasFetchedProfileRef.current && !force) {
            return user || loadStoredUser();
        }

        setIsProfileLoading(true);
        hasFetchedProfileRef.current = true;
        try {
            const data = await getUserProfile();
            const profile = data?.Data || (data?.Name || data?.Email || data?.Mobile ? data : null);

            if (profile) {
                const raw = localStorage.getItem(USER_INFO_KEY);
                const currentUser = raw ? JSON.parse(raw) : {};

                const rawUserType = profile.UserType || profile.userType || currentUser?.UserType || currentUser?.userType || (currentUser?.RetailerId ? "B2B" : "B2C");
                const userType = String(rawUserType).toUpperCase();

                // Only store minimal info with single UserType key in localStorage
                const storedUserInfo = {
                    UserType: userType,
                };
                localStorage.setItem(USER_INFO_KEY, JSON.stringify(storedUserInfo));

                const fullUserState = {
                    UserType: userType,
                    Name: profile.Name || profile.UserName || "Skyvoo User",
                    UserName: profile.UserName || profile.Name || "Skyvoo User",
                    Email: profile.Email || "",
                    Mobile: profile.Mobile || "",
                };

                setUser(fullUserState);
                return fullUserState;
            }
            return null;
        } catch (err) {
            console.error("[Auth] Failed to fetch user profile:", err);
            return null;
        } finally {
            setIsProfileLoading(false);
        }
    }, [user]);

    /**
     * Update user profile via {{baseUrl}}/api/auth/updateuserprofile
     * Body: { Name, Email, Mobile }
     */
    const updateUserProfile = useCallback(async ({ Name, Email, Mobile, name, email, mobile }) => {
        const finalName = Name ?? name ?? user?.Name ?? "";
        const finalEmail = Email ?? email ?? user?.Email ?? "";
        const finalMobile = Mobile ?? mobile ?? user?.Mobile ?? "";

        const res = await updateUserProfileService({
            Name: finalName,
            Email: finalEmail,
            Mobile: finalMobile,
        });

        const isSuccess = res?.Status === "SUCCESS" || res?.IsSuccess === true || res?.Status === 1 || !!res?.Data;
        if (isSuccess || res?.Data) {
            const updatedData = res?.Data || {};
            const raw = localStorage.getItem(USER_INFO_KEY);
            const currentUser = raw ? JSON.parse(raw) : (user || {});

            const storedUserInfo = {
                UserType: currentUser.UserType || "B2C",
            };
            localStorage.setItem(USER_INFO_KEY, JSON.stringify(storedUserInfo));

            setUser((prev) => ({
                ...(prev || {}),
                UserType: storedUserInfo.UserType,
                Name: updatedData.Name || finalName,
                UserName: updatedData.Name || prev?.UserName || finalName,
                Email: updatedData.Email || finalEmail,
                Mobile: updatedData.Mobile || finalMobile,
            }));
        }
        return res;
    }, [user]);

    /**
     * Call this after a successful login API response or SSO redeem token response.
     * Persists user info + token to localStorage.
     */
    const login = useCallback((authResponse) => {
        if (!authResponse) return;

        const token = authResponse.AccessToken || authResponse.Token;
        const refreshToken = authResponse.RefreshToken;
        const tokenExpiry = authResponse.TokenExpiryTime || authResponse.AccessTokenExpiresAt || authResponse.tokenExpiryTime;
        const rawUserType = authResponse.UserType || authResponse.userType || authResponse.Role || authResponse.role || (authResponse.RetailerId ? "B2B" : "B2C");
        const userType = String(rawUserType).toUpperCase();

        const storedUserInfo = {
            UserType: userType,
        };

        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
        if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        if (tokenExpiry) localStorage.setItem(TOKEN_EXPIRY_KEY, tokenExpiry);
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(storedUserInfo));

        const inMemoryUser = {
            UserType: userType,
            Name: authResponse.Name || authResponse.UserName || authResponse.OutletName || "Skyvoo User",
            UserName: authResponse.UserName || authResponse.Name || "Skyvoo User",
            Email: authResponse.Email || "",
            Mobile: authResponse.Mobile || "",
        };

        setUser(inMemoryUser);

        // Schedule token refresh
        if (tokenExpiry) {
            scheduleRefresh(tokenExpiry);
        }

        // Fetch complete profile once upon login
        if (token) {
            fetchUserProfile(true).catch((err) => {
                console.warn("[Auth] Background profile fetch failed:", err);
            });
        }
    }, [fetchUserProfile, scheduleRefresh]);

    /**
     * Call this after the api.js interceptor silently refreshes the token.
     */
    const refreshSession = useCallback((newToken, newRefreshToken, newExpiry) => {
        if (newToken) localStorage.setItem(TOKEN_KEY, newToken);
        if (newRefreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        if (newExpiry) localStorage.setItem(TOKEN_EXPIRY_KEY, newExpiry);
        setUser(loadStoredUser());
        if (newExpiry) {
            scheduleRefresh(newExpiry);
        }
    }, [scheduleRefresh]);

    // Initial check and scheduling of token refresh on mount / tab visibility change
    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

        if (token && refreshToken && storedExpiry) {
            scheduleRefresh(storedExpiry);
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                const currentToken = localStorage.getItem(TOKEN_KEY);
                const currentExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
                const currentRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
                if (currentToken && currentRefreshToken && currentExpiry) {
                    const expiryDate = new Date(currentExpiry).getTime();
                    if (!isNaN(expiryDate) && expiryDate - Date.now() <= 30 * 1000) {
                        performSilentRefresh();
                    }
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
            }
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [scheduleRefresh, performSilentRefresh]);

    // Initial fetch of user profile only if user and token exist
    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token && user && !hasFetchedProfileRef.current) {
            fetchUserProfile();
        }
    }, [user, fetchUserProfile]);

    // Handle unauthorized events dispatched from api.js (do not forcibly redirect public search pages)
    useEffect(() => {
        const handleUnauthorized = () => {
            console.warn("[Auth] Received unauthorized signal from API. Clearing session...");
            logout({ redirect: false });
        };
        window.addEventListener("auth:unauthorized", handleUnauthorized);
        return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
    }, [logout]);

    const isLoggedIn = !!user;
    const isB2B = useMemo(() => {
        const rawType = (user?.UserType || user?.userType || user?.Role || user?.role || "").toLowerCase();
        return rawType === "b2b";
    }, [user]);

    const authContextValue = useMemo(() => ({
        user,
        isLoggedIn,
        isB2B,
        isProfileLoading,
        login,
        logout,
        refreshSession,
        fetchUserProfile,
        updateUserProfile,
        updateProfile: updateUserProfile,
        saveReturnUrl,
        getAndClearReturnUrl,
    }), [
        user,
        isLoggedIn,
        isB2B,
        isProfileLoading,
        login,
        logout,
        refreshSession,
        fetchUserProfile,
        updateUserProfile,
    ]);

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
};
