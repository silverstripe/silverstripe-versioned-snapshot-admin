import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved
import { inject } from 'lib/Injector';
import { fetchSnapshots } from '../../services/SnapshotAPI';

const SnapshotViewerContainer = ({
  data: {
    typeName,
    recordId,
    limit,
    page,
    recordClass,
    actions = { versions: {} },
  },
  SnapshotViewerComponent,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchData = async (pageNum = page || 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchSnapshots(recordId, recordClass, pageNum);
      setData(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when page changes
  useEffect(() => {
    fetchData(page || 1);
  }, [recordId, recordClass, page, limit]);

  const versions = data || {};
  const pageInfo = data ? data.pageInfo : { totalCount: 0 };

  // Transform data to match the expected format from GraphQL
  const transformedVersions = {
    ...versions,
    snapshotHistory: {
      pageInfo,
      edges: (versions.versions || []).map(version => ({
        node: version,
      })),
    },
  };

  const props = {
    loading,
    versions: transformedVersions,
    graphQLErrors: error ? [error] : null,
    actions: {
      ...actions,
      versions: {
        ...transformedVersions,
        // eslint-disable-next-line no-shadow
        goToPage(pageNum) {
          fetchData(pageNum);
        }
      },
    },
    recordId,
    recordClass,
    typeName,
    limit,
    page,
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
    actions: PropTypes.object,
  }),
};

export default inject(
  ['SnapshotViewer'],
  (SnapshotViewerComponent) => ({
    SnapshotViewerComponent,
  }),
  ({ contextKey }) => `VersionedAdmin.HistoryViewer.${contextKey}`
)(SnapshotViewerContainer);
