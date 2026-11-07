
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
        width: '50px',
        height: '50px',
        border: '5px solid #f3f3f3',
        borderTop: '5px solid #EF4444',
        borderRadius: '50%',
        animation: 'startup-spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite'
      }} />
    </div>
  );
}
