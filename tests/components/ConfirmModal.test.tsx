import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ConfirmModal from '../../src/components/ConfirmModal'

describe('ConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Test Modal',
    message: 'Are you sure you want to proceed?',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    confirmText: 'Yes',
    cancelText: 'No'
  }

  it('should render when open', () => {
    render(<ConfirmModal {...defaultProps} />)
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
  })

  it('should call onConfirm when confirm button is clicked', () => {
    render(<ConfirmModal {...defaultProps} />)
    const confirmButton = screen.getByText('Yes')
    fireEvent.click(confirmButton)
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should call onCancel when cancel button is clicked', () => {
    render(<ConfirmModal {...defaultProps} />)
    const cancelButton = screen.getByText('No')
    fireEvent.click(cancelButton)
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('should use default button text when not provided', () => {
    render(<ConfirmModal {...defaultProps} confirmText={undefined} cancelText={undefined} />)
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })
})
