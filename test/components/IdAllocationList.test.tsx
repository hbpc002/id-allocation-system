import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IdAllocationList } from '../../app/components/IdAllocationList.tsx';

describe('IdAllocationList Component', () => {
  it('should render "No IDs allocated" when empty', () => {
    render(<IdAllocationList allocatedIds={[]} />);

    expect(screen.getByText('No IDs allocated')).toBeInTheDocument();
  });

  it('should render list of allocated IDs', () => {
    const allocatedIds = [
      { id: 1001, ipAddress: '192.168.1.100' },
      { id: 1002, ipAddress: '192.168.1.101' }
    ];

    const { container } = render(<IdAllocationList allocatedIds={allocatedIds} />);

    // Use regex to match the text that includes the ID
    expect(container.textContent).toContain('1001');
    expect(container.textContent).toContain('192.168.1.100');
    expect(container.textContent).toContain('1002');
    expect(container.textContent).toContain('192.168.1.101');

    // Verify the list items exist
    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(2);
    expect(listItems[0].textContent).toMatch(/ID: 1001.*IP: 192\.168\.1\.100/);
    expect(listItems[1].textContent).toMatch(/ID: 1002.*IP: 192\.168\.1\.101/);
  });

  it('should only show last 10 IDs', () => {
    const allocatedIds = Array.from({ length: 15 }, (_, i) => ({
      id: 2000 + i,
      ipAddress: `192.168.1.${i}`
    }));

    const { container } = render(<IdAllocationList allocatedIds={allocatedIds} />);

    const listItems = container.querySelectorAll('li');

    // Should show only 10 items (last 10)
    expect(listItems).toHaveLength(10);

    // Should show IDs 2005-2014 (last 10)
    expect(listItems[0].textContent).toContain('2005');
    expect(listItems[9].textContent).toContain('2014');

    // Should NOT show ID 2000 (first one)
    const allText = container.textContent;
    expect(allText).not.toContain('2000');
  });
});
