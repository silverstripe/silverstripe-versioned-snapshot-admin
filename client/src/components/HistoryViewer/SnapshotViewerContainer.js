import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Query } from 'react-apollo';
import { inject } from 'lib/Injector';
import createSnapshotsQuery from '../../graphql/createSnapshotsQuery';

const SnapshotViewerContainer = ({
  data: {
    typeName,
    recordId,
    limit,
    page,
    recordClass,
    isPreviewable,
    actions = { versions: {} },
  },
  SnapshotViewerComponent,
}) => {
    const QUERY = useMemo(
      () => createSnapshotsQuery(typeName, isPreviewable),
      [typeName, isPreviewable]
    );

    const variables = {
        limit,
        offset: ((page || 1) - 1) * limit,
        page_id: recordId,
    };
    return (
      <Query query={QUERY} variables={variables} fetchPolicy="network-only">
        {({ loading, error, data, refetch }) => {
                let readOne = null;
                if (data) {
                  readOne = data[`readOne${typeName}`];
                }
                const versions = readOne || {};

                const errors = error && error.graphQLErrors &&
                error.graphQLErrors.map((graphQLError) => graphQLError.message);

                const props = {
                    loading,
                    versions,
                    graphQLErrors: errors,
                    actions: {
                        ...actions,
                        versions: {
                            ...versions,
                            // eslint-disable-next-line no-shadow
                            goToPage(page) {
                                refetch({
                                    offset: ((page || 1) - 1) * limit,
                                    limit,
                                    page_id: recordId,
                                });
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
            }}
      </Query>
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
