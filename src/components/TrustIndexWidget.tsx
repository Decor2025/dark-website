// TrustIndexWidget.tsx
import { useEffect, useState, useRef } from "react";

declare global {
  interface Window {
    Trustindex: any;
  }
}

export default function TrustIndexWidget() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [widgetError, setWidgetError] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    // Function to initialize the widget
    const initializeWidget = () => {
      if (!window.Trustindex || !widgetRef.current) {
        if (retryCount.current < maxRetries) {
          retryCount.current += 1;
          setTimeout(initializeWidget, 1000 * retryCount.current);
          return;
        } else {
          setWidgetError(true);
          return;
        }
      }

      try {
        // Initialize the Trustindex widget
        window.Trustindex.init();
        
        // Check if widget loaded successfully after a delay
        const checkWidget = setTimeout(() => {
          const widgetElement = widgetRef.current;
          if (widgetElement && widgetElement.children.length === 0) {
            setWidgetError(true);
          }
        }, 3000);
        
        return () => clearTimeout(checkWidget);
      } catch (error) {
        console.error("Error initializing TrustIndex widget:", error);
        setWidgetError(true);
      }
    };

    // Check if Trustindex is already available
    if (window.Trustindex) {
      setIsScriptLoaded(true);
      initializeWidget();
      return;
    }

    // Check if script is already in the document
    const existingScript = document.getElementById("trustindex-script") as HTMLScriptElement;
    if (existingScript) {
      if (existingScript.getAttribute("data-loaded") === "true") {
        setIsScriptLoaded(true);
        initializeWidget();
        return;
      }
      
      // If script exists but isn't loaded yet, wait for it
      existingScript.onload = () => {
        setIsScriptLoaded(true);
        initializeWidget();
      };
      
      existingScript.onerror = () => {
        setWidgetError(true);
      };
      
      return;
    }

    // Load the script
    const script = document.createElement("script");
    script.src = "https://cdn.trustindex.io/loader.js";
    script.id = "trustindex-script";
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      script.setAttribute("data-loaded", "true");
      setIsScriptLoaded(true);
      initializeWidget();
    };
    
    script.onerror = () => {
      console.error("Failed to load TrustIndex script");
      setWidgetError(true);
    };
    
    document.body.appendChild(script);

    return () => {
      // Clean up any existing widget elements
      const widgets = document.querySelectorAll(".ti-widget");
      widgets.forEach(widget => {
        if (widget.parentNode && widget !== widgetRef.current) {
          widget.parentNode.removeChild(widget);
        }
      });
    };
  }, []);

  const reloadWidget = () => {
    setWidgetError(false);
    retryCount.current = 0;
    
    // Remove existing script and reload
    const existingScript = document.getElementById("trustindex-script");
    if (existingScript) {
      existingScript.remove();
    }
    
    // Remove any existing widget elements
    const widgets = document.querySelectorAll(".ti-widget");
    widgets.forEach(widget => {
      if (widget.parentNode) {
        widget.parentNode.removeChild(widget);
      }
    });
    
    // Reload the script
    const script = document.createElement("script");
    script.src = "https://cdn.trustindex.io/loader.js";
    script.id = "trustindex-script";
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      script.setAttribute("data-loaded", "true");
      setIsScriptLoaded(true);
      
      // Reinitialize after a short delay
      setTimeout(() => {
        if (window.Trustindex && window.Trustindex.init) {
          window.Trustindex.init();
        }
      }, 500);
    };
    
    script.onerror = () => {
      setWidgetError(true);
    };
    
    document.body.appendChild(script);
  };

  return (
    <div className="w-full flex justify-center my-8 min-h-[300px] relative">
      <div
        ref={widgetRef}
        className="ti-widget"
        data-ti-widget-id="f75f7915314f21892506016006b"
        style={{ width: "100%", minHeight: "300px" }}
      ></div>
      
      {/* Loading state */}
      {!isScriptLoaded && !widgetError && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg p-8 text-center flex flex-col items-center justify-center">
          <div className="animate-pulse w-full max-w-md">
            <div className="h-6 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3 mx-auto mb-6"></div>
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-6 h-6 bg-gray-300 rounded-full"></div>
              ))}
            </div>
            <div className="h-20 bg-gray-300 rounded mb-4"></div>
          </div>
          <p className="text-gray-600 mt-4">Loading reviews...</p>
        </div>
      )}
      
      {/* Error state */}
      {widgetError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white rounded-lg p-8 border border-gray-200">
          <div className="text-center">
            <div className="text-yellow-500 text-5xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Reviews Not Available</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              We're having trouble loading reviews at the moment. This might be due to a temporary issue with our review provider.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                onClick={reloadWidget}
              >
                Try Again
              </button>
              <a 
                href="/testimonials"
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                View Our Testimonials
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              In the meantime, feel free to <a href="/contact" className="text-indigo-600 hover:underline">contact us</a> directly with any questions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}