import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useIdAllocation } from '../../app/hooks/useIdAllocation.ts';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useIdAllocation Hook', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useIdAllocation());

      expect(result.current.allocatedIds).toEqual([]);
      expect(result.current.allocatedId).toBeNull();
      expect(result.current.uniqueSessionId).toBeNull();
      expect(result.current.errorMessage).toBeNull();
      expect(result.current.totalIds).toBe(0);
      expect(result.current.availableIds).toBe(0);
      expect(result.current.disabledIds).toBe(0);
      expect(result.current.allocatedIdsCount).toBe(0);
    });
  });

  describe('Data Refresh', () => {
    it('should fetch initial data on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          allocatedIds: [{ id: 1001, ipAddress: '192.168.1.100' }],
          totalPoolIds: 10,
          availableIds: 9,
          disabledIds: 1,
          allocatedIdsCount: 1,
          clientAllocatedId: null
        })
      });

      const { result } = renderHook(() => useIdAllocation());

      await waitFor(() => {
        expect(result.current.totalIds).toBe(10);
        expect(result.current.availableIds).toBe(9);
      });
    });

    it('should handle API errors gracefully on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const { result } = renderHook(() => useIdAllocation());

      // Should not throw, just silently handle
      await waitFor(() => {
        expect(result.current.totalIds).toBe(0);
      });
    });

    it('should set up auto-refresh intervals', async () => {
      vi.useFakeTimers();

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          allocatedIds: [],
          totalPoolIds: 5,
          availableIds: 5,
          disabledIds: 0,
          allocatedIdsCount: 0,
          clientAllocatedId: null
        })
      });

      const { result } = renderHook(() => useIdAllocation());

      // Initial call
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Fast-forward 10 seconds (auto-refresh interval)
      vi.advanceTimersByTime(10000);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Fast-forward another 10 seconds
      vi.advanceTimersByTime(10000);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });
  });

  describe('handleClockIn', () => {
    it('should allocate a new ID successfully', async () => {
      // Initial data fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          allocatedIds: [],
          totalPoolIds: 10,
          availableIds: 10,
          disabledIds: 0,
          allocatedIdsCount: 0,
          clientAllocatedId: null
        })
      });

      // Clock-in response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          id: 2001,
          uniqueId: 'session-123',
          ipAddress: '192.168.1.100'
        })
      });

      // Stats refresh after clock-in
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          allocatedIds: [{ id: 2001, ipAddress: '192.168.1.100' }],
          totalPoolIds: 10,
          availableIds: 9,
          disabledIds: 0,
          allocatedIdsCount: 1,
          clientAllocatedId: 2001
        })
      });

      const { result } = renderHook(() => useIdAllocation());

      await waitFor(() => {
        result.current.handleClockIn();
      });

      await waitFor(() => {
        expect(result.current.allocatedId).toBe(2001);
        expect(result.current.uniqueSessionId).toBe('session-123');
      });
    });

    it('should show error if already has ID and not forced', async () => {
      // Initial data with existing allocation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          allocatedIds: [{ id: 2001, ipAddress: '192.168.1.100' }],
          totalPoolIds: 10,
          availableIds: 9,
          disabledIds: 0,
          allocatedIdsCount: 1,
          clientAllocatedId: 2001
        })
      });

      const { result } = renderHook(() => useIdAllocation());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.allocatedId).toBe(2001);
      });

      // Try to clock in again
      result.current.handleClockIn();

      await waitFor(() => {
        expect(result.current.errorMessage).toContain('已申请到工号');
      });
    });

    it('should handle API errors during clock-in', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          allocatedIds: [],
          totalPoolIds: 10,
          availableIds: 10,
          disabledIds: 0,
          allocatedIdsCount: 0,
          clientAllocatedId: null
        })
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const { result } = renderHook(() => useIdAllocation());

      await waitFor(() => {
        result.current.handleClockIn();
      });

      await waitFor(() => {
        expect(result.current.errorMessage).toBeTruthy();
      });
    });
  });

  describe('handleClockOut', () => {
    it('should release allocated ID successfully', async () => {
      // Initial data with existing allocation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          allocatedIds: [{ id: 3001, ipAddress: '192.168.1.100' }],
          totalPoolIds: 10,
          availableIds: 9,
          disabledIds: 0,
          allocatedIdsCount: 1,
          clientAllocatedId: 3001
        })
      });

      // Clock-out response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      // Stats refresh after clock-out
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          allocatedIds: [],
          totalPoolIds: 10,
          availableIds: 10,
          disabledIds: 0,
          allocatedIdsCount: 0,
          clientAllocatedId: null
        })
      });

      const { result } = renderHook(() => useIdAllocation());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.allocatedId).toBe(3001);
      });

      // Clock out
      result.current.handleClockOut();

      await waitFor(() => {
        expect(result.current.allocatedId).toBeNull();
      });
    });

    it('should do nothing if no ID allocated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          allocatedIds: [],
          totalPoolIds: 10,
          availableIds: 10,
          disabledIds: 0,
          allocatedIdsCount: 0,
          clientAllocatedId: null
        })
      });

      const { result } = renderHook(() => useIdAllocation());

      await waitFor(() => {
        result.current.handleClockOut();
      });

      // Should not call fetch for release
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only initial load
    });
  });

  describe('handleClearAll', () => {
    it('should clear all IDs with admin session', async () => {
      // Initial data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          allocatedIds: [{ id: 4001, ipAddress: '192.168.1.100' }],
          totalPoolIds: 10,
          availableIds: 9,
          disabledIds: 0,
          allocatedIdsCount: 1,
          clientAllocatedId: 4001
        })
      });

      // Clear-all response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      // Stats refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          allocatedIds: [],
          totalPoolIds: 10,
          availableIds: 10,
          disabledIds: 0,
          allocatedIdsCount: 0,
          clientAllocatedId: null
        })
      });

      const { result } = renderHook(() => useIdAllocation());

      await waitFor(() => {
        expect(result.current.allocatedId).toBe(4001);
      });

      result.current.handleClearAll('admin-session-123');

      await waitFor(() => {
        expect(result.current.allocatedIds).toEqual([]);
        expect(result.current.allocatedId).toBeNull();
      });
    });
  });

  describe('uploadEmployeePool', () => {
    it('should upload employee pool file', async () => {
      // Initial data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          allocatedIds: [],
          totalPoolIds: 0,
          availableIds: 0,
          disabledIds: 0,
          allocatedIdsCount: 0,
          clientAllocatedId: null
        })
      });

      // Upload response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          uploadedCount: 3,
          failedCount: 0
        })
      });

      // Stats refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          allocatedIds: [],
          totalPoolIds: 3,
          availableIds: 3,
          disabledIds: 0,
          allocatedIdsCount: 0,
          clientAllocatedId: null
        })
      });

      const { result } = renderHook(() => useIdAllocation());

      const mockFile = new File(['5001\n5002\n5003'], 'ids.txt', { type: 'text/plain' });

      // Mock FileReader
      const mockFileReader = {
        readAsText: vi.fn(),
        onload: null,
        onerror: null,
        result: '5001\n5002\n5003'
      };

      vi.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any);

      result.current.uploadEmployeePool(mockFile, 'admin-session-123');

      // Simulate file read completion
      if (mockFileReader.onload) {
        mockFileReader.onload({
          target: { result: '5001\n5002\n5003' }
        } as any);
      }

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/id-allocation', expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'text/plain',
            'x-admin-session': 'admin-session-123'
          }),
          body: '5001\n5002\n5003'
        }));
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useIdAllocation());

      await waitFor(() => {
        // Should not crash, just log to console
        expect(result.current.errorMessage).toBeNull();
      });
    });
  });
});
