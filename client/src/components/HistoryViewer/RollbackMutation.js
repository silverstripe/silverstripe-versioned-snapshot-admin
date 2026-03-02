import { useCallback } from 'react';

const RollbackMutation = ({ typeName, children }) => {
  const handleRollback = useCallback(async (snapshotId) => {
    // Replace GraphQL mutation with REST API call
    const response = await fetch('/api/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ typeName, snapshotId })
    });
    return response.json();
  }, [typeName]);

  return children(handleRollback);
};

export default RollbackMutation;
