import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { useAuth, getAndClearReturnUrl } from "@/contexts/AuthContext";
import Logo from "@/assets/imgs/logo.png";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import PageLoader from "../components/layout/PageLoader";

export default function SsoLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [status, setStatus] = useState("loading"); // "loading" | "error"
  const [errorMessage, setErrorMessage] = useState("");

  // Extract and sanitize token from query params
  let rawToken = searchParams.get("token") || searchParams.get("Token") || "";
  rawToken = rawToken.replace(/^["'\s]+|["'\s]+$/g, "").trim();

  // Extract redirect target if specified in URL query
  const queryRedirect = searchParams.get("redirect") || searchParams.get("returnUrl");

  useEffect(() => {
    if (!rawToken || rawToken.length === 0) {
      setStatus("error");
      setErrorMessage("No authentication token provided in the URL.");
      return;
    }

    let isMounted = true;

    const redeemToken = async () => {
      try {
        setStatus("loading");
        const res = await api.post("/Sso/redeemtoken", {
          Token: rawToken,
        });

        if (!isMounted) return;

        if (res.data?.IsSuccess && res.data?.Data) {
          const authData = res.data.Data;

          // Save auth to state & localStorage
          login(authData);
          toast.success(authData?.Name || authData?.UserName ? `Welcome, ${authData.Name || authData.UserName}! Logged in successfully.` : "Logged in successfully!");

          // Update default Axios header immediately
          if (authData.AccessToken) {
            api.defaults.headers.common.Authorization = `Bearer ${authData.AccessToken}`;
          }

          // Determine destination (saved return URL -> query param -> /flight-results)
          const destination = queryRedirect || getAndClearReturnUrl() || "/flight-results";
          navigate(destination, { replace: true });
        } else {
          setStatus("error");
          setErrorMessage(
            res.data?.ErrorMessage ||
            res.data?.Message ||
            "Failed to authenticate with the provided SSO token."
          );
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("SSO Login Error:", err);
        const apiError =
          err?.response?.data?.ErrorMessage ||
          err?.response?.data?.Message ||
          err?.message ||
          "Network error during SSO authentication. Please try again.";
        setStatus("error");
        setErrorMessage(apiError);
      }
    };

    redeemToken();

    return () => {
      isMounted = false;
    };
  }, [rawToken, login, navigate]);

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4">
      {status === "loading" && (
        <PageLoader />
      )}

      {status === "error" && (
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10 text-center space-y-5 animate-in zoom-in-95 duration-300">
          <img src={Logo} alt="SkyVoo" className="h-10 sm:h-12 w-auto mx-auto mb-2" />

          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-sm mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Authentication Failed
            </h2>
            <p className="text-xs sm:text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 mt-3 font-medium">
              {errorMessage}
            </p>
          </div>

          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Your token might be expired, invalid, or already used. Please login again from your partner portal.
          </p>

          <button
            onClick={() => navigate("/flight-results", { replace: true })}
            className="w-full flex items-center justify-center gap-2 bg-black hover:bg-slate-800 text-white font-semibold text-sm py-3 px-6 rounded-xl shadow transition active:scale-[0.98] cursor-pointer"
          >
            <span>Go to Flights</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
