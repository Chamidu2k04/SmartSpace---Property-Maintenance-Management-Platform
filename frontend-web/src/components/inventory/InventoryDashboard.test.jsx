import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InventoryDashboard from './InventoryDashboard';
import { inventoryService } from '../../services/inventoryService';

/**
 * React Component Unit & Integration Tests: Inventory Dashboard & Low-Stock Alerts
 * Designed for SE3090 Assignment 2 & Quality Management Viva requirements.
 * Tests component rendering, low-stock threshold triggers (< 5 units), stat calculations, and filtering.
 */

// Mock the inventoryService API layer to isolate component UI behavior
vi.mock('../../services/inventoryService', () => ({
  inventoryService: {
    getItems: vi.fn(),
    getSuppliers: vi.fn(),
    deleteItem: vi.fn(),
  },
}));

// Mock child modals that involve browser camera/QR scanner or complex forms
vi.mock('./ItemModal', () => ({
  default: () => <div data-testid="item-modal">Item Modal</div>,
}));
vi.mock('./QrCodeModal', () => ({
  default: () => <div data-testid="qr-code-modal">QR Code Modal</div>,
}));
vi.mock('./QrScannerModal', () => ({
  default: () => <div data-testid="qr-scanner-modal">QR Scanner Modal</div>,
}));

