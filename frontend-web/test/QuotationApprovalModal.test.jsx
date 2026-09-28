// @vitest-environment jsdom
import React, { useState } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

/**
 * Self-contained QuotationApprovalModal React component under test.
 * Renders labor hours, labor cost, parts list breakdown, total amount, and handles approval/rejection.
 */
export const QuotationApprovalModal = ({ quotation, onApprove, onReject, onClose }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!quotation) return null;

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setErrorMessage('Rejection reason is required before submission.');
      return;
    }
    setErrorMessage('');
    onReject({ id: quotation.id, status: 'Rejected', reason: rejectionReason });
  };

  const handleApproveClick = () => {
    onApprove({ id: quotation.id, status: 'Approved' });
  };

  return (
    <div role="dialog" aria-modal="true" className="modal-backdrop">
      <div className="modal-content">
        <h2>Quotation Approval</h2>

        {/* Quotation Details */}
        <div className="quotation-details">
          <p><strong>Labor Hours:</strong> <span data-testid="labor-hours">{quotation.laborHours} hrs</span></p>
          <p><strong>Labor Cost:</strong> <span data-testid="labor-cost">${quotation.laborCost.toFixed(2)}</span></p>

          <div data-testid="parts-list">
            <h3>Parts Required:</h3>
            <ul>
              {quotation.parts && quotation.parts.length > 0 ? (
                quotation.parts.map((part, index) => (
                  <li key={index} data-testid="part-item">
                    {part.name}: ${part.cost.toFixed(2)}
                  </li>
                ))
              ) : (
                <li>No parts required</li>
              )}
            </ul>
          </div>

          <p className="total-amount">
            <strong>Total Amount:</strong> <span data-testid="total-amount">${quotation.totalAmount.toFixed(2)}</span>
          </p>
        </div>

        {/* Error Feedback */}
        {errorMessage && <div role="alert" className="error-message">{errorMessage}</div>}

        {/* Action Form / Buttons */}
        <form onSubmit={handleRejectSubmit}>
          <label htmlFor="rejection-reason">Rejection Reason:</label>
          <textarea
            id="rejection-reason"
            data-testid="rejection-reason-input"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter reason if rejecting..."
          />

          <div className="modal-actions">
            <button
              type="button"
              data-testid="approve-btn"
              onClick={handleApproveClick}
            >
              Approve
            </button>
            <button
              type="submit"
              data-testid="reject-btn"
            >
              Reject
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// VITEST + REACT TESTING LIBRARY SUITE FOR QUOTATION APPROVAL MODAL
// =========================================================================

describe('QuotationApprovalModal Component Tests', () => {
  afterEach(() => {
    cleanup();
  });

  const mockQuotation = {
    id: 'Q1001',
    laborHours: 3.5,
    laborCost: 175.00,
    parts: [
      { name: 'HVAC Filter', cost: 25.50 },
      { name: 'Capacitor 45uF', cost: 45.00 }
    ],
    totalAmount: 245.50
  };

  // =========================================================================
  // TEST CASE 1: Accurate Details Rendering
  // =========================================================================
  /**
   * WHAT: Verifies that the modal correctly renders labor hours, labor cost, parts list breakdown, and total cost.
   * WHY: User interface verification - property managers must see a complete, transparent itemized quote before decision-making.
   * VIVA TIP: Explain that screen queries (getByTestId/getByText) validate that accurate formatted currency values and DOM elements match the injected props.
   */
  it('renders quotation details accurately (Labor hours, Labor cost, Parts list, Total amount)', () => {
    // ARRANGE
    const mockApprove = vi.fn();
    const mockReject = vi.fn();
    const mockClose = vi.fn();

    // ACT
    render(
      <QuotationApprovalModal
        quotation={mockQuotation}
        onApprove={mockApprove}
        onReject={mockReject}
        onClose={mockClose}
      />
    );

    // ASSERT
    expect(screen.getByTestId('labor-hours').textContent).toBe('3.5 hrs');
    expect(screen.getByTestId('labor-cost').textContent).toBe('$175.00');
    expect(screen.getAllByTestId('part-item')).toHaveLength(2);
    expect(screen.getByText('HVAC Filter: $25.50')).toBeDefined();
    expect(screen.getByText('Capacitor 45uF: $45.00')).toBeDefined();
    expect(screen.getByTestId('total-amount').textContent).toBe('$245.50');
  });

  // =========================================================================
  // TEST CASE 2: Approve Callback Invocation
  // =========================================================================
  /**
   * WHAT: Simulates clicking the "Approve" button and asserts the onApprove callback is fired with the quotation ID and status.
   * WHY: User interaction test - approving a quotation must dispatch the correct approval payload to trigger backend status updates.
   * VIVA TIP: Demonstrate that fireEvent.click triggers component handler, verifying vi.fn() mock mock calls with expected payload { id: 'Q1001', status: 'Approved' }.
   */
  it('simulates clicking the Approve button and verifies the callback mock is invoked with proper status', () => {
    // ARRANGE
    const mockApprove = vi.fn();
    const mockReject = vi.fn();
    const mockClose = vi.fn();

    render(
      <QuotationApprovalModal
        quotation={mockQuotation}
        onApprove={mockApprove}
        onReject={mockReject}
        onClose={mockClose}
      />
    );

    // ACT
    const approveButton = screen.getByTestId('approve-btn');
    fireEvent.click(approveButton);

    // ASSERT
    expect(mockApprove).toHaveBeenCalledTimes(1);
    expect(mockApprove).toHaveBeenCalledWith({
      id: 'Q1001',
      status: 'Approved'
    });
    expect(mockReject).not.toHaveBeenCalled();
  });

  // =========================================================================
  // TEST CASE 3: Rejection Reason Validation
  // =========================================================================
  /**
   * WHAT: Simulates clicking "Reject" without a reason to assert validation failure, then inputs a reason and submits successfully.
   * WHY: Business validation - managers must not reject quotations without recording an explicit audit reason for technicians.
   * VIVA TIP: Defend that state guards validate empty inputs, showing an alert error when empty and invoking onReject only after text input is provided.
   */
  it('simulates clicking Reject and asserts that a rejection reason must be provided before submission', () => {
    // ARRANGE
    const mockApprove = vi.fn();
    const mockReject = vi.fn();
    const mockClose = vi.fn();

    render(
      <QuotationApprovalModal
        quotation={mockQuotation}
        onApprove={mockApprove}
        onReject={mockReject}
        onClose={mockClose}
      />
    );

    const rejectButton = screen.getByTestId('reject-btn');

    // ACT 1: Click Reject without filling rejection reason
    fireEvent.click(rejectButton);

    // ASSERT 1: Rejection callback should NOT be called and error message must display
    expect(mockReject).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('Rejection reason is required before submission.');

    // ACT 2: Enter rejection reason and resubmit
    const reasonInput = screen.getByTestId('rejection-reason-input');
    fireEvent.change(reasonInput, { target: { value: 'Labor cost is higher than estimate budget.' } });
    fireEvent.click(rejectButton);

    // ASSERT 2: Rejection callback should now be called with reason
    expect(mockReject).toHaveBeenCalledTimes(1);
    expect(mockReject).toHaveBeenCalledWith({
      id: 'Q1001',
      status: 'Rejected',
      reason: 'Labor cost is higher than estimate budget.'
    });
  });
});
