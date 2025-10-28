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
      typeName,
      recordId,
      limit,
      page,
      recordClass,
      isPreviewable,
      actions = {versions: {}},
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

    // Get the endpoint config for the new snapshot controller
    // This MUST match the working controller from versioned-admin
    const sectionConfig = Config.getSection('SilverStripe\\VersionedAdmin\\Controllers\\HistoryViewerController');
    const endpoint = sectionConfig.endpoints.read;

    // TODO: URL seems to be incorrect and returns 403. Check further with versioned-admin
    const url = `${endpoint}?dataClass=${recordClass}&id=${recordId}&page=${page}&limit=${limit}`;

    console.log(`sectionConfig`);
    console.log(sectionConfig);
    console.log(`endpoint`);
    console.log(endpoint);
    console.log(`url`);
    console.log(url);

    // Make the backend API call
    backend.get(url)
      .then(response => response.json())
      .then(responseJson => {
        console.log(responseJson);
        setVersionsData(responseJson);
      })
      .catch(async (err) => {
        const message = await getJsonErrorMessage(err);
        console.log(message);
        setErrors([message]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [recordId, recordClass, page, limit, refreshTrigger]); // Dependencies: re-fetch if these change

  // Function to pass down to trigger a refresh
  const handleRefresh = () => setRefreshTrigger((t) => t + 1);

  // Show loading indicator
  if (loading) {
    return <Loading/>;
  }

  // Extract versions and pageInfo from state, with fallbacks
  const versions = versionsData ? versionsData.versions : [];
  const pageInfo = versionsData ? versionsData.pageInfo : {totalCount: 0};

  // Props for the underlying component
  const props = {
    loading, // Pass loading state
    versions, // Pass the list of versions
    pageInfo, // Pass pagination info
    graphQLErrors: errors, // Pass any errors
    actions, // Pass through the original actions
    recordId,
    recordClass,
    typeName,
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
    typeName: PropTypes.string.isRequired,
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
