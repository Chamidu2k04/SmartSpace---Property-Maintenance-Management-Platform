import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import TicketsTable from '../../components/TicketsTable';
import * as ticketService from '../../services/ticketService';

// Mock the ticket service to avoid actual API calls during testing
vi.mock('../../services/ticketService', () => ({
  updateTicketStatus: vi.fn(),
  deleteTicket: vi.fn()
}));

const mockTickets = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    unitNumber: '101',
    tenantName: 'John Doe',
    description: 'Leaky faucet in the kitchen',
    urgencyLevel: 'Low',
    status: 'Submitted',
    createdAt: '2023-10-01T10:00:00Z',
    thumbnailUrl: null
  },
  {
    id: '987fcdeb-51a2-43d7-9012-345678901234',
    unitNumber: '205',
    tenantName: 'Jane Smith',
    description: 'Heater not working',
    urgencyLevel: 'High',
    status: 'Scheduled',
    createdAt: '2023-10-02T14:30:00Z',
    thumbnailUrl: null
  }
];

describe('TicketsTable Component', () => {
  const mockOnTicketUpdated = vi.fn();
  const mockOnTicketDeleted = vi.fn();
  const mockOnAnalyze = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // VIVA PREP: Tests that the component renders a list of tickets correctly when data is provided.
  // This verifies the "normal" rendering state of the manager's queue.
  test('renders tickets correctly', () => {
    render(
      <TicketsTable
        tickets={mockTickets}
        onTicketUpdated={mockOnTicketUpdated}
        onTicketDeleted={mockOnTicketDeleted}
      />
    );

    // Verify both tickets are rendered by checking their descriptions and tenant names
    expect(screen.getByText('Leaky faucet in the kitchen')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    expect(screen.getByText('Heater not working')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  // VIVA PREP: Tests the "boundary" or empty state where no tickets are available.
  // Ensures the UI degrades gracefully with a user-friendly empty state message.
  test('renders empty state when no tickets provided', () => {
    render(
      <TicketsTable
        tickets={[]}
        onTicketUpdated={mockOnTicketUpdated}
        onTicketDeleted={mockOnTicketDeleted}
      />
    );

    expect(screen.getByText('No tickets found')).toBeInTheDocument();
    expect(screen.getByText('There are no maintenance requests matching your current filter.')).toBeInTheDocument();
  });

  // VIVA PREP: Tests the search functionality.
  // Validates that typing into the search bar filters the visible tickets accordingly.
  test('filters tickets by search query', () => {
    render(
      <TicketsTable
        tickets={mockTickets}
        onTicketUpdated={mockOnTicketUpdated}
        onTicketDeleted={mockOnTicketDeleted}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search by Ticket ID or Tenant Name/i);
    
    // Type 'Jane' to filter for Jane Smith's ticket
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    // John Doe's ticket should be hidden
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    // Jane Smith's ticket should remain
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  // VIVA PREP: Tests a user action (status update) and its corresponding service call.
  // Ensures that when a manager changes the status dropdown, the API service is invoked.
  test('calls updateTicketStatus when status is changed', async () => {
    ticketService.updateTicketStatus.mockResolvedValueOnce();

    render(
      <TicketsTable
        tickets={[mockTickets[0]]} // Just render the first ticket
        onTicketUpdated={mockOnTicketUpdated}
        onTicketDeleted={mockOnTicketDeleted}
      />
    );

    // Find the select element for status update
    const select = screen.getByRole('combobox');
    
    // Change status from Submitted (0) to Analyzing (1)
    fireEvent.change(select, { target: { value: '1' } });

    // Verify the service was called with correct parameters
    await waitFor(() => {
      expect(ticketService.updateTicketStatus).toHaveBeenCalledWith(mockTickets[0].id, 1);
      expect(mockOnTicketUpdated).toHaveBeenCalledWith(mockTickets[0].id, 'Analyzing');
    });
  });

  // VIVA PREP: Tests the delete confirmation flow.
  // Ensures clicking delete opens a modal, and confirming it calls the API.
  test('handles delete ticket flow', async () => {
    ticketService.deleteTicket.mockResolvedValueOnce();

    render(
      <TicketsTable
        tickets={[mockTickets[0]]}
        onTicketUpdated={mockOnTicketUpdated}
        onTicketDeleted={mockOnTicketDeleted}
      />
    );

    // Click the delete button on the row
    const deleteButton = screen.getByTitle('Delete ticket');
    fireEvent.click(deleteButton);

    // Verify confirmation modal appears
    expect(screen.getByText('Are you sure you want to delete this maintenance ticket? This action cannot be undone.')).toBeInTheDocument();

    // Click confirm inside the modal
    const confirmButton = screen.getByText('Delete', { selector: 'button' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(ticketService.deleteTicket).toHaveBeenCalledWith(mockTickets[0].id);
      expect(mockOnTicketDeleted).toHaveBeenCalledWith(mockTickets[0].id);
    });
  });
});
