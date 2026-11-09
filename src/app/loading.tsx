/**
 * @fileOverview Atomic Startup Loader - Full Viewport Fix.
 * Uses strictly Inline CSS to bypass hydration locks and top-left freezing.
 */
export default function Loading() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff',
      zIndex: 2147483647,
      pointerEvents: 'none'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes startup-spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      `}} />
      <div style={{
        width: '44px',
        height: '44px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #EF4444',
        borderRadius: '50%',
        animation: 'startup-spin 0.8s linear infinite',
        marginBottom: '24px',
        boxShadow: '0 4px 15px rgba(239,68,68,0.1)'
      }}></div>
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontSize: '11px',
        fontWeight: '900',
        color: '#EF4444',
        textTransform: 'uppercase',
        letterSpacing: '4px',
        opacity: 0.8
      }}>
        ShopyKart 1.4.0
      </div>
    </div>
  );
}