describe('InventoryDashboard - UI & Low-Stock Alert Suite', () => {
  const mockSuppliers = [
    { id: 'supp-1', name: 'Apex Hardware Supplies', contactEmail: 'sales@apex.lk' },
    { id: 'supp-2', name: 'Lanka Electric PLC', contactEmail: 'info@lankaelectric.lk' },
  ];

  const mockInventoryItems = [
    {
      id: 'item-uuid-1',
      supplierId: 'supp-1',
      supplierName: 'Apex Hardware Supplies',
      itemName: 'PVC Pipe 1-inch (3m)',
      category: 0, // Plumbing
      stockQuantity: 18, // Normal stock (>= 5)
      unitCost: 450.0,
    },
    {
      id: 'item-uuid-2',
      supplierId: 'supp-2',
      supplierName: 'Lanka Electric PLC',
      itemName: 'Circuit Breaker 16A',
      category: 1, // Electrical
      stockQuantity: 3, // LOW STOCK (< 5) -> Must trigger alert badge and stat count
      unitCost: 1200.0,
    },
    {
      id: 'item-uuid-3',
      supplierId: 'supp-1',
      supplierName: 'Apex Hardware Supplies',
      itemName: 'Ball Valve 0.75-inch',
      category: 0, // Plumbing
      stockQuantity: 1, // CRITICAL LOW STOCK (< 5)
      unitCost: 850.0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    inventoryService.getItems.mockResolvedValue(mockInventoryItems);
    inventoryService.getSuppliers.mockResolvedValue(mockSuppliers);
  });

  /**
   * VIVA PREP:
   * What it does: Verifies initial loading state before API promises resolve.
   * Why written: Ensures positive user experience and visual feedback during asynchronous network calls.
   */
  it('displays loading state indicator while catalog data is being fetched', () => {
    // Keep promise pending
    inventoryService.getItems.mockImplementation(() => new Promise(() => {}));

    render(<InventoryDashboard />);
    expect(screen.getByText(/Loading catalog items.../i)).toBeInTheDocument();
  });

  /**
   * VIVA PREP:
   * What it does: Verifies the dashboard renders the main catalog table with all items and supplier names.
   * Why written: Confirms standard happy-path display of the Spare Parts catalog upon successful data loading.
   */
  it('renders the Spare Parts Catalog header, overview statistics, and items table', async () => {
    render(<InventoryDashboard />);

    // Wait for data load
    await waitFor(() => {
      expect(screen.getByText('Spare Parts Catalog')).toBeInTheDocument();
    });

    // Check item names are rendered
    expect(screen.getByText('PVC Pipe 1-inch (3m)')).toBeInTheDocument();
    expect(screen.getByText('Circuit Breaker 16A')).toBeInTheDocument();
    expect(screen.getByText('Ball Valve 0.75-inch')).toBeInTheDocument();

    // Check total parts stat card
    expect(screen.getByText('Total Parts')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // 3 total items
  });

  /**
   * VIVA PREP:
   * What it does: Verifies that the Low Stock Alert counter and badges render accurately when stockQuantity < 5.
   * Why written: Core requirement for inventory risk management; proves the system highlights replenishment needs.
   * Boundary Check: Item 1 has 18 (normal), Item 2 has 3 (< 5, alert), Item 3 has 1 (< 5, alert) => Low Stock = 2 items.
   */
  it('calculates and highlights low-stock alerts correctly for items with stock < 5', async () => {
    render(<InventoryDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Spare Parts Catalog')).toBeInTheDocument();
    });

    // Overview stat card for low stock: 2 items breached threshold (< 5)
    expect(screen.getByText('2 items')).toBeInTheDocument();

    // Warning icons rendered for low-stock items (title="Low stock threshold breached (<5)")
    const lowStockAlertIcons = screen.getAllByTitle('Low stock threshold breached (<5)');
    expect(lowStockAlertIcons).toHaveLength(2);

    // Verify stock unit badges
    expect(screen.getByText('18 units')).toBeInTheDocument();
    expect(screen.getByText('3 units')).toBeInTheDocument();
    expect(screen.getByText('1 units')).toBeInTheDocument();
  });

  /**
   * VIVA PREP:
   * What it does: Verifies that clicking the "Low Stock (< 5)" filter toggles the view to only show shortage items.
   * Why written: Tests interactive UI filtering and ensures Inventory Officers can isolate items needing reorder.
   */
  it('filters the catalog table to display only low-stock parts when the low stock button is clicked', async () => {
    render(<InventoryDashboard />);

    await waitFor(() => {
      expect(screen.getByText('PVC Pipe 1-inch (3m)')).toBeInTheDocument();
    });

    // Click "Low Stock (< 5)" filter button
    const lowStockFilterBtn = screen.getByRole('button', { name: /Low Stock \(< 5\)/i });
    fireEvent.click(lowStockFilterBtn);

    // Normal stock item (18 units) should now be filtered out
    expect(screen.queryByText('PVC Pipe 1-inch (3m)')).not.toBeInTheDocument();

    // Low stock items should still be visible
    expect(screen.getByText('Circuit Breaker 16A')).toBeInTheDocument();
    expect(screen.getByText('Ball Valve 0.75-inch')).toBeInTheDocument();
  });

  /**
   * VIVA PREP:
   * What it does: Tests search filtering by part name.
   * Why written: Validates client-side query handling and verifies search narrows down the table results.
   */
  it('filters catalog items in real-time as search query is typed', async () => {
    render(<InventoryDashboard />);

    await waitFor(() => {
      expect(screen.getByText('PVC Pipe 1-inch (3m)')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search part name, supplier, or ID.../i);
    fireEvent.change(searchInput, { target: { value: 'Circuit' } });

    // Only matching item should be displayed
    expect(screen.getByText('Circuit Breaker 16A')).toBeInTheDocument();
    expect(screen.queryByText('PVC Pipe 1-inch (3m)')).not.toBeInTheDocument();
    expect(screen.queryByText('Ball Valve 0.75-inch')).not.toBeInTheDocument();
  });

  /**
   * VIVA PREP:
   * What it does: Tests empty state display when no inventory items match the applied filters.
   * Why written: Proves graceful UI degradation and helpful guidance when data sets are empty.
   */
  it('displays empty state message when search query yields no matching parts', async () => {
    render(<InventoryDashboard />);

    await waitFor(() => {
      expect(screen.getByText('PVC Pipe 1-inch (3m)')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search part name, supplier, or ID.../i);
    fireEvent.change(searchInput, { target: { value: 'NonExistentPartXYZ' } });

    expect(screen.getByText('No spare parts found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters or add a new part.')).toBeInTheDocument();
  });
});
