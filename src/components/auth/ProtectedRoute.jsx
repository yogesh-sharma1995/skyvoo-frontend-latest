import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, saveReturnUrl } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children, requireB2B = false }) {
    const { isLoggedIn, isB2B: authIsB2B, user } = useAuth();
    const location = useLocation();

    if (!isLoggedIn) {
        // Save destination for post-login redirect
        const currentUrl = location.pathname + location.search;
        saveReturnUrl(currentUrl);
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    if (requireB2B) {
        const rawUserType = (user?.UserType || user?.userType || user?.Role || user?.role || "").toLowerCase();
        const isB2C = rawUserType === "b2c";
        const isB2B = (authIsB2B || rawUserType === "b2b") && !isB2C;

        if (!isB2B) {
            return <Navigate to="/my-profile" replace />;
        }
    }

    return children;
}
