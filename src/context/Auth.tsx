// src/pages/Auth.tsx
import { useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { getAuth, getRedirectResult } from "firebase/auth";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();

  useEffect(() => {
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");
    const continueUrl = searchParams.get("continueUrl") || "/";

    // ✅ Case 1: Email verification / password reset links
    if (mode && oobCode) {
      if (mode === "verifyEmail") {
        navigate(
          `/auth/verified?oobCode=${oobCode}&continueUrl=${continueUrl}`,
          { replace: true }
        );
      } else if (mode === "resetPassword") {
        navigate(
          `/auth/reset-password?oobCode=${oobCode}&continueUrl=${continueUrl}`,
          { replace: true }
        );
      } else {
        navigate("/404", { replace: true });
      }
      return;
    }

    // ✅ Case 2: Google login redirect (no mode/oobCode, but path is /auth/login)
    if (location.pathname === "/auth/login") {
      getRedirectResult(auth)
        .then((result) => {
          if (result?.user) {
            console.log("Google login success:", result.user);
            navigate("/profile", { replace: true });
          } else {
            navigate("/login", { replace: true });
          }
        })
        .catch((error) => {
          console.error("Google login error:", error);
          navigate("/login", { replace: true });
        });
    }
  }, [auth, location.pathname, navigate, searchParams]);

  return <p className="text-center mt-10">Processing authentication...</p>;
}
