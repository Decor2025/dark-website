import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet";

const Payment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [customerName, setCustomerName] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const desktopQRRef = useRef<HTMLCanvasElement>(null);
  const modalQRRef = useRef<HTMLCanvasElement>(null);

  const storeName = "Decor Drapes Instyle";
  const storeUPI = "decordrapes.instyle-3@okhdfcbank";
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const [upiLink, setUpiLink] = useState("");

  // Load payment details
  useEffect(() => {
    const customer = searchParams.get("customer");
    const quote = searchParams.get("quote");
    const amt = searchParams.get("amount");

    if (!customer || !quote || !amt) {
      setIsValid(false);
      return;
    }

    setCustomerName(customer);
    setQuoteNumber(quote);
    setAmount(amt);

    const link = `upi://pay?pa=${storeUPI}&am=${amt}&cu=INR`;
    setUpiLink(link);

    document.title = `Pay ₹${amt} | ${storeName}`;

    // Generate QR codes
    if (desktopQRRef.current) {
      QRCode.toCanvas(
        desktopQRRef.current,
        `upi://pay?pa=${storeUPI}&am=${amt}`,
        { width: 200 }
      );
    }
    if (modalQRRef.current) {
      QRCode.toCanvas(
        modalQRRef.current,
        `upi://pay?pa=${storeUPI}&am=${amt}`,
        { width: 200 }
      );
    }

    // Mobile redirect
    if (isMobile) {
      setTimeout(() => {
        window.location.href = link;
      }, 300);
    }
  }, [searchParams]);

  const handlePaymentClick = () => {
    if (isMobile) {
      window.location.href = upiLink;
    } else {
      setShowModal(true);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(storeUPI);
    alert("UPI ID copied!");
  };

  // Broken link page
  if (!isValid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
        <Helmet>
          <link
            rel="icon"
            type="image/svg+xml"
            href="https://res.cloudinary.com/<your-cloud-name>/image/upload/v<version>/favicon.svg"
          />
        </Helmet>

        <h1 className="text-4xl font-bold text-red-600 mb-4 animate-pulse">
          ⚠️ Oops!
        </h1>
        <p className="text-gray-700 mb-6">
          This payment link is broken or missing required information.
        </p>
        <Link
          to="/"
          className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition"
        >
          Go back home
        </Link>
      </div>
    );
  }

  // Main payment page
  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <Helmet>
        <title>
          Pay ₹{amount} | {storeName}
        </title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </Helmet>

      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden animate-fadeIn">
        {/* Top Bar */}
        <div className="flex flex-col items-center text-center p-6 border-b bg-gray-50">
          <Link to="/">
            <img
              src="https://res.cloudinary.com/<your-cloud-name>/image/upload/v<version>/2D2.png"
              alt={storeName}
              className="h-12 w-auto mb-2"
            />
          </Link>
          <p className="text-gray-500 text-sm">You are paying</p>
          <h1 className="text-lg font-semibold text-gray-800">{storeName}</h1>
        </div>

        {/* Amount */}
        <div className="px-6 py-8 text-center">
          <p className="text-gray-500 text-sm mb-1">Amount</p>
          <p className="text-4xl font-bold text-green-600">₹ {amount}</p>
        </div>

        {/* Customer Details */}
        <div className="px-6 pb-6">
          <div className="border rounded-xl bg-gray-50 p-4 shadow-sm">
            <p className="text-base font-medium text-gray-800">
              {customerName}
            </p>
            <p className="text-sm text-gray-500">Quote #{quoteNumber}</p>
          </div>
        </div>

        {/* Desktop QR */}
        <div className="hidden md:flex flex-col items-center justify-center pb-6">
          <canvas ref={desktopQRRef}></canvas>
          <p className="text-xs text-gray-400 mt-2">Scan to pay</p>
        </div>

        {/* Pay Button */}
        <div className="p-6 border-t bg-white">
          <button
            onClick={handlePaymentClick}
            className="block w-full text-center py-3 bg-green-600 text-white font-semibold rounded-xl shadow hover:bg-green-700 transition"
          >
            Pay Now
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-4 relative animate-slideIn">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              ✖
            </button>
            <h3 className="text-lg font-medium mb-2">Payment Details</h3>
            <div className="bg-gray-50 p-4 rounded-md mb-4 space-y-1">
              <p>
                <strong>Customer:</strong> {customerName}
              </p>
              <p>
                <strong>Quote:</strong> {quoteNumber}
              </p>
              <p>
                <strong>Amount:</strong> ₹ {amount}
              </p>
            </div>
            <canvas ref={modalQRRef}></canvas>
            <div className="flex justify-between mt-2 items-center">
              <span>{storeUPI}</span>
              <button
                onClick={copyUpiId}
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;
