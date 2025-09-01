import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const routeTitles: Record<string, string> = {
  "/": "Home | Decor Drapes InStyle",
  "/catalogue": "Catalogue | Decor Drapes InStyle",
  "/terms": "Terms & Conditions | Decor Drapes InStyle",
  "/cart": "My Cart | Decor Drapes InStyle",
  "/about": "About Us | Decor Drapes InStyle",
  "/contact": "Contact Us | Decor Drapes InStyle",
  "/estimate": "Get an Estimate | Decor Drapes InStyle",
  "/privacy": "Privacy Policy | Decor Drapes InStyle",
  "/our-work": "Our Work | Decor Drapes InStyle",
  "/profile": "My Profile | Decor Drapes InStyle",
  "/admin": "Admin Dashboard | Decor Drapes InStyle",
  "/production": "Production Dashboard | Decor Drapes InStyle",
  "/auth/verified": "Account Verified | Decor Drapes InStyle",
  "/auth/reset-password": "Reset Password | Decor Drapes InStyle",
  "/payment": "Payment | Decor Drapes InStyle",
  "/login": "Login | Decor Drapes InStyle",

};

export default function TitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    const newTitle =
      routeTitles[location.pathname] || "Decor Drapes InStyle"; // fallback title
    document.title = newTitle;
  }, [location.pathname]);

  return null;
}
