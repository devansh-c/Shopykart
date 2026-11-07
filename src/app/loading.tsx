/**
 * @fileOverview Atomic Startup Loader with Strictly Inline Styles.
 * FIX: Centered strictly using CSS to prevent "Top-Left" frozen spinner bug.
 * This loader does not wait for JS hydration to be visible.
 */
export default function Loading() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
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
        .startup-spinner {
          width: 50px !important;
          height: 50px !important;
          border: 4px solid #f3f3f3 !important;
          border-top: 4px solid #EF4444 !important;
          border-radius: 50% !important;
          animation: startup-spin 0.6s linear infinite !important;
          margin-bottom: 20px !important;
        }
        .startup-text {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
          font-size: 10px !important;
          font-weight: 900 !important;
          color: #EF4444 !important;
          text-transform: uppercase !important;
          letter-spacing: 4px !important;
        }
      `}} />
      <div className="startup-spinner"></div>
      <div className="startup-text">ShopyKart 1.4.0</div>
    </div>
  );
}
