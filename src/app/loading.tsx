
/**
 * @fileOverview Centered Minimalist Loader for v1.4.0.
 * Uses strictly inline-css to avoid top-left freezing during hydration.
 */
export default function Loading() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff',
      zIndex: 2147483647
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes startup-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}} />
      <div style={{
        width: '48px',
        height: '48px',
        border: '5px solid #f3f3f3',
        borderTop: '5px solid #EF4444',
        borderRadius: '50%',
        animation: 'startup-spin 0.8s linear infinite'
      }} />
    </div>
  );
}
