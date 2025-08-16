import React, { useState } from 'react'
import { Template, TemplateSize } from '../types'
import ConfirmModal from './ConfirmModal'
import { loadTemplate, applyTemplateToCanvas } from '../utils/templateLoader'

interface TemplatePanelProps {
  onTemplateSelect?: (template: Template, size: TemplateSize) => void
  currentCanvasSize?: number
  canvasRef?: React.RefObject<HTMLCanvasElement>
}

const TemplatePanel: React.FC<TemplatePanelProps> = ({ 
  onTemplateSelect, 
  currentCanvasSize = 32,
  canvasRef
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<{ template: Template; size: TemplateSize } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Simple egg template data
  const eggTemplate: Template = {
    id: 'egg',
    name: 'Egg',
    description: 'A simple egg shape template',
    sizes: [
      {
        width: 16,
        height: 16,
        svgPath: '/templates/16x16/egg.svg',
        previewPath: '/templates/16x16/egg.svg'
      },
      {
        width: 32,
        height: 32,
        svgPath: '/templates/32x32/egg.svg',
        previewPath: '/templates/32x32/egg.svg'
      },
      {
        width: 64,
        height: 64,
        svgPath: '/templates/64x64/egg.svg',
        previewPath: '/templates/64x64/egg.svg'
      },
      {
        width: 128,
        height: 128,
        svgPath: '/templates/128x128/egg.svg',
        previewPath: '/templates/128x128/egg.svg'
      },
      {
        width: 256,
        height: 256,
        svgPath: '/templates/256x256/egg.svg',
        previewPath: '/templates/256x256/egg.svg'
      }
    ]
  }

  const handleTemplateSelect = (template: Template, size: TemplateSize) => {
    if (onTemplateSelect) {
      onTemplateSelect(template, size)
    }
    
    // Show confirmation modal
    setSelectedTemplate({ template, size })
    setShowConfirmModal(true)
  }

  const handleConfirmTemplate = async () => {
    if (!selectedTemplate || !canvasRef?.current) {
      setShowConfirmModal(false)
      return
    }

    setIsLoading(true)
    try {
      // Load the template
      const parsedTemplate = await loadTemplate(selectedTemplate.size.svgPath)
      
      // Apply template to canvas using the new method
      const newPixels = applyTemplateToCanvas(parsedTemplate, 1) // Default layer ID
      
      // Apply template using the canvas method
      if (canvasRef.current.applyTemplate) {
        canvasRef.current.applyTemplate(newPixels)
      }
      
      console.log(`Template "${selectedTemplate.template.name}" applied successfully`)
    } catch (error) {
      console.error('Failed to apply template:', error)
      alert('Failed to apply template. Please try again.')
    } finally {
      setIsLoading(false)
      setShowConfirmModal(false)
      setSelectedTemplate(null)
    }
  }

  const handleCancelTemplate = () => {
    setShowConfirmModal(false)
    setSelectedTemplate(null)
  }

  const getCurrentSize = () => {
    return eggTemplate.sizes.find(size => size.width === currentCanvasSize) || eggTemplate.sizes[2] // Default to 64x64
  }

  const currentSize = getCurrentSize()

  if (isCollapsed) {
    return (
      <div style={{
        width: '100%',
        backgroundColor: '#2a2a2a',
        border: '1px solid #555',
        borderRadius: '4px',
        padding: '8px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
          Templates
        </span>
        <button
          onClick={() => setIsCollapsed(false)}
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
          title="Expand"
        >
          <svg
            fill="currentColor"
            height="12"
            width="12"
            viewBox="0 0 12 12"
            style={{ transform: 'rotate(180deg)', transition: 'transform 0.2s ease' }}
          >
            <path
              d="M2 4l4 4 4-4"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <>
      <div style={{
        width: '100%',
        backgroundColor: '#2a2a2a',
        border: '1px solid #555',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        {/* Header */}
        <div style={{
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          backgroundColor: '#2a2a2a',
          border: '1px solid #555',
          borderTopLeftRadius: '4px',
          borderTopRightRadius: '4px'
        }}>
          <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
            Templates
          </span>
          <button
            onClick={() => setIsCollapsed(true)}
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
            title="Collapse"
          >
            <svg
              fill="currentColor"
              height="12"
              width="12"
              viewBox="0 0 12 12"
              style={{ transform: 'none', transition: 'transform 0.2s ease' }}
            >
              <path
                d="M2 4l4 4 4-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          minHeight: 0,
          padding: '12px',
          overflowY: 'auto',
          backgroundColor: '#2a2a2a',
          border: '1px solid #555',
          borderBottomLeftRadius: '4px',
          borderBottomRightRadius: '4px'
        }}>
          {/* Egg Template */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>
                {eggTemplate.name}
              </span>
            </div>
            
            {/* Template Preview */}
            <div style={{
              width: '100%',
              height: '80px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #555',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '8px'
            }}>
              <img
                src={currentSize.previewPath}
                alt={`${eggTemplate.name} ${currentSize.width}x${currentSize.height}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>

            {/* Size Selection */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              marginBottom: '8px'
            }}>
              {eggTemplate.sizes.map((size) => (
                <button
                  key={`${size.width}x${size.height}`}
                  onClick={() => handleTemplateSelect(eggTemplate, size)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: size.width === currentCanvasSize ? '#4a7cff' : '#4a4a4a',
                    border: '1px solid #555',
                    borderRadius: '3px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: '500',
                    minWidth: '40px'
                  }}
                  title={`${size.width}x${size.height}`}
                >
                  {size.width}x{size.height}
                </button>
              ))}
            </div>

            {/* Apply Button */}
            <button
              onClick={() => handleTemplateSelect(eggTemplate, currentSize)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '6px 12px',
                backgroundColor: isLoading ? '#666' : '#4a7cff',
                border: '1px solid #555',
                borderRadius: '3px',
                color: '#fff',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              {isLoading ? 'Loading...' : 'Apply Template'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="Apply Template"
        message={`Are you sure you want to apply the "${selectedTemplate?.template.name}" template? This will replace all current pixels on the canvas.`}
        onConfirm={handleConfirmTemplate}
        onCancel={handleCancelTemplate}
        confirmText="Yes, Apply"
        cancelText="Cancel"
      />
    </>
  )
}

export default TemplatePanel
