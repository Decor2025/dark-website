import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function AuthBridge() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");
    const continueUrl = searchParams.get("continueUrl") || "/";

    if (!mode || !oobCode) {
      navigate("/404", { replace: true });
      return;
    }

    if (mode === "verifyEmail") {
      navigate(`/auth/verified?oobCode=${oobCode}&continueUrl=${continueUrl}`, { replace: true });
    } 
    else if (mode === "resetPassword") {
      navigate(`/auth/reset-password?oobCode=${oobCode}&continueUrl=${continueUrl}`, { replace: true });
    } 
    else {
      navigate("/404", { replace: true });
    }
  }, []);

  return null; // kuch bhi render mat kar, seedha redirect
}
