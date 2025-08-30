import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const QuotePayment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [upiLink, setUpiLink] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState("Guest");
  const [quoteNumber, setQuoteNumber] = useState("N/A");
  const [amount, setAmount] = useState("0");

  const storeName = "Decor Drapes Instyle";
  const storeUPI = "decordrapes.instyle-3@okhdfcbank";

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    const customer = searchParams.get("customer") || "Guest";
    const quote = searchParams.get("quote") || "N/A";
    const amt = searchParams.get("amount") || "0";

    setCustomerName(customer);
    setQuoteNumber(quote);
    setAmount(amt);

    const link = `upi://pay?pa=${storeUPI}&am=${amt}&cu=INR`;
    setUpiLink(link);

    // Generate QR codes
    QRCode.toCanvas(
      document.getElementById("qrcode")!,
      `upi://pay?pa=${storeUPI}&am=${amt}`,
      { width: 200 }
    );
    QRCode.toCanvas(
      document.getElementById("modalQrcode")!,
      `upi://pay?pa=${storeUPI}&am=${amt}`,
      { width: 200 }
    );

    // Auto redirect for mobile
    if (isMobile) {
      setTimeout(() => (window.location.href = link), 300);
    }

    document.title = `Pay ₹${amt} | ${storeName}`;
  }, [searchParams]);

  const handlePayment = () => {
    if (isMobile) {
      window.location.href = upiLink;
    } else {
      setShowModal(true);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(storeUPI);
    alert("UPI ID copied!"); // simple toast alternative
  };

  return (
    <>
    <Helmet>
        <link rel="icon" href="https://res.cloudinary.com/ds6um53cx/image/upload/v1756561028/dtuaewzwc3yvvgezfdqw.svg" type="image/svg+xml" />
      </Helmet>
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      {/* Payment Card */}
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden animate-fadeIn">
        {/* Top Bar */}
        <div className="flex flex-col items-center text-center p-6 border-b bg-gray-50">
          <Link to="/">
            <img
              src="https://res.cloudinary.com/ds6um53cx/image/upload/v1756560998/vygquamosjlfedw12go3.png"
              alt="Decor Drapes Instyle"
              className="h-12 w-auto mb-2"
            />
          </Link>
          <p className="text-gray-500 text-sm">You are paying</p>
          <h1 className="text-lg font-semibold text-gray-800">{storeName}</h1>
        </div>

        {/* Amount Highlight */}
        <div className="px-6 py-8 text-center">
          <p className="text-gray-500 text-sm mb-1">Amount</p>
          <p className="text-4xl font-bold text-green-600">₹ {amount}</p>
        </div>

        {/* Customer Details */}
        <div className="px-6 pb-6">
          <div className="border rounded-xl bg-gray-50 p-4 shadow-sm">
            <div className="flex flex-col space-y-1">
              <p className="text-base font-medium text-gray-800">
                {customerName}
              </p>
              <p className="text-sm text-gray-500">Quote #{quoteNumber}</p>
            </div>
          </div>
        </div>

        {/* QR */}
        <div className="hidden md:flex flex-col items-center justify-center pb-6">
          <canvas id="qrcode"></canvas>
          <p className="text-xs text-gray-400 mt-2">Scan to pay</p>
        </div>

        {/* Pay Button */}
        <div className="p-6 border-t bg-white">
          <button
            onClick={handlePayment}
            className="block w-full text-center py-3 bg-green-600 text-white font-semibold rounded-xl shadow hover:bg-green-700 transition"
          >
            Pay Now
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-4 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              ✖
            </button>
            <h3 className="text-lg font-medium mb-2">Payment Details</h3>
            <div className="bg-gray-50 p-4 rounded-md mb-4">
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
            <canvas id="modalQrcode"></canvas>
            <div className="flex justify-between mt-2">
              <span>{storeUPI}</span>
              <button
                onClick={copyUpiId}
                className="text-blue-600 hover:underline"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default QuotePayment;
