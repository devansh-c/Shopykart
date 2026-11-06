/**
 * @fileOverview Atomic Fast Loading UI with Inline Recovery Styles.
 * Uses inline-css to ensure centering even if globals.css is blocked during hydration.
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
      zIndex: 999999
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #EF4444',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p style={{
            fontSize: '10px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.4em',
            color: '#111827',
            fontStyle: 'italic',
            margin: 0
          }}>
            ShopyKart
          </p>
          <p style={{
            fontSize: '7px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#9CA3AF',
            marginTop: '4px',
            margin: '4px 0 0 0'
          }}>Gourmet Delivery Network</p>
        </div>
      </div>
    </div>
  );
}