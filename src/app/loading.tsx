/**
 * @fileOverview Atomic Startup Loader for ShopyKart v1.4.0.
 * FIXED: Uses strictly inline-css and a minimal structure to prevent top-left hydration freeze.
 * Centered globally with high z-index and !important rules to ensure visibility.
 */
export default function Loading() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff',
      zIndex: 9999999,
      pointerEvents: 'none'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes startup-spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
        .startup-container {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 20px !important;
        }
        .startup-spinner {
          width: 40px !important;
          height: 40px !important;
          border: 4px solid #f3f3f3 !important;
          border-top: 4px solid #EF4444 !important;
          border-radius: 50% !important;
          animation: startup-spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite !important;
        }
        .startup-text {
          font-family: sans-serif !important;
          font-size: 10px !important;
          font-weight: 900 !important;
          color: #EF4444 !important;
          text-transform: uppercase !important;
          letter-spacing: 2px !important;
        }
      `}} />
      <div className="startup-container">
        <div className="startup-spinner"></div>
        <div className="startup-text">ShopyKart 1.4.0</div>
      </div>
    </div>
  );
}