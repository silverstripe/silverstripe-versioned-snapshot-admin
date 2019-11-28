import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

/**
 *  Copied directly from CMS module. We have to do this because HOCs cannot be shared across modules.
 *  Something like: updater.component('MyComponent.Some.Context', 'NameOfHOC'); would solve this.
 *  (a HOC as a registered service rather than a concretion)
 */

const mutation = gql`
mutation rollbackPage($id:ID!, $toVersion:Int!) {
  rollbackSilverStripeSiteTree(
    ID: $id
    ToVersion: $toVersion
  ) {
    ID
  }
}
`;

const config = {
  props: ({ mutate, ownProps: { actions } }) => {
    const rollbackPage = (id, toVersion) => mutate({
      variables: {
        id,
        toVersion,
      },
    });

    return {
      actions: {
        ...actions,
        rollbackPage,
        // For BC:
        revertToVersion: rollbackPage,
      },
    };
  },
  options: {
    // Refetch versions after mutation is completed
    refetchQueries: ['ReadHistoryViewerPage']
  }
};

export { mutation, config };

export default graphql(mutation, config);
