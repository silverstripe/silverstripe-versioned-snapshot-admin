import gql from 'graphql-tag';

const createSnapshotsQuery = (typeName, isPreviewable) => {
    return gql`
    query ReadSnapshots${typeName} ($page_id: ID!, $limit: Int!, $offset: Int!) {
        readOne${typeName}(
          ID: $page_id
        ) {
          ID
          ${isPreviewable ? 'AbsoluteLink' : ''}
          SnapshotHistory (limit: $limit, offset: $offset) {
            pageInfo {
              totalCount
            }
            edges {
              node {
                ID
                LastEdited
                ActivityDescription
                ActivityType
                ActivityAgo
                IsFullVersion
                IsLiveSnapshot
                BaseVersion
                Message
                Author {
                  FirstName
                  Surname
                }
                OriginVersion {
                  Version
                  ${isPreviewable ? AbsoluteLink : ''}
                  Author {
                    FirstName
                    Surname
                  }

                  Published
                  Publisher {
                    FirstName
                    Surname
                  }
                  LatestDraftVersion
                }
              }
            }
          }
        }
      }

    `;
};

export default createSnapshotsQuery;
