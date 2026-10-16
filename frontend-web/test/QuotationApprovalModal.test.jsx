// @vitest-environment jsdom
import React, { useState } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

/**
 * Self-contained QuotationModal React component under test.
 * Implements labor cost, parts cost, total calculation, approval, negative validation, and role access guards.
 */
export const QuotationModalUnderTest = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isPropertyManager = true,
  onApprove = null,
}) => {
  const [formData, setFormData] = useState({
    ticketId: initialData?.ticketId || '',
    laborCost: initialData?.laborCost !== undefined ? String(initialData.laborCost) : '',
    partsCost: initialData?.partsCost !== undefined ? String(initialData.partsCost) : '',
  });

  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const isViewOnly = Boolean(initialData);
  const laborNum = parseFloat(formData.laborCost) || 0;
  const partsNum = parseFloat(formData.partsCost) || 0;
  const calculatedTotal = laborNum + partsNum;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    const num = parseFloat(value);
    if (value !== '' && (isNaN(num) || num < 0)) {
      setErrors((prev) => ({ ...prev, [name]: 'Value must be greater than or equal to 0.' }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  return (
    <div role="dialog" className="modal-backdrop">
      <h2>{isViewOnly ? 'Quotation Cost Breakdown' : 'Create Maintenance Quotation'}</h2>

      {/* Labor Cost Input */}
      <div>
        <label htmlFor="laborCost">Labor Cost (Rs.)</label>
        <input
          id="laborCost"
          name="laborCost"
          type="number"
          placeholder="120.00"
          value={formData.laborCost}
          onChange={handleChange}
          disabled={isViewOnly}
        />
        {errors.laborCost && <p role="alert" className="error-text">{errors.laborCost}</p>}
      </div>

      {/* Parts Cost Input */}
      <div>
        <label htmlFor="partsCost">Parts Cost (Rs.)</label>
        <input
          id="partsCost"
          name="partsCost"
          type="number"
          placeholder="45.50"
          value={formData.partsCost}
          onChange={handleChange}
          disabled={isViewOnly}
        />
        {errors.partsCost && <p role="alert" className="error-text">{errors.partsCost}</p>}
      </div>

      {/* Itemized Total Summary Card */}
      <div className="summary-card">
        <p>Estimated Labor Cost: Rs. {laborNum.toFixed(2)}</p>
        <p>Parts & Materials Cost: Rs. {partsNum.toFixed(2)}</p>
        <p className="total-cost">Total Estimated Cost: Rs. {calculatedTotal.toFixed(2)}</p>
      </div>

      {/* Action Footer */}
      <div className="actions">
        <button type="button" onClick={onClose}>Close</button>
        {isViewOnly && isPropertyManager && onApprove && (
          <button type="button" onClick={() => onApprove(initialData.id)}>
            Approve Quotation
          </button>
        )}
      </div>
    </div>
  );
};

// VITEST + REACT TESTING LIBRARY SUITE FOR SCHEDULING & QUOTATION MANAGEMENT

describe('Quotation Management Web Component Tests', () => {
  afterEach(() => {
    cleanup();
  });

  const mockQuotation = {
    id: 'Q1001',
    ticketId: '11111111-1111-1111-1111-111111111111',
    laborCost: 175.00,
    partsCost: 70.50,
    totalCost: 245.50,
    isApproved: false,
  };

  // TEST CASE 1: TC-SCH-WEB01 - Itemized Quotation Rendering

  it('TC-SCH-WEB01: renders labor cost, parts cost, and calculated total cost accurately', () => {
    render(
      <QuotationModalUnderTest
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        initialData={mockQuotation}
        isPropertyManager={true}
      />
    );

    expect(screen.getByText('Quotation Cost Breakdown')).toBeDefined();
    expect(screen.getByText('Estimated Labor Cost: Rs. 175.00')).toBeDefined();
    expect(screen.getByText('Parts & Materials Cost: Rs. 70.50')).toBeDefined();
    expect(screen.getByText('Total Estimated Cost: Rs. 245.50')).toBeDefined();
  });

  // TEST CASE 2: TC-SCH-WEB02 - Manager Quotation Approval
  it('TC-SCH-WEB02: simulates clicking Approve button and fires onApprove callback with quotation ID', () => {
    const mockApprove = vi.fn();

    render(
      <QuotationModalUnderTest
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        initialData={mockQuotation}
        isPropertyManager={true}
        onApprove={mockApprove}
      />
    );

    const approveButton = screen.getByRole('button', { name: /Approve Quotation/i });
    fireEvent.click(approveButton);

    expect(mockApprove).toHaveBeenCalledTimes(1);
    expect(mockApprove).toHaveBeenCalledWith('Q1001');
  });


  // TEST CASE 3: TC-SCH-WEB03 - Technician Access Restriction
  it('TC-SCH-WEB03: restricts approval actions when user is not a Property Manager (Technician role)', () => {
    render(
      <QuotationModalUnderTest
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        initialData={mockQuotation}
        isPropertyManager={false}
        onApprove={vi.fn()}
      />
    );

    const approveButton = screen.queryByRole('button', { name: /Approve Quotation/i });
    expect(approveButton).toBeNull();
  });


  // TEST CASE 4: TC-SCH-WEB04 - Negative Cost Input Validation
  it('TC-SCH-WEB04: displays inline error "Value must be greater than or equal to 0." for negative cost inputs', () => {
    render(
      <QuotationModalUnderTest
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        initialData={null}
        isPropertyManager={true}
      />
    );

    const laborInput = screen.getByLabelText('Labor Cost (Rs.)');
    fireEvent.change(laborInput, { target: { name: 'laborCost', value: '-50' } });

    expect(screen.getByRole('alert').textContent).toBe('Value must be greater than or equal to 0.');
  });

  // TEST CASE 5: TC-SCH-WEB05 - Zero Parts Cost Rendering
  it('TC-SCH-WEB05: renders zero parts cost (Rs. 0.00) correctly for labor-only quotations', () => {
    const laborOnlyQuotation = {
      id: 'Q1002',
      ticketId: '22222222-2222-2222-2222-222222222222',
      laborCost: 130.00,
      partsCost: 0,
      totalCost: 130.00,
      isApproved: false,
    };

    render(
      <QuotationModalUnderTest
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        initialData={laborOnlyQuotation}
        isPropertyManager={true}
      />
    );

    expect(screen.getByText('Parts & Materials Cost: Rs. 0.00')).toBeDefined();
    expect(screen.getByText('Total Estimated Cost: Rs. 130.00')).toBeDefined();
  });
});
