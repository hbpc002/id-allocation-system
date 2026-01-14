import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IdAllocationStatus } from '../../app/components/IdAllocationStatus.tsx';

describe('IdAllocationStatus Component', () => {
  const defaultProps = {
    totalIds: 100,
    availableIds: 50,
    disabledIds: 10,
    allocatedIdsCount: 40,
    currentTime: new Date('2025-01-15T10:30:00')
  };

  it('should render all status values', () => {
    const { container } = render(<IdAllocationStatus {...defaultProps} />);

    // Find the grid containers
    const gridItems = container.querySelectorAll('.grid-cols-2 > div');

    // Should have 5 items: total, available, allocated, disabled, and time
    expect(gridItems.length).toBeGreaterThanOrEqual(4);

    // Check that the text content contains all expected values
    expect(container.textContent).toContain('工号总数');
    expect(container.textContent).toContain('100');
    expect(container.textContent).toContain('可用工号');
    expect(container.textContent).toContain('50');
    expect(container.textContent).toContain('已分配');
    expect(container.textContent).toContain('40');
    expect(container.textContent).toContain('已停用');
    expect(container.textContent).toContain('10');
  });

  it('should render current time', () => {
    const { container } = render(<IdAllocationStatus {...defaultProps} />);

    expect(container.textContent).toContain('当前时间:');
    expect(container.textContent).toContain('2025-01-15 10:30:00');
  });

  it('should handle zero values', () => {
    const { container } = render(<IdAllocationStatus
      totalIds={0}
      availableIds={0}
      disabledIds={0}
      allocatedIdsCount={0}
      currentTime={new Date('2025-01-15T00:00:00')}
    />);

    // Get all the value elements (the big numbers in each card)
    const valueElements = container.querySelectorAll('.text-xl.font-semibold');

    // Should have 4 value elements (total, available, allocated, disabled)
    expect(valueElements.length).toBe(4);

    // Each should contain "0"
    valueElements.forEach(el => {
      expect(el.textContent).toBe('0');
    });

    // Verify the time is rendered
    expect(container.textContent).toContain('当前时间:');
  });
});
