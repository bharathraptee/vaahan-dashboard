import React from 'react'

export const LoadingOverlay = ({ loadingStatus }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '5px solid rgba(59, 130, 246, 0.2)',
        borderTop: '5px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '1.5rem'
      }}></div>
      <h3 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
        {loadingStatus || "Fetching Data from Vahan..."}
      </h3>
      <p style={{ color: '#cbd5e1', fontSize: '0.9rem', maxWidth: '400px', textAlign: 'center' }}>
        Bypassing Vahan rate limits & sequencing endpoints to ensure 100% accurate data...
      </p>
    </div>
  )
}

