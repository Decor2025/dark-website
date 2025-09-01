import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Copy } from "lucide-react";

// Define types for our component
interface PaymentDetails {
  storeName: string;
  amount: string;
  customerName: string;
  quoteNumber: string;
  upiId: string;
}

const Payment: React.FC = () => {
  const [upiLink, setUpiLink] = useState<string>("");
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [redirectAttempted, setRedirectAttempted] = useState<boolean>(false);
  const [showPaymentCard, setShowPaymentCard] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showRedirectFallback, setShowRedirectFallback] =
    useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showToast, setShowToast] = useState<boolean>(false);
  const [modalAnimation, setModalAnimation] = useState<boolean>(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    storeName: "Decor Drapes Instyle",
    amount: "0",
    customerName: "Guest",
    quoteNumber: "N/A",
    upiId: "decordrapes.instyle-3@okhdfcbank",
  });
  const [qrCodesGenerated, setQrCodesGenerated] = useState<boolean>(false);

  const qrCodeRef = useRef<HTMLCanvasElement>(null);
  const modalQrCodeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    loadPaymentDetails();
  }, []);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  useEffect(() => {
    if (paymentDetails.amount !== "0" && showPaymentCard && !qrCodesGenerated) {
      generateQrCodes(paymentDetails.amount);
    }
  }, [paymentDetails.amount, showPaymentCard, qrCodesGenerated]);

  useEffect(() => {
    if (showModal && modalQrCodeRef.current) {
      generateModalQrCode(paymentDetails.amount);
    }
  }, [showModal, paymentDetails.amount]);

  useEffect(() => {
    if (showModal) {
      setTimeout(() => setModalAnimation(true), 10);
    } else {
      setModalAnimation(false);
    }
  }, [showModal]);

  const loadPaymentDetails = (): void => {
    const params = new URLSearchParams(window.location.search);

    const customerName = params.get("customer") || "Guest";
    const quoteNumber = params.get("quote") || "N/A";
    const amount = params.get("amount") || "0";

    const upiLinkValue = `upi://pay?pa=${paymentDetails.upiId}&am=${amount}&cu=INR`;
    setUpiLink(upiLinkValue);
    document.title = `Pay ₹${amount} | ${paymentDetails.storeName}`;

    setPaymentDetails((prev) => ({
      ...prev,
      amount,
      customerName,
      quoteNumber,
    }));

    setShowPaymentCard(true);

    if (isMobile) {
      setTimeout(attemptUPIRedirect, 300);
    }
  };

  const generateQrCodes = async (amount: string): Promise<void> => {
    const minimalUpiLink = `upi://pay?pa=${paymentDetails.upiId}&am=${amount}`;

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (qrCodeRef.current) {
        const ctx = qrCodeRef.current.getContext("2d");
        if (ctx)
          ctx.clearRect(
            0,
            0,
            qrCodeRef.current.width,
            qrCodeRef.current.height
          );

        await QRCode.toCanvas(qrCodeRef.current, minimalUpiLink, {
          width: 200,
          margin: 2,
          color: { dark: "#000000", light: "#FFFFFF" },
        });
      }

      setQrCodesGenerated(true);
    } catch (error) {
      console.error("Error generating QR codes:", error);
    }
  };

  const generateModalQrCode = async (amount: string): Promise<void> => {
    const minimalUpiLink = `upi://pay?pa=${paymentDetails.upiId}&am=${amount}`;

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (modalQrCodeRef.current) {
        const ctx = modalQrCodeRef.current.getContext("2d");
        if (ctx)
          ctx.clearRect(
            0,
            0,
            modalQrCodeRef.current.width,
            modalQrCodeRef.current.height
          );

        await QRCode.toCanvas(modalQrCodeRef.current, minimalUpiLink, {
          width: 200,
          margin: 2,
          color: { dark: "#000000", light: "#FFFFFF" },
        });
      }
    } catch (error) {
      console.error("Error generating modal QR code:", error);
    }
  };

  const attemptUPIRedirect = (): void => {
    if (!redirectAttempted) {
      setRedirectAttempted(true);
      window.location.href = upiLink;

      setTimeout(() => {
        if (!document.hidden) {
          setShowRedirectFallback(true);
        }
      }, 2000);
    }
  };

  const handlePayment = (): void => {
    if (isMobile) {
      window.location.href = upiLink;

      setTimeout(() => {
        if (!document.hidden) setShowRedirectFallback(true);
      }, 1000);
    } else {
      setShowModal(true);
    }
  };

  const copyUpiId = (): void => {
    navigator.clipboard
      .writeText(paymentDetails.upiId)
      .then(() => showToastFunc("UPI ID copied"));
  };

  const showToastFunc = (msg: string): void => {
    setToastMessage(msg);
    setShowToast(true);
  };

  const animationStyles = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideIn {
      from { transform: translateY(-10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .animate-fadeIn {
      animation: fadeIn 0.5s ease-out;
    }
    .animate-slideIn {
      animation: slideIn 0.5s ease-out;
    }
  `;

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <style>{animationStyles}</style>

      {/* Payment Card */}
      {showPaymentCard && (
        <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden animate-fadeIn">
          {/* Top Bar */}
          <div className="flex flex-col items-center text-center p-6 border-b bg-gray-50">
            <a href="/">
              <img
                src="https://res.cloudinary.com/ds6um53cx/image/upload/v1754572073/eold8lngapg8mqff7pti.png"
                alt="Decor Drapes Instyle"
                className="h-12 w-auto mb-2"
              />
            </a>
            <p className="text-gray-500 text-sm">You are paying</p>
            <h1 className="text-lg font-semibold text-gray-800">
              {paymentDetails.storeName}
            </h1>
          </div>

          {/* Amount */}
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500 text-sm mb-1">Amount</p>
            <p className="text-4xl font-bold text-green-600">
              ₹ {paymentDetails.amount}
            </p>
          </div>

          {/* Customer Details */}
          <div className="px-6 pb-6">
            <div className="border rounded-xl bg-gray-50 p-4 shadow-sm">
              <div className="flex flex-col space-y-1">
                <p className="text-base font-medium text-gray-800">
                  {paymentDetails.customerName}
                </p>
                <p className="text-sm text-gray-500">
                  Quote #{paymentDetails.quoteNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Redirect Fallback */}
          {showRedirectFallback && (
            <div className="px-6 pb-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                <p className="text-sm text-yellow-700">
                  Redirect didn&apos;t work?{" "}
                  <button
                    onClick={() => setShowModal(true)}
                    className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1"
                  >
                    Tap here for other payment options
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* QR Desktop */}
          <div className="hidden md:flex flex-col items-center justify-center pb-6">
            <canvas
              ref={qrCodeRef}
              width="200"
              height="200"
              className="border border-gray-200 rounded-lg p-2 bg-white"
            ></canvas>
            <p className="text-xs text-gray-400 mt-2">Scan to pay</p>
          </div>

          {/* Pay Button */}
          {/* Sticky Pay Button */}
          <div className="p-6 border-t bg-white">
            <button
              onClick={handlePayment}
              className="block w-full text-center py-3 bg-green-600 text-white font-semibold rounded-xl shadow hover:bg-green-700 transition cursor-pointer"
            >
              Pay Now
            </button>

            {/* Supported Apps */}
            <div className="flex items-center justify-center space-x-3 mt-4">
              {/* GPay */}
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  width="48px"
                  height="48px"
                  baseProfile="basic"
                >
                  <path
                    fill="#ed5748"
                    d="M42.858,11.975c-4.546-2.624-10.359-1.065-12.985,3.481L23.25,26.927	c-1.916,3.312,0.551,4.47,3.301,6.119l6.372,3.678c2.158,1.245,4.914,0.506,6.158-1.649l6.807-11.789	C48.176,19.325,46.819,14.262,42.858,11.975z"
                  />
                  <path
                    fill="#fcc60e"
                    d="M35.365,16.723l-6.372-3.678c-3.517-1.953-5.509-2.082-6.954,0.214l-9.398,16.275	c-2.624,4.543-1.062,10.353,3.481,12.971c3.961,2.287,9.024,0.93,11.311-3.031l9.578-16.59	C38.261,20.727,37.523,17.968,35.365,16.723z"
                  />
                  <path
                    fill="#48b564"
                    d="M36.591,8.356l-4.476-2.585c-4.95-2.857-11.28-1.163-14.137,3.787L9.457,24.317	c-1.259,2.177-0.511,4.964,1.666,6.22l5.012,2.894c2.475,1.43,5.639,0.582,7.069-1.894l9.735-16.86	c2.017-3.492,6.481-4.689,9.974-2.672L36.591,8.356z"
                  />
                  <path
                    fill="#2c85eb"
                    d="M19.189,13.781l-4.838-2.787c-2.158-1.242-4.914-0.506-6.158,1.646l-5.804,10.03	c-2.857,4.936-1.163,11.252,3.787,14.101l3.683,2.121l4.467,2.573l1.939,1.115c-3.442-2.304-4.535-6.92-2.43-10.555l1.503-2.596	l5.504-9.51C22.083,17.774,21.344,15.023,19.189,13.781z"
                  />
                </svg>
              </div>
              {/* PhonePe */}
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  width="48px"
                  height="48px"
                >
                  <path
                    fill="#4527a0"
                    d="M42,37c0,2.762-2.238,5-5,5H11c-2.761,0-5-2.238-5-5V11c0-2.762,2.239-5,5-5h26c2.762,0,5,2.238,5,5	V37z"
                  />
                  <path
                    fill="#fff"
                    d="M32.267,20.171c0-0.681-0.584-1.264-1.264-1.264h-2.334l-5.35-6.25	c-0.486-0.584-1.264-0.778-2.043-0.584l-1.848,0.584c-0.292,0.097-0.389,0.486-0.195,0.681l5.836,5.666h-8.851	c-0.292,0-0.486,0.195-0.486,0.486v0.973c0,0.681,0.584,1.506,1.264,1.506h1.972v4.305c0,3.502,1.611,5.544,4.723,5.544	c0.973,0,1.378-0.097,2.35-0.486v3.112c0,0.875,0.681,1.556,1.556,1.556h0.786c0.292,0,0.584-0.292,0.584-0.584V21.969h2.812	c0.292,0,0.486-0.195,0.486-0.486V20.171z M26.043,28.413c-0.584,0.292-1.362,0.389-1.945,0.389c-1.556,0-2.097-0.778-2.097-2.529	v-4.305h4.043V28.413z"
                  />
                </svg>
              </div>
              {/* Paytm */}
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  width="48px"
                  height="48px"
                >
                  <path
                    fill="#0d47a1"
                    d="M5.446 18.01H.548c-.277 0-.502.167-.503.502L0 30.519c-.001.3.196.45.465.45.735 0 1.335 0 2.07 0C2.79 30.969 3 30.844 3 30.594 3 29.483 3 28.111 3 27l2.126.009c1.399-.092 2.335-.742 2.725-2.052.117-.393.14-.733.140-1.137l.110-2.862C7.999 18.946 6.949 18.181 5.446 18.01zM4.995 23.465C4.995 23.759 4.754 24 4.461 24H3v-3h1.461c.293 0 .534.24.534.535V23.465zM13.938 18h-3.423c-.260 0-.483.80-.483.351 0 .706 0 1.495 0 2.201C10.06 20.846 10.263 21 10.552 21h2.855c.594 0 .532.972 0 1H11.84C10.101 22 9 23.562 9 25.137c0 .420.005 1.406 0 1.863-.008.651-.014 1.311.112 1.899C9.336 29.939 10.235 31 11.597 31h4.228c.541 0 1.173-.474 1.173-1.101v-8.274C17.026 19.443 15.942 18.117 13.938 18zM14 27.55c0 .248-.202.45-.448.45h-1.105C12.201 28 12 27.798 12 27.55v-2.101C12 25.202 12.201 25 12.447 25h1.105C13.798 25 14 25.202 14 25.449V27.55zM18 18.594v5.608c.124 1.6 1.608 2.798 3.171 2.798h1.414c.597 0 .561.969 0 .969H19.49c-.339 0-.462.177-.462.476v2.152c0 .226.183.396.422.396h2.959c2.416 0 3.592-1.159 3.591-3.757v-8.84c0-.276-.175-.383-.342-.383h-2.302c-.224 0-.355.243-.355.422v5.218c0 .199-.111.316-.29.316H21.41c-.264 0-.409-.143-.409-.396v-5.058C21 18.218 20.88 18 20.552 18c-.778 0-1.442 0-2.22 0C18.067 18 18 18.263 18 18.594L18 18.594z"
                  />
                  <path
                    fill="#00adee"
                    d="M27.038 20.569v-2.138c0-.237.194-.431.430-.431H28c1.368-.285 1.851-.62 2.688-1.522.514-.557.966-.704 1.298-.113L32 18h1.569C33.807 18 34 18.194 34 18.431v2.138C34 20.805 33.806 21 33.569 21H32v9.569C32 30.807 31.806 31 31.57 31h-2.14C29.193 31 29 30.807 29 30.569V21h-1.531C27.234 21 27.038 20.806 27.038 20.569L27.038 20.569zM42.991 30.465c0 .294-.244.535-.539.535h-1.91c-.297 0-.54-.241-.54-.535v-6.623-1.871c0-1.284-2.002-1.284-2.002 0v8.494C38 30.759 37.758 31 37.461 31H35.54C35.243 31 35 30.759 35 30.465V18.537C35 18.241 35.243 18 35.54 18h1.976c.297 0 .539.241.539.537v.292c1.32-1.266 3.302-.973 4.416.228 2.097-2.405 5.69-.262 5.523 2.375 0 2.916-.026 6.093-.026 9.033 0 .294-.244.535-.538.535h-1.891C45.242 31 45 30.759 45 30.465c0-2.786 0-5.701 0-8.44 0-1.307-2-1.37-2 0v8.440H42.991z"
                  />
                </svg>
              </div>
              {/* BHIM UPI */}
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  width="48px"
                  height="48px"
                  baseProfile="basic"
                >
                  <polygon fill="#388e3c" points="29,4 18,45 40,24" />
                  <polygon fill="#f57c00" points="21,3 10,44 32,23" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              We support all UPI apps
            </p>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div
            className={`bg-white rounded-xl shadow-lg max-w-md w-full p-4 transform transition-all duration-200 ${
              modalAnimation ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">Payment</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-gray-700 text-sm">
              <div className="bg-yellow-50 border-l-2 border-yellow-400 px-4 py-2 rounded-md text-yellow-800">
                You don&apos;t have a UPI app installed. Scan the QR code below
                to pay.
              </div>

              <div className="bg-gray-50 p-3 rounded-md space-y-2 text-gray-800">
                <div className="flex justify-between">
                  <span>Customer</span>
                  <span className="font-medium">
                    {paymentDetails.customerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Quote</span>
                  <span>#{paymentDetails.quoteNumber}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                  <span>Amount</span>
                  <span>₹ {paymentDetails.amount}</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-3">
                <canvas
                  ref={modalQrCodeRef}
                  width="200"
                  height="200"
                  className="border border-gray-200 rounded-lg p-2 bg-white"
                ></canvas>
                <div className="flex items-center gap-2 text-gray-700 text-sm">
                  <span>{paymentDetails.upiId}</span>
                  <button
                    onClick={copyUpiId}
                    className="text-gray-700 hover:bg-gray-100 rounded p-1"
                    title="Copy UPI ID"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-3 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1 text-gray-700 rounded hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-5 right-5 bg-gray-800 text-white px-4 py-2 rounded shadow-md text-sm animate-slideIn z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default Payment;
