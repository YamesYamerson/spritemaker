import React, { useState, useEffect } from 'react'
import { SavedTemplate } from '../types'
import ConfirmModal from './ConfirmModal'
import SaveTemplateModal from './SaveTemplateModal'
import { TemplateManager } from '../utils/templateManager'

interface TemplatePanelProps {
  currentCanvasSize?: number
  canvasRef?: React.RefObject<HTMLCanvasElement>
}

const TemplatePanel: React.FC<TemplatePanelProps> = ({ 
  currentCanvasSize = 32,
  canvasRef
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<SavedTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [templates, setTemplates] = useState<SavedTemplate[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null)

  const templateManager = TemplateManager.getInstance()

  // Load templates on mount
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = () => {
    const allTemplates = templateManager.getAllTemplates()
    setTemplates(allTemplates)
  }

  const handleTemplateSelect = (template: SavedTemplate) => {
    setSelectedTemplate(template)
    setShowConfirmModal(true)
  }

  const handleConfirmTemplate = async () => {
    if (!selectedTemplate || !canvasRef?.current) {
      setShowConfirmModal(false)
      return
    }

    // Validate template size matches current canvas
    if (selectedTemplate.width !== currentCanvasSize || selectedTemplate.height !== currentCanvasSize) {
      alert(`Template size (${selectedTemplate.width}x${selectedTemplate.height}) does not match current canvas size (${currentCanvasSize}x${currentCanvasSize}). Templates can only be applied to canvases of the same size.`)
      setShowConfirmModal(false)
      setSelectedTemplate(null)
      return
    }

    try {
      setIsLoading(true)
      
      // Convert template pixels to Map format
      const templatePixels = new Map<string, any>()
      selectedTemplate.pixels.forEach(pixel => {
        const key = `${pixel.x},${pixel.y}`
        templatePixels.set(key, pixel)
      })
      
      // Check if applyTemplate method exists
      if (typeof (canvasRef.current as any).applyTemplate === 'function') {
        ;(canvasRef.current as any).applyTemplate(templatePixels)
      } else {
        console.error('applyTemplate method not found on canvas')
        alert('Template application method not available')
      }
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

  const handleSaveTemplate = async (name: string, description: string, tags: string[]) => {
    if (!canvasRef?.current) {
      alert('Canvas reference not available')
      return
    }

    try {
      setIsSaving(true)
      
      // Get current canvas pixels and size
      const currentPixels = (canvasRef.current as any).getCurrentPixels?.()
      const canvasSize = (canvasRef.current as any).getCanvasSize?.()
      
      if (!currentPixels || !canvasSize) {
        alert('Unable to get canvas data')
        return
      }

      // Add canvas size to tags for better organization
      const sizeTag = `${canvasSize}x${canvasSize}`
      const updatedTags = tags.includes(sizeTag) ? tags : [...tags, sizeTag]

      await templateManager.saveTemplate(
        name,
        description,
        canvasSize,
        canvasSize,
        currentPixels,
        updatedTags
      )
      
      loadTemplates() // Refresh the list
      alert(`Template "${name}" saved successfully for ${canvasSize}x${canvasSize} canvas!`)
    } catch (error) {
      console.error('Failed to save template:', error)
      alert('Failed to save template. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      templateManager.deleteTemplate(templateId)
      loadTemplates()
    }
  }

  const filteredTemplates = templates.filter(template => {
    // First filter by canvas size - templates must match current canvas size
    if (template.width !== currentCanvasSize || template.height !== currentCanvasSize) {
      return false
    }
    
    // Then filter by search query
    return template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
           template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  })

  if (isCollapsed) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#2a2a2a',
        border: '1px solid #555',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <div style={{
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
            Templates ({templates.length})
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
      </div>
    )
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Template Panel Card */}
      <div style={{
        backgroundColor: '#2a2a2a',
        border: '1px solid #555',
        borderRadius: '4px',
        flex: 1,
        minHeight: 0,
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
          flexShrink: 0
        }}>
          <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
            Templates ({templates.length})
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => !isSaving && setShowSaveModal(true)}
              disabled={isSaving}
              style={{
                padding: '4px 8px',
                backgroundColor: isSaving ? '#666' : '#007acc',
                border: `1px solid ${isSaving ? '#666' : '#007acc'}`,
                borderRadius: '3px',
                color: '#fff',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                opacity: isSaving ? 0.6 : 1
              }}
              title="Save Current Canvas as Template"
            >
              {isSaving ? 'Saving...' : 'Save'}
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
                fill="currentColor"
                height="12"
                width="12"
                viewBox="0 0 12 12"
                style={{
                  transform: isCollapsed ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease'
                }}
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
        </div>

        {/* Template Content - Only show when not collapsed */}
        {!isCollapsed && (
          <>
            {/* Search */}
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#2a2a2a',
              borderBottom: '1px solid #555',
              flexShrink: 0
            }}>
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  backgroundColor: '#3a3a3a',
                  border: '1px solid #555',
                  borderRadius: '3px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
            </div>

            {/* Template List - Scrollable content area */}
            <div style={{
              flex: '1 1 auto',
              minHeight: 0,
              padding: '12px',
              overflowY: 'auto'
            }}>
              {filteredTemplates.length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#666',
                  fontSize: '12px'
                }}>
                  No templates found for {currentCanvasSize}x{currentCanvasSize} canvas
                </div>
              ) : (
                filteredTemplates.map(template => (
                  <div
                    key={template.id}
                    style={{
                      backgroundColor: '#3a3a3a',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      padding: '8px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => handleTemplateSelect(template)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#4a4a4a'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#3a3a3a'
                    }}
                    title={`${template.name}${template.description ? ` - ${template.description}` : ''}${template.tags && template.tags.length > 0 ? `\nTags: ${template.tags.join(', ')}` : ''}\nSize: ${template.width}x${template.height} • ${template.pixels.length} pixels`}
                  >
                    {/* Template Thumbnail - Now using actual template preview */}
                    <div style={{
                      width: '32px',
                      height: '32px',
                      border: '1px solid #555',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      backgroundColor: '#f0f0f0' // Light background for better visibility
                    }}>
                      {template.pixels.length > 0 ? (
                        <img
                          src={TemplateManager.generatePreview(template.pixels, template.width, template.height)}
                          alt={`${template.name} preview`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#888',
                          fontSize: '10px',
                          textAlign: 'center'
                        }}>
                          ○
                        </div>
                      )}
                    </div>
                    
                    {/* Template Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {template.name}
                        <button
                          style={{
                            padding: '0',
                            backgroundColor: '#4a4a4a',
                            border: '2px solid #555',
                            borderRadius: '50%',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '16px',
                            height: '16px',
                            transition: 'all 0.2s',
                            flexShrink: 0,
                            lineHeight: '1',
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#3a3a3a'
                            e.currentTarget.style.borderColor = '#666'
                            e.currentTarget.style.color = '#fff'
                            setHoveredTemplate(template.name)
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#4a4a4a'
                            e.currentTarget.style.borderColor = '#555'
                            e.currentTarget.style.color = '#fff'
                            setHoveredTemplate(null)
                          }}
                        >
                          <span style={{ marginTop: '-1px' }}>ℹ</span>
                          {/* Custom Tooltip */}
                          <div style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginBottom: '8px',
                            backgroundColor: '#2a2a2a',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            padding: '8px 12px',
                            color: '#fff',
                            fontSize: '11px',
                            whiteSpace: 'pre-line',
                            minWidth: '200px',
                            textAlign: 'center',
                            zIndex: 1000,
                            opacity: hoveredTemplate === template.name ? 1 : 0,
                            visibility: hoveredTemplate === template.name ? 'visible' : 'hidden',
                            transition: 'opacity 0.2s, visibility 0.2s',
                            pointerEvents: 'none'
                          }}>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                              {template.name}
                            </div>
                            {template.description && (
                              <div style={{ color: '#ccc', marginBottom: '4px' }}>
                                {template.description}
                              </div>
                            )}
                            {template.tags && template.tags.length > 0 && (
                              <div style={{ color: '#888', marginBottom: '4px' }}>
                                Tags: {template.tags.join(', ')}
                              </div>
                            )}
                            <div style={{ color: '#888' }}>
                              Size: {template.width}x{template.height}
                            </div>
                            {/* Tooltip Arrow */}
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: '0',
                              height: '0',
                              borderLeft: '6px solid transparent',
                              borderRight: '6px solid transparent',
                              borderTop: '6px solid #2a2a2a'
                            }} />
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTemplate(template.id)
                      }}
                      style={{
                        padding: '2px 6px',
                        backgroundColor: '#d32f2f',
                        border: '1px solid #d32f2f',
                        borderRadius: '3px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '10px',
                        flexShrink: 0
                      }}
                      title="Delete Template"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={showSaveModal}
        onClose={() => !isSaving && setShowSaveModal(false)}
        onSave={handleSaveTemplate}
        canvasSize={currentCanvasSize}
        isLoading={isSaving}
      />

      {/* Confirm Template Application Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onCancel={handleCancelTemplate}
        onConfirm={handleConfirmTemplate}
        title="Apply Template"
        message={`Are you sure you want to apply the template "${selectedTemplate?.name}"? This will replace your current canvas content.`}
        confirmText={isLoading ? "Applying..." : "Apply Template"}
        cancelText="Cancel"
        disabled={isLoading}
      />
    </div>
  )
}

export default TemplatePanel
