import React, { useState, useEffect } from 'react'

interface SaveTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, description: string, tags: string[]) => void
  canvasSize: number
  isLoading?: boolean
}

const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  canvasSize,
  isLoading = false
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setName('')
      setDescription('')
      setTags('')
    }
  }, [isOpen])

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a template name')
      return
    }

    const tagArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    onSave(name.trim(), description.trim(), tagArray)
    handleClose()
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setTags('')
    onClose()
  }

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
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#2a2a2a',
        border: '1px solid #555',
        borderRadius: '8px',
        padding: '24px',
        width: '400px',
        maxWidth: '90vw'
      }}>
        <h3 style={{
          color: '#fff',
          margin: '0 0 20px 0',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Save as Template
        </h3>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: '#fff',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            Template Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter template name"
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#3a3a3a',
              border: '1px solid #555',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '14px'
            }}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: '#fff',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your template (optional)"
            rows={3}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#3a3a3a',
              border: '1px solid #555',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: '#fff',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            Tags
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Enter tags separated by commas (optional)"
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#3a3a3a',
              border: '1px solid #555',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <span style={{
            color: '#aaa',
            fontSize: '12px'
          }}>
            Canvas Size: {canvasSize}x{canvasSize}
          </span>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4a4a4a',
              border: '1px solid #555',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: isLoading ? '#666' : '#007acc',
              border: `1px solid ${isLoading ? '#666' : '#007acc'}`,
              borderRadius: '4px',
              color: '#fff',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? 'Saving...' : 'Save Template'}
          </button>
        </div>

        {/* Simple instructions */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#3a3a3a',
          border: '1px solid #555',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#aaa'
        }}>
          <strong>Template will be saved to:</strong> <code>public/templates/{canvasSize}x{canvasSize}/</code>
        </div>
      </div>
    </div>
  )
}

export default SaveTemplateModal
