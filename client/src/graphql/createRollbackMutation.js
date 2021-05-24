import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const createRollbakMutation = typeName => {
  return gql`
  mutation rollback${typeName}($id:ID!, $toVersion:Int!) {
    rollback${typeName}(
      id: $id
      toVersion: $toVersion
    ) {
      id
      className
    }
  }
  `;
};

export default createRollbakMutation;
