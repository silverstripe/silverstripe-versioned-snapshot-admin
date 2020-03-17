import gql from 'graphql-tag';

const createSnapshotsQuery = typeName => {
    return gql`
    query ReadSnapshots${typeName} ($page_id: ID!, $limit: Int!, $offset: Int!) {
        readOne${typeName}(
          ID: $page_id
        ) {
          ID
          AbsoluteLink
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
                BaseVersion
                Message
                Author {
                  FirstName
                  Surname
                }
                OriginVersion {
                  Version
                  AbsoluteLink
                  Author {
                    FirstName
                    Surname
                  }
      
                  Published
                  Publisher {
                    FirstName
                    Surname
                  }
                  LiveVersion
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