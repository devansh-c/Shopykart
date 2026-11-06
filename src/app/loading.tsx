
/**
 * @fileOverview Atomic Fast Loading UI for v1.4.
 * Uses strictly inline-css to prevent "Top-Left Freeze" during hydration.
 */
export default function Loading() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff',
      zIndex: 2147483647
    }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '20px' 
      }}>
        {/* CSS-only spinner that works even if JS/Hydration is locked */}
        <div className="main-app-spinner" style={{
          width: '50px',
          height: '50px',
          border: '5px solid rgba(239, 68, 68, 0.1)',
          borderTop: '5px solid #EF4444',
          borderRadius: '50%',
          animation: 'spin-loader 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite'
        }} />
        
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin-loader { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}} />

        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.5em',
            color: '#111827',
            fontStyle: 'italic',
            margin: 0
          }}>
            SHOPYKART
          </p>
          <p style={{
            fontSize: '7px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: '#9CA3AF',
            marginTop: '6px'
          }}>
            GOURMET NETWORK v1.4
          </p>
        </div>
      </div>
    </div>
  );
}
