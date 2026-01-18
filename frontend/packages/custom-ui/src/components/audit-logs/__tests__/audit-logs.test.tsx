/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { AuditLogs } from '../index';

describe('AuditLogs', () => {
  it('renders with default props', () => {
    render(
      <AuditLogs
        entityType="event"
        entityId="evt_123"
      />
    );

    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    expect(screen.getByText('Activity history for this entity')).toBeInTheDocument();
  });

  it('renders with custom title and description', () => {
    render(
      <AuditLogs
        entityType="user"
        entityId="usr_456"
        title="User Activity"
        description="Recent user actions and events"
      />
    );

    expect(screen.getByText('User Activity')).toBeInTheDocument();
    expect(screen.getByText('Recent user actions and events')).toBeInTheDocument();
  });

  it('displays entity information in badge', () => {
    render(
      <AuditLogs
        entityType="booking"
        entityId="bk_789"
      />
    );

    expect(screen.getByText('booking • bk_789')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <AuditLogs
        entityType="event"
        entityId="evt_123"
        loading={true}
      />
    );

    // Should show skeleton loaders
    const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error state', () => {
    const errorMessage = 'Failed to load audit logs';
    render(
      <AuditLogs
        entityType="event"
        entityId="evt_123"
        error={errorMessage}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows empty state when no logs', () => {
    render(
      <AuditLogs
        entityType="event"
        entityId="evt_123"
        logs={[]} // Empty logs array
      />
    );

    expect(screen.getByText('No Audit Logs')).toBeInTheDocument();
  });
});