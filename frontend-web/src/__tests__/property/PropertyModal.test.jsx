import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PropertyModal from '../../components/property/PropertyModal';

function renderModal(overrides = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
    isSaving: false,
    ...overrides,
  };
  render(<PropertyModal {...props} />);
  return props;
}

async function fillValidProperty(user) {
  await user.type(screen.getByPlaceholderText('e.g. Lakeview Residences'), 'Lakeview Residences');
  await user.type(screen.getByPlaceholderText('24 Lake Road'), '24 Lake Road');
  await user.type(screen.getByPlaceholderText('Colombo'), 'Colombo');
  await user.type(screen.getByPlaceholderText('e.g. A-101'), 'A-101');
  fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '1' } });
}

describe('Property creation form', () => {
  it('normalizes valid property and initial-unit values before submission', async () => {
    const user = userEvent.setup();
    const props = renderModal();
    await fillValidProperty(user);

    await user.click(screen.getByRole('button', { name: 'Create Property' }));

    await waitFor(() => expect(props.onSubmit).toHaveBeenCalledWith({
      name: 'Lakeview Residences',
      address: '24 Lake Road',
      city: 'Colombo',
      image: null,
      initialUnits: [{ unitNumber: 'A-101', floor: 1 }],
    }));
    expect(props.onClose).toHaveBeenCalledOnce();
  });

});
