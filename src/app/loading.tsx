/**
 * @fileOverview Atomic Startup Loader for ShopyKart v1.4.0.
 * FIXED: Uses strictly inline-css and a minimal structure to prevent top-left hydration freeze.
 * Centered globally with high z-index to ensure visibility regardless of component locks.
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
        .startup-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .startup-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #EF4444;
          border-radius: 50%;
          animation: startup-spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .startup-text {
          font-family: sans-serif;
          font-size: 10px;
          font-weight: 900;
          color: #EF4444;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
      `}} />
      <div className="startup-container">
        <div className="startup-spinner"></div>
        <div className="startup-text">ShopyKart 1.4.0</div>
      </div>
    </div>
  );
}
