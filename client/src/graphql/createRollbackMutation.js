import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const createRollbakMutation = typeName => {
  return gql`
  mutation rollback${typeName}($id:ID!, $toVersion:Int!) {
    rollback${typeName}(
      ID: $id
      ToVersion: $toVersion
    ) {
      ID
    }
  }
  `;
};

export default createRollbakMutation;