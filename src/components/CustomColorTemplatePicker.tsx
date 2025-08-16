import React, { useState, useEffect } from 'react'
import { Color } from '../types'

interface CustomColorTemplate {
  id: string
  name: string
  colors: Color[]
}

interface CustomColorTemplatePickerProps {
  onColorSelect: (color: Color) => void
}

const CustomColorTemplatePicker: React.FC<CustomColorTemplatePickerProps> = ({
  onColorSelect
}) => {
  const [templates, setTemplates] = useState<CustomColorTemplate[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Default template with 10 pastel colors (because pastels are fun!)
  const defaultTemplate: CustomColorTemplate = {
    id: 'default',
    name: 'Default (Pastel)',
    colors: [
      '#ffb3ba', '#baffc9', '#bae1ff', '#ffffba', '#ffb3f0',
      '#f0b3ff', '#b3f0ff', '#ffd4b3', '#d4b3ff', '#b3ffd4'
    ]
  }

  // Load templates from localStorage on mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('customColorTemplates')
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates)
        setTemplates(parsed)
      } catch (error) {
        console.warn('Failed to parse saved color templates:', error)
      }
    }
  }, [])

  // Save templates to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('customColorTemplates', JSON.stringify(templates))
  }, [templates])

  const handleCreateTemplate = () => {
    if (newTemplateName.trim()) {
      const newTemplate: CustomColorTemplate = {
        id: Date.now().toString(),
        name: newTemplateName.trim(),
        colors: [...defaultTemplate.colors] // Copy default colors
      }
      
      setTemplates(prev => [...prev, newTemplate])
      setIsCreating(false)
      setNewTemplateName('')
    }
  }

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId))
  }

  const handleColorClick = (color: Color) => {
    onColorSelect(color)
  }

  const allTemplates = [defaultTemplate, ...templates]

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #555',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        backgroundColor: '#2a2a2a',
        border: '1px solid #555',
        borderBottom: '1px solid #555',
        borderTopLeftRadius: '4px',
        borderTopRightRadius: '4px'
      }}>
        <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
          Color Templates
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setIsCreating(true)}
            style={{
              padding: '4px 8px',
              backgroundColor: '#4a4a4a',
              border: '1px solid #555',
              borderRadius: '3px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              minWidth: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Create New Template"
          >
            +
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              padding: '4px 8px',
              backgroundColor: '#4a4a4a',
              border: '1px solid #555',
              borderRadius: '3px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              minWidth: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="currentColor"
              style={{
                transform: isCollapsed ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease'
              }}
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div style={{
          flex: 1,
          minHeight: 0,
          padding: '12px',
          overflowY: 'auto',
          backgroundColor: '#2a2a2a',
          border: '1px solid #555',
          borderTop: 'none',
          borderBottomLeftRadius: '4px',
          borderBottomRightRadius: '4px'
        }}>
          {/* Template Creation Form */}
          {isCreating && (
            <div style={{
              backgroundColor: '#3a3a3a',
              border: '1px solid #555',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '12px'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Template name..."
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px',
                    backgroundColor: '#444',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
              </div>
              
              <div style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => {
                    setIsCreating(false)
                    setNewTemplateName('')
                  }}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#555',
                    border: '1px solid #555',
                    borderRadius: '3px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTemplate}
                  disabled={newTemplateName.trim().length === 0}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: newTemplateName.trim().length > 0 ? '#4a4a4a' : '#2a2a2a',
                    border: '1px solid #555',
                    borderRadius: '3px',
                    color: newTemplateName.trim().length > 0 ? '#fff' : '#666',
                    cursor: newTemplateName.trim().length > 0 ? 'pointer' : 'not-allowed',
                    fontSize: '11px'
                  }}
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {/* Templates List */}
          {allTemplates.map((template) => (
            <div
              key={template.id}
              style={{
                marginBottom: '12px'
              }}
            >
              {/* Template Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {template.name}
                </span>
                {template.id !== 'default' && (
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    style={{
                      padding: '2px 6px',
                      backgroundColor: '#ff4444',
                      border: '1px solid #ff4444',
                      borderRadius: '3px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                    title="Delete Template"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Template Colors */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(10, 22px)',
                gap: '0px'
              }}>
                {template.colors.map((color, index) => (
                  <div
                    key={index}
                    onClick={() => handleColorClick(color)}
                    style={{
                      width: '22px',
                      height: '22px',
                      backgroundColor: color,
                      border: '1px solid #555',
                      borderRadius: '0px',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomColorTemplatePicker
