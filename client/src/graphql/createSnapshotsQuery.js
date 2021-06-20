import gql from 'graphql-tag';

const createSnapshotsQuery = (typeName, isPreviewable) => gql`
    query ReadSnapshots${typeName} ($page_id: ID!, $limit: Int!, $offset: Int!) {
        readOne${typeName}(
          id: $page_id
        ) {
          id
          ${isPreviewable ? 'absoluteLink' : ''}
          snapshotHistory (limit: $limit, offset: $offset) {
            pageInfo {
              totalCount
            }
            edges {
              node {
                id
                lastEdited
                activityDescription
                activityType
                activityAgo
                isFullVersion
                isLiveSnapshot
                baseVersion
                message
                author {
                  firstName
                  surname
                }
                originVersion {
                  version
                  ${isPreviewable ? 'absoluteLink' : ''}
                  author {
                    firstName
                    surname
                  }

                  published
                  publisher {
                    firstName
                    surname
                  }
                  latestDraftVersion
                }
              }
            }
          }
        }
      }

    `;

export default createSnapshotsQuery;
