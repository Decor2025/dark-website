// TrustIndexIframeWidget.tsx
export default function TrustIndexIframeWidget() {
  return (
    <div className="w-full flex justify-center my-8 overflow-hidden trustindex-widget-container">
      <iframe 
        src="https://cdn.trustindex.io/amp-widget.html#f75f7915314f21892506016006b"
        style={{ 
          width: '100%', 
          height: '500px', 
          border: 'none',
          overflow: 'hidden'
        }}
        sandbox='allow-scripts allow-same-origin' 
        title="TrustIndex Reviews"
        scrolling="no"
        frameBorder="0"
      ></iframe>
    </div>
  );
}