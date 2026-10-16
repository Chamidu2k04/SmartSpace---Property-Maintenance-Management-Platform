import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Properties from '../../pages/Properties';

const testState = vi.hoisted(() => ({
  user: { role: 'PropertyManager' },
  store: null,
}));

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: () => ({ user: testState.user }),
}));

vi.mock('../../store/usePropertyStore', () => ({
  usePropertyStore: () => testState.store,
}));

vi.mock('../../services/propertyService', () => ({
  propertyService: {
    getProperty: vi.fn(),
    deleteProperty: vi.fn(),
    addUnit: vi.fn(),
    updateUnit: vi.fn(),
    deleteUnit: vi.fn(),
    updateProperty: vi.fn(),
    updateLease: vi.fn(),
    terminateLease: vi.fn(),
    deleteLease: vi.fn(),
  },
}));

function makeStore(overrides = {}) {
  return {
    properties: [
      {
        id: 'property-1',
        name: 'Lakeview Residences',
        address: '24 Lake Road',
        city: 'Colombo',
        units: [
          { id: 'unit-1', unitNumber: 'A-101', floor: 1, status: 'Vacant' },
          { id: 'unit-2', unitNumber: 'B-202', floor: 2, status: 'Occupied' },
        ],
      },
    ],
    leases: [{ id: 'lease-1', isActive: true }],
    tenants: [],
    isLoading: false,
    isSaving: false,
    error: null,
    loadData: vi.fn(),
    runMutation: vi.fn(),
    createProperty: vi.fn(),
    createLease: vi.fn(),
    ...overrides,
  };
}

describe('Property and lease management dashboard', () => {
  beforeEach(() => {
    testState.user = { role: 'PropertyManager' };
    testState.store = makeStore();
  });

  it('loads property data and renders the management summary', async () => {
    render(<Properties />);

    await waitFor(() => expect(testState.store.loadData).toHaveBeenCalledOnce());
    expect(screen.getByRole('heading', { name: 'Property & Lease Management' })).toBeInTheDocument();
    expect(screen.getByText('Total Units').nextElementSibling).toHaveTextContent('2');
    expect(screen.getByText('Vacant Units').nextElementSibling).toHaveTextContent('1');
    expect(screen.getByText('Active Leases').nextElementSibling).toHaveTextContent('1');
  });

  it('blocks users who are not property managers', () => {
    testState.user = { role: 'Tenant' };

    render(<Properties />);

    expect(screen.getByRole('heading', { name: 'Access Restricted' })).toBeInTheDocument();
    expect(screen.getByText('Current role: Tenant')).toBeInTheDocument();
    expect(testState.store.loadData).not.toHaveBeenCalled();
  });

});
