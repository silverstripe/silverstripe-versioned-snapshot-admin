import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { inject } from 'lib/Injector';
import backend from 'lib/Backend';
import Config from 'lib/Config';
import getJsonErrorMessage from 'lib/getJsonErrorMessage';
import Loading from 'components/Loading/Loading';

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
      page,
      recordClass,
      isPreviewable,
      actions = { versions: {} },
    },
    SnapshotViewerComponent,
  }) => {
  // State to manage loading, errors, and the API response
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState(null);
  // This will store the whole response, e.g., { versions: [], pageInfo: { totalCount: 0 } }
  const [versionsData, setVersionsData] = useState(null);
  // Add a trigger for refreshing data
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!recordId || !recordClass) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrors(null);

    if (!snapshotEndpoint) {
      console.error('Snapshot Endpoint not provided in props.');
      setErrors(['Configuration Error: Endpoint missing']);
      setLoading(false);
      return;
    }

    // Build URL using prop
    const url = `${snapshotEndpoint}?record_class=${recordClass}&record_id=${recordId}&page=${page}&limit=${limit}`;

    // backend.get automatically injects X-Security-ID (CSRF token) if available.
    backend.get(url)
      .then(async (response) => {
        if (!response.ok) {
            const msg = await getJsonErrorMessage(response);
            throw new Error(msg || `API Error: ${response.statusText}`);
        }
        return response.json();
      })
      .then(responseJson => {
        setVersionsData(responseJson);
      })
      .catch((err) => {
        console.error(err);
        setErrors([err.message]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [recordId, recordClass, page, limit, refreshTrigger, snapshotEndpoint]); // Dependencies: re-fetch if these change

  // Function to pass down to trigger a refresh
  const handleRefresh = () => setRefreshTrigger((t) => t + 1);

  if (loading) {
    return <Loading/>;
  }

  // Extract versions and pageInfo from state, with fallbacks
  const versions = versionsData ? versionsData.versions : [];
  const pageInfo = versionsData ? versionsData.pageInfo : { totalCount: 0 };

  // Props for the underlying component
  const props = {
    loading, // Pass loading state
    versions, // Pass the list of versions
    pageInfo, // Pass pagination info
    actions, // Pass through the original actions
    recordId,
    recordClass,
    limit,
    page,
    isPreviewable, // Pass through isPreviewable
    onAfterRevert: handleRefresh, // Pass the refresh handler
  };

  return (
    <SnapshotViewerComponent {...props} />
  );
};

SnapshotViewerContainer.propTypes = {
  data: PropTypes.shape({
    recordId: PropTypes.number.isRequired,
    limit: PropTypes.number,
    page: PropTypes.number,
    recordClass: PropTypes.string.isRequired,
    isPreviewable: PropTypes.bool,
    actions: PropTypes.object,
  }),
  SnapshotViewerComponent: PropTypes.elementType.isRequired,
};

export default inject(
  ['SnapshotViewer'],
  (SnapshotViewerComponent) => ({
    SnapshotViewerComponent,
  }),
  ({ contextKey }) => `VersionedAdmin.HistoryViewer.${contextKey}`
)(SnapshotViewerContainer);
