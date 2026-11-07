
/**
 * @fileOverview Atomic Fast Loading UI for v1.4.
 * Uses strictly inline-css with viewport centering to prevent "Top-Left Freeze".
 * Zero dependencies for initial paint.
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
      zIndex: 2147483647
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-loader { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes pulse-loader { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.95); } }
      `}} />
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '32px' 
      }}>
        {/* Centered Circular Spinner */}
        <div style={{
          width: '64px',
          height: '64px',
          border: '6px solid rgba(239, 68, 68, 0.08)',
          borderTop: '6px solid #EF4444',
          borderRadius: '50%',
          animation: 'spin-loader 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite'
        }} />

        <div style={{ textAlign: 'center', animation: 'pulse-loader 2s ease-in-out infinite' }}>
          <p style={{
            fontSize: '14px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.4em',
            color: '#111827',
            fontStyle: 'italic',
            margin: 0
          }}>
            SHOPYKART
          </p>
          <div style={{
            width: '40px',
            height: '2px',
            backgroundColor: '#EF4444',
            margin: '10px auto'
          }} />
          <p style={{
            fontSize: '9px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: '#9CA3AF',
            marginTop: '4px'
          }}>
            GOURMET NETWORK v1.4
          </p>
        </div>
      </div>
    </div>
  );
}
