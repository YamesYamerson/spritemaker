import React from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  disabled?: boolean
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Yes',
  cancelText = 'No',
  disabled = false
}) => {
  // Component rendering

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#2a2a2a',
        border: '1px solid #555',
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
      }}>
        <h3 style={{
          color: '#fff',
          margin: '0 0 15px 0',
          fontSize: '18px',
          fontWeight: '500'
        }}>
          {title}
        </h3>
        
        <p style={{
          color: '#ccc',
          margin: '0 0 20px 0',
          fontSize: '14px',
          lineHeight: '1.4'
        }}>
          {message}
        </p>
        
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4a4a4a',
              border: '1px solid #555',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            style={{
              padding: '8px 16px',
              backgroundColor: disabled ? '#666' : '#4a7cff',
              border: '1px solid #555',
              borderRadius: '4px',
              color: '#fff',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: disabled ? 0.6 : 1
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
