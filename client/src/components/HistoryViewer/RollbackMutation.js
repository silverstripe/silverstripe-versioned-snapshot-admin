import React, { useMemo } from 'react';
import { Mutation } from 'react-apollo';
import createRollbackMutation from '../../graphql/createRollbackMutation';

const RollbackMutation = ({ typeName, children }) => {
    const ROLLBACK = useMemo(() => createRollbackMutation(typeName), [typeName]);
    return (
        <Mutation mutation={ROLLBACK} refetchQueries={[`ReadSnapshots${typeName}`]}>
            {children}
        </Mutation>
    )
};

export default RollbackMutation;