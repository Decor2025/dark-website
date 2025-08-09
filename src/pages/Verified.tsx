import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getAuth, applyActionCode } from "firebase/auth";

export default function Verified() {
  const auth = getAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const oobCode = searchParams.get("oobCode");
    if (!oobCode) {
      navigate("/profile");
      return;
    }

    applyActionCode(auth, oobCode)
      .then(() => {
        setStatus("success");
        setMessage("Your email has been successfully verified!");
        setTimeout(() => {
          navigate("/login");
        }, 4000);
      })
      .catch(async (error) => {
        const user = auth.currentUser;
        if (user && user.emailVerified) {
          setStatus("success");
          setMessage("Your email is already verified!");
          setTimeout(() => {
            navigate("/login");
          }, 4000);
        } else {
          setStatus("error");
          if (error.code === "auth/invalid-action-code") {
            setMessage("Invalid or expired verification link.");
          } else {
            setMessage("Failed to verify email. Please try again.");
          }
        }
      });
  }, [auth, navigate, searchParams]);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent", // transparent background, no white
        padding: "1rem",
        boxSizing: "border-box",
      }}
    >
      {status === "loading" && (
        <p
          style={{
            textAlign: "center",
            fontSize: "1.25rem",
            color: "#555",
            userSelect: "none",
          }}
        >
          Verifying your email...
        </p>
      )}

      {status === "success" && (
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              color: "green",
              fontSize: "2rem",
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            Verification Successful
          </h1>
          <p style={{ color: "#333", marginBottom: "2rem" }}>{message}</p>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "0.5rem 1.5rem",
              backgroundColor: "green",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "1rem",
              transition: "background-color 0.3s",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLButtonElement).style.backgroundColor = "#065f46")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLButtonElement).style.backgroundColor = "green")
            }
          >
            Go to Login
          </button>
        </div>
      )}

      {status === "error" && (
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              color: "red",
              fontSize: "2rem",
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            Verification Failed
          </h1>
          <p style={{ color: "#333", marginBottom: "2rem" }}>{message}</p>
          <button
            onClick={() => navigate("/signup")}
            style={{
              padding: "0.5rem 1.5rem",
              backgroundColor: "red",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "1rem",
              transition: "background-color 0.3s",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLButtonElement).style.backgroundColor = "#991b1b")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLButtonElement).style.backgroundColor = "red")
            }
          >
            Try Signing Up Again
          </button>
        </div>
      )}
    </div>
  );
}
