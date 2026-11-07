/**
 * @fileOverview Atomic Startup Loader with Strictly Inline Centering.
 * Prevents "Top-Left" frozen spinner bug by bypassing CSS external loading.
 */
export default function Loading() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
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
        .startup-spinner {
          width: 50px !important;
          height: 50px !important;
          border: 5px solid #f3f3f3 !important;
          border-top: 5px solid #EF4444 !important;
          border-radius: 50% !important;
          animation: startup-spin 0.8s linear infinite !important;
          margin-bottom: 20px !important;
        }
        .startup-text {
          font-family: sans-serif !important;
          font-size: 11px !important;
          font-weight: 900 !important;
          color: #EF4444 !important;
          text-transform: uppercase !important;
          letter-spacing: 3px !important;
        }
      `}} />
      <div className="startup-spinner"></div>
      <div className="startup-text">ShopyKart 1.4.0</div>
    </div>
  );
}
