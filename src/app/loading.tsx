/**
 * @fileOverview Atomic Startup Loader - Centered strictly using Inline CSS to avoid hydration blocks.
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
      `}} />
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #EF4444',
        borderRadius: '50%',
        animation: 'startup-spin 0.8s linear infinite',
        marginBottom: '20px'
      }}></div>
      <div style={{
        fontFamily: 'sans-serif',
        fontSize: '10px',
        fontWeight: '900',
        color: '#EF4444',
        textTransform: 'uppercase',
        letterSpacing: '4px'
      }}>
        ShopyKart 1.4.0
      </div>
    </div>
  );
}