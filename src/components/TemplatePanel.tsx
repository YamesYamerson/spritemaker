import React, { useState } from 'react'

interface TemplatePanelProps {
  canvasSize: number
  onTemplateSelect: (templateData: string[][]) => void
}

interface SpriteTemplate {
  id: string
  name: string
  sizes: {
    [key: number]: string[][] // Canvas size -> pixel data
  }
  description: string
}

const TemplatePanel: React.FC<TemplatePanelProps> = ({
  canvasSize,
  onTemplateSelect
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<SpriteTemplate | null>(null)

  // Egg sprite template - different versions for different canvas sizes
  const eggTemplate: SpriteTemplate = {
    id: 'egg',
    name: 'Egg Sprite',
    description: 'A simple egg outline sprite with black borders',
    sizes: {
      16: [
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '#000', '#000', '', '', ''],
        ['', '', '#000', '', '', '#000', '', ''],
        ['', '#000', '', '', '', '', '#000', ''],
        ['', '#000', '', '', '', '', '#000', ''],
        ['', '', '#000', '', '', '#000', '', ''],
        ['', '', '', '#000', '#000', '', '', '']
      ],
      32: [
        ['', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '#000', '#000', '', '', '', ''],
        ['', '', '', '#000', '', '', '#000', '', '', ''],
        ['', '', '#000', '', '', '', '', '#000', '', ''],
        ['', '#000', '', '', '', '', '', '', '#000', ''],
        ['', '#000', '', '', '', '', '', '', '#000', ''],
        ['', '#000', '', '', '', '', '', '', '#000', ''],
        ['', '', '#000', '', '', '', '', '#000', '', ''],
        ['', '', '', '#000', '', '', '#000', '', '', ''],
        ['', '', '', '', '#000', '#000', '', '', '', '']
      ],
      64: [
        ['', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '#000', '#000', '', '', '', '', ''],
        ['', '', '', '', '#000', '', '', '#000', '', '', '', ''],
        ['', '', '', '#000', '', '', '', '', '#000', '', '', ''],
        ['', '', '#000', '', '', '', '', '', '', '#000', '', ''],
        ['', '#000', '', '', '', '', '', '', '', '', '#000', ''],
        ['', '#000', '', '', '', '', '', '', '', '', '#000', ''],
        ['', '#000', '', '', '', '', '', '', '', '', '#000', ''],
        ['', '', '#000', '', '', '', '', '', '', '#000', '', ''],
        ['', '', '', '#000', '', '', '', '', '#000', '', '', ''],
        ['', '', '', '', '#000', '', '', '#000', '', '', '', ''],
        ['', '', '', '', '', '#000', '#000', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', '', '', '']
      ]
    }
  }

  const templates = [eggTemplate]

  const handleTemplateSelect = (template: SpriteTemplate) => {
    setSelectedTemplate(template)
    setShowModal(true)
    // Template is NOT applied here - only when user confirms
  }

  const handleConfirmTemplate = () => {
    if (selectedTemplate) {
      const templateData = selectedTemplate.sizes[canvasSize]
      if (templateData) {
        // Apply template only when user confirms with "Yes"
        onTemplateSelect(templateData)
      }
      setShowModal(false)
      setSelectedTemplate(null)
    }
  }

  const handleCancelTemplate = () => {
    setShowModal(false)
    setSelectedTemplate(null)
  }

  const renderTemplatePreview = (template: SpriteTemplate) => {
    const templateData = template.sizes[canvasSize]
    if (!templateData) return null

    const pixelSize = Math.max(2, Math.floor(64 / templateData.length)) // Scale to fit in 64px preview
    const previewSize = templateData.length * pixelSize

    return (
      <div style={{
        width: `${previewSize}px`,
        height: `${previewSize}px`,
        border: '1px solid #555',
        borderRadius: '4px',
        overflow: 'hidden',
        backgroundColor: '#444' // Lighter background to show black outlines better
      }}>
        {templateData.map((row, y) => (
          <div key={y} style={{ display: 'flex' }}>
            {row.map((pixel, x) => (
              <div
                key={x}
                style={{
                  width: `${pixelSize}px`,
                  height: `${pixelSize}px`,
                  backgroundColor: pixel || 'transparent',
                  border: pixel ? 'none' : '1px solid #666' // Lighter border for transparent pixels
                }}
              />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{
      width: '100%',
      height: isCollapsed ? 'auto' : '200px',
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
          Sprite Templates
        </span>
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
          {templates.map((template) => {
            const templateData = template.sizes[canvasSize]
            return (
              <div
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  backgroundColor: '#3a3a3a',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4a4a4a'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
                title={`Click to use ${template.name} template`}
              >
                {/* Template Preview */}
                {renderTemplatePreview(template)}
                
                {/* Template Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    {template.name}
                  </div>
                  <div style={{ color: '#aaa', fontSize: '12px' }}>
                    {template.description}
                  </div>
                  <div style={{ color: '#888', fontSize: '11px', marginTop: '4px' }}>
                    Size: {canvasSize}x{canvasSize} {templateData ? '✓' : '✗'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Template Confirmation Modal */}
      {showModal && selectedTemplate && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 1000
            }}
            onClick={handleCancelTemplate}
          />
          
          {/* Modal */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#2a2a2a',
              border: '1px solid #555',
              borderRadius: '8px',
              padding: '20px',
              zIndex: 1001,
              minWidth: '300px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              color: '#fff', 
              fontSize: '16px', 
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              Do you want to apply the "{selectedTemplate.name}" template?
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleCancelTemplate}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#555',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                No
              </button>
              <button
                onClick={handleConfirmTemplate}
                disabled={!selectedTemplate.sizes[canvasSize]}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedTemplate.sizes[canvasSize] ? '#4a4a4a' : '#2a2a2a',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: selectedTemplate.sizes[canvasSize] ? '#fff' : '#666',
                  cursor: selectedTemplate.sizes[canvasSize] ? 'pointer' : 'not-allowed',
                  fontSize: '14px'
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default TemplatePanel
