import React, { useMemo } from 'react';
import { Mutation } from '@apollo/client/react/components';
import createRollbackMutation from '../../graphql/createRollbackMutation';

const RollbackMutation = ({ typeName, children }) => {
  const ROLLBACK = useMemo(() => createRollbackMutation(typeName), [typeName]);
  return (
    <Mutation mutation={ROLLBACK} refetchQueries={[`ReadSnapshots${typeName}`]}>
      {children}
    </Mutation>
  );
};

export default RollbackMutation;
