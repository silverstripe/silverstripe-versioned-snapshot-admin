/**
 * Snapshot API service for REST-based snapshot operations
 * Replaces Apollo Client GraphQL queries/mutations with REST API calls
 * Uses standard fetch API available in all CMS 6 environments
 */

// eslint-disable-next-line import/no-unresolved
import Config from 'lib/Config';

const SECTION_KEY = 'SilverStripe\\VersionedAdmin\\Controllers\\HistoryViewerController';
const getEndpoints = () => Config.getSection(SECTION_KEY).endpoints;

/**
 * Fetch snapshot history for a record with pagination
 *
 * @param {number} recordId - The record ID
 * @param {string} dataClass - The fully qualified class name
 * @param {number} page - The page number (1-indexed)
 * @returns {Promise<{pageInfo: {totalCount: number}, versions: Array}>}
 */
export const fetchSnapshots = async (recordId, dataClass, page = 1) => {
  const params = new URLSearchParams({
    id: recordId,
    dataClass,
    page: page || 1,
  });

  const url = `${getEndpoints().read}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    throw new Error('Invalid response format');
  } catch (error) {
    throw new Error(`Failed to fetch snapshots: ${error.message}`);
  }
};

/**
 * Rollback a record to a specified version
 *
 * @param {number} recordId - The record ID
 * @param {string} dataClass - The fully qualified class name
 * @param {number} toVersion - The version number to rollback to
 * @returns {Promise<{success: boolean, id: number, className: string}>}
 */
export const rollbackSnapshot = async (recordId, dataClass, toVersion) => {
  const formData = new URLSearchParams({
    id: recordId,
    dataClass,
    toVersion,
  });

  const url = getEndpoints().revert;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    throw new Error('Invalid response format');
  } catch (error) {
    throw new Error(`Failed to rollback snapshot: ${error.message}`);
  }
};
