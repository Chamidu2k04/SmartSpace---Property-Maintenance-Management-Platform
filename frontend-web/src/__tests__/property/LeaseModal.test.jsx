import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import LeaseModal from '../../components/property/LeaseModal';

const units = [{ id: 'unit-1', propertyName: 'Lakeview Residences', unitNumber: 'A-101', floor: 1 }];
const tenants = [{ id: 'tenant-1', fullName: 'Nimal Perera', email: 'nimal@example.com' }];

function renderModal(overrides = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
    units,
    tenants,
    isSaving: false,
    ...overrides,
  };
  render(<LeaseModal {...props} />);
  return props;
}

function setLeaseValues({ startDate = '2026-10-01', endDate = '2027-09-30', rent = '85000' } = {}) {
  const selects = screen.getAllByRole('combobox');
  fireEvent.change(selects[0], { target: { value: 'unit-1' } });
  fireEvent.change(selects[1], { target: { value: 'tenant-1' } });
  fireEvent.change(document.querySelector('input[name="startDate"]'), { target: { value: startDate } });
  fireEvent.change(document.querySelector('input[name="endDate"]'), { target: { value: endDate } });
  fireEvent.change(screen.getByPlaceholderText('e.g. 75000.00'), { target: { value: rent } });
}

describe('Lease creation form', () => {
  it('rejects the boundary where the lease ends on its start date', async () => {
    const user = userEvent.setup();
    const props = renderModal();
    setLeaseValues({ startDate: '2026-10-01', endDate: '2026-10-01' });

    await user.click(screen.getByRole('button', { name: 'Create Lease' }));

    expect(screen.getByText('End date must be after the start date.')).toBeInTheDocument();
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it('submits a valid lease with numeric monthly rent', async () => {
    const user = userEvent.setup();
    const props = renderModal();
    setLeaseValues();

    await user.click(screen.getByRole('button', { name: 'Create Lease' }));

    await waitFor(() => expect(props.onSubmit).toHaveBeenCalledWith({
      unitId: 'unit-1',
      tenantId: 'tenant-1',
      startDate: '2026-10-01',
      endDate: '2027-09-30',
      monthlyRent: 85000,
    }));
    expect(props.onClose).toHaveBeenCalledOnce();
  });

});
