import React, { useState } from 'react'

interface FileMenuProps {
  onNewProject?: () => void
  onOpenProject?: () => void
  onSaveProject?: () => void
  onExportImage?: () => void
  onSettings?: () => void
}

const FileMenu: React.FC<FileMenuProps> = ({
  onNewProject,
  onOpenProject,
  onSaveProject,
  onExportImage,
  onSettings
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleMenuClose = () => {
    setIsMenuOpen(false)
  }

  return (
    <div style={{ 
      position: 'relative',
      marginBottom: '10px',
      zIndex: 1000,
      width: '100%'
    }}>
      {/* File Menu Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: '#2a2a2a',
          border: '1px solid #555',
          borderRadius: '4px',
          cursor: 'pointer',
          color: '#fff',
          fontSize: '14px',
          fontWeight: '500',
          width: '100%',
          justifyContent: 'flex-start'
        }}
        onClick={handleMenuToggle}
        onBlur={() => setTimeout(handleMenuClose, 150)}
      >
        {/* File Icon */}
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          style={{ flexShrink: 0 }}
        >
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
        File
      </div>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            backgroundColor: '#2a2a2a',
            border: '1px solid #555',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            minWidth: '160px',
            zIndex: 1001
          }}
        >
          {/* New Project */}
          <div
            style={{
              padding: '10px 16px',
              cursor: 'pointer',
              borderBottom: '1px solid #444',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#fff',
              fontSize: '13px'
            }}
            onClick={() => {
              onNewProject?.()
              handleMenuClose()
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
            </svg>
            New Project
          </div>

          {/* Open Project */}
          <div
            style={{
              padding: '10px 16px',
              cursor: 'pointer',
              borderBottom: '1px solid #444',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#fff',
              fontSize: '13px'
            }}
            onClick={() => {
              onOpenProject?.()
              handleMenuClose()
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
            Open Project
          </div>

          {/* Save Project */}
          <div
            style={{
              padding: '10px 16px',
              cursor: 'pointer',
              borderBottom: '1px solid #444',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#fff',
              fontSize: '13px'
            }}
            onClick={() => {
              onSaveProject?.()
              handleMenuClose()
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15,9H5V5H15M12,19A3,3 0 0,1 9,22A3,3 0 0,1 6,19A3,3 0 0,1 9,16A3,3 0 0,1 12,19M6,6V14A3,3 0 0,0 9,17H15A3,3 0 0,0 18,14V6H6Z" />
            </svg>
            Save Project
          </div>

          {/* Export Image */}
          <div
            style={{
              padding: '10px 16px',
              cursor: 'pointer',
              borderBottom: '1px solid #444',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#fff',
              fontSize: '13px'
            }}
            onClick={() => {
              onExportImage?.()
              handleMenuClose()
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
            Export Image
          </div>

          {/* Settings */}
          <div
            style={{
              padding: '10px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#fff',
              fontSize: '13px'
            }}
            onClick={() => {
              onSettings?.()
              handleMenuClose()
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
            </svg>
            Settings
          </div>
        </div>
      )}
    </div>
  )
}

export default FileMenu
