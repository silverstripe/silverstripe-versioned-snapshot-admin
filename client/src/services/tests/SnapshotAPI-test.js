/* global jest, describe, it, expect, global */

import { fetchSnapshots, rollbackSnapshot } from '../SnapshotAPI';

// The service reads its endpoints from the injected CMS config, so stub it with the
// endpoints the SnapshotViewerController exposes.
jest.mock('lib/Config', () => ({
  __esModule: true,
  default: {
    // Only return endpoints for the section the service actually requests, so a wrong
    // SECTION_KEY in SnapshotAPI.js surfaces as a failure rather than passing silently.
    getSection: (section) => (
      section === 'SilverStripe\\VersionedAdmin\\Controllers\\HistoryViewerController'
        ? {
          endpoints: {
            read: '/admin/historyviewer/api/read',
            revert: '/admin/historyviewer/api/revert',
          },
        }
        : {}
    ),
  },
}));

const mockResponse = (body, { ok = true, status = 200, contentType = 'application/json' } = {}) => ({
  ok,
  status,
  headers: { get: () => contentType },
  json: () => Promise.resolve(body),
  text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
});

describe('SnapshotAPI', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('fetchSnapshots()', () => {
    // Verifies fetchSnapshots() GETs the read endpoint with id/dataClass/page and returns the JSON body
    it('requests the read endpoint with the record details and returns the parsed body', async () => {
      const body = { pageInfo: { totalCount: 1 }, versions: [{ id: 1 }] };
      global.fetch = jest.fn(() => Promise.resolve(mockResponse(body)));

      const result = await fetchSnapshots(123, 'Page', 2);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toContain('/admin/historyviewer/api/read');
      expect(url).toContain('id=123');
      expect(url).toContain('dataClass=Page');
      expect(url).toContain('page=2');
      expect(options.method).toBe('GET');
      expect(options.headers['X-Requested-With']).toBe('XMLHttpRequest');
      expect(result).toEqual(body);
    });

    // Verifies fetchSnapshots() defaults to page 1 when no page argument is given
    it('defaults to the first page when no page is provided', async () => {
      global.fetch = jest.fn(() => Promise.resolve(mockResponse({ versions: [] })));

      await fetchSnapshots(123, 'Page');

      expect(global.fetch.mock.calls[0][0]).toContain('page=1');
    });

    // Verifies fetchSnapshots() rejects on a non-ok HTTP response
    it('throws when the response is not ok', async () => {
      global.fetch = jest.fn(() => Promise.resolve(mockResponse('Forbidden', { ok: false, status: 403 })));

      await expect(fetchSnapshots(123, 'Page', 1)).rejects.toThrow('Failed to fetch snapshots');
    });

    // Verifies fetchSnapshots() rejects when the response is not JSON
    it('throws when the response is not JSON', async () => {
      global.fetch = jest.fn(() => Promise.resolve(mockResponse('<html></html>', { contentType: 'text/html' })));

      await expect(fetchSnapshots(123, 'Page', 1)).rejects.toThrow('Invalid response format');
    });
  });

  describe('rollbackSnapshot()', () => {
    // Verifies rollbackSnapshot() POSTs id/dataClass/toVersion to the revert endpoint and returns the JSON body
    it('posts the record and target version to the revert endpoint and returns the parsed body', async () => {
      const body = { id: 123, className: 'Page' };
      global.fetch = jest.fn(() => Promise.resolve(mockResponse(body)));

      const result = await rollbackSnapshot(123, 'Page', 5);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('/admin/historyviewer/api/revert');
      expect(options.method).toBe('POST');
      expect(options.headers['X-Requested-With']).toBe('XMLHttpRequest');
      expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      expect(options.body.toString()).toContain('id=123');
      expect(options.body.toString()).toContain('dataClass=Page');
      expect(options.body.toString()).toContain('toVersion=5');
      expect(result).toEqual(body);
    });

    // Verifies rollbackSnapshot() rejects on a non-ok HTTP response
    it('throws when the response is not ok', async () => {
      global.fetch = jest.fn(() => Promise.resolve(mockResponse('Bad request', { ok: false, status: 400 })));

      await expect(rollbackSnapshot(123, 'Page', 5)).rejects.toThrow('Failed to rollback snapshot');
    });

    // Verifies rollbackSnapshot() rejects when the response is not JSON
    it('throws when the response is not JSON', async () => {
      global.fetch = jest.fn(() => Promise.resolve(mockResponse('<html></html>', { contentType: 'text/html' })));

      await expect(rollbackSnapshot(123, 'Page', 5)).rejects.toThrow('Invalid response format');
    });
  });
});
