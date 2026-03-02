import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { inject } from 'lib/Injector';
import { connect } from 'react-redux';
import backend from 'lib/Backend';
import getJsonErrorMessage from 'lib/getJsonErrorMessage';

/**
 * This component replaces the old GraphQL-based container.
 * Its job is to fetch snapshot data from a RESTful endpoint
 * and pass it down to the injected SnapshotViewerComponent.
 */
const SnapshotViewerContainer = (
  {
    data: {
      snapshotEndpoint,
      recordId,
      limit,
      page: defaultPage,
      recordClass,
      isPreviewable,
      schemaUrl,
      actions = { versions: {} },
    },
    reduxCurrentPage,
    SnapshotViewerComponent,
  }) => {
  // State to manage loading, fetchErrors, and the API response
  const [loading, setLoading] = useState(true);
  const [fetchErrors, setFetchErrors] = useState([]);
  // This will store the whole response, e.g., { versions: [], pageInfo: { totalCount: 0 } }
  const [versionsData, setVersionsData] = useState(null);
  // Add a trigger for refreshing data
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Use Redux page first, fallback to default prop, fallback to 1
  const activePage = reduxCurrentPage || defaultPage || 1;

  useEffect(() => {
    if (!recordId || !recordClass) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchErrors([]);

    if (!snapshotEndpoint) {
      console.error('Snapshot Endpoint not provided in props.');
      setFetchErrors(['Configuration Error: Endpoint missing']);
      setLoading(false);
      return;
    }

    // Ensure page and limit are valid numbers with defaults
    const pageNum = activePage && !isNaN(activePage) ? activePage : 1;
    const limitNum = limit && !isNaN(limit) ? limit : 10;

    // Build URL using prop
    const url = `${snapshotEndpoint}?record_class=${encodeURIComponent(recordClass)}&record_id=${encodeURIComponent(recordId)}&page=${pageNum}&limit=${limitNum}`;

    // backend.get automatically injects X-Security-ID (CSRF token) if available.
    backend.get(url)
      .then(async (response) => {
        // Check for failure first before reading the body stream
        if (!response.ok) {
          // Can safely consume the stream now
          const msg = await getJsonErrorMessage(response);
          throw new Error(msg || `API Error: ${response.statusText}`);
        }

        // Parse the JSON directly if response is ok
        try {
          const responseJson = await response.json();
          setVersionsData(responseJson);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          throw new Error(`Invalid JSON response: ${parseError.message}`);
        }
      })
      .catch((err) => {
        console.error('API Error:', err);
        // This will catch network errors, non-OK statuses, AND JSON parse errors
        setFetchErrors([err.message]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [recordId, recordClass, activePage, limit, refreshTrigger, snapshotEndpoint]);

  // Function to pass down to trigger a refresh
  const handleRefresh = () => setRefreshTrigger((t) => t + 1);

  // Extract versions and pageInfo from state, with fallbacks
  const versions = versionsData ? versionsData.versions : [];
  const pageInfo = versionsData ? versionsData.pageInfo : { totalCount: 0 };

  // Props for the underlying component
  const props = {
    loading, // Pass loading state
    fetchErrors, // Pass api errors if any
    versions, // Pass the list of versions
    pageInfo, // Pass pagination info
    actions, // Pass through the original actions
    recordId,
    recordClass,
    limit,
    page: activePage,
    isPreviewable, // Pass through isPreviewable
    schemaUrl, // Schema URL for form loading (from PHP)
    onAfterRevert: handleRefresh, // Pass the refresh handler
  };

  return (
    <SnapshotViewerComponent {...props} />
  );
};

SnapshotViewerContainer.propTypes = {
  data: PropTypes.shape({
    snapshotEndpoint: PropTypes.string,
    schemaUrl: PropTypes.string,
    recordId: PropTypes.number.isRequired,
    limit: PropTypes.number,
    page: PropTypes.number,
    recordClass: PropTypes.string.isRequired,
    isPreviewable: PropTypes.bool,
    actions: PropTypes.object,
  }),
  SnapshotViewerComponent: PropTypes.elementType.isRequired,
};

/**
 * Map the Redux state to the container's props
 *
 * BEFORE (GraphQL): HoC automatically managed data fetching reactivity.
 * When HistoryViewer dispatched `setCurrentPage` to the Redux store, the GraphQL
 * query variables automatically updated under the hood and triggered a network re-fetch.
 *
 * NOW (REST API): This container must explicitly listen to the Redux store for pagination changes.
 * By mapping `currentPage` here, any click on the Paginator updates Redux, which immediately flows
 * down as the `reduxCurrentPage` prop into our container. This change in props triggers
 * the `useEffect` dependency array, firing off the new REST API request.
 *
 */
function mapStateToProps(state) {

  return {
    reduxCurrentPage: state.versionedAdmin.historyViewer.currentPage,
  };
}

// Chain the connect() with the existing inject()
export default connect(mapStateToProps)(
  inject(
    ['SnapshotViewer'],
    (SnapshotViewerComponent) => ({
      SnapshotViewerComponent,
    }),
    ({ contextKey }) => `VersionedAdmin.HistoryViewer.${contextKey}`
  )(SnapshotViewerContainer)
);
