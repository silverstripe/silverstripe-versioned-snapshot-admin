import gql from 'graphql-tag';

const createSnapshotsQuery = (typeName, isPreviewable) => gql`
    query ReadSnapshots${typeName} ($page_id: ID!, $limit: Int!, $offset: Int!) {
        readOne${typeName}(
          filter: { id: { eq: $page_id } }
        ) {
        ... on ${typeName} {
            id
            ${isPreviewable ? 'absoluteLink' : ''}
            snapshotHistory (limit: $limit, offset: $offset) {
              pageInfo {
                totalCount
              }
              nodes {

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
