import { useState } from 'react';
import PropTypes from 'prop-types';
import { rollbackSnapshot } from '../../services/SnapshotAPI';

/**
 * RollbackMutation component wraps rollback API calls and provides mutation function to children
 * This replaces the Apollo Client Mutation component with a REST API-based implementation
 *
 * API is compatible with Apollo Client's Mutation component:
 * children(mutationFunction, { loading, error, data })
 */
const RollbackMutation = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const executeRollback = async ({ variables } = {}) => {
    if (!variables) {
      throw new Error('Variables are required for rollback mutation');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await rollbackSnapshot(
        variables.id,
        variables.dataClass,
        variables.toVersion
      );

      setData(result);

      return result;
    } catch (err) {
      const errorMsg = err.message || 'Rollback failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Provide mutation function and state to children via render prop
  // Compatible with Apollo Client Mutation API
  const mutationState = {
    loading,
    error,
    data,
  };

  return children(executeRollback, mutationState);
};

RollbackMutation.propTypes = {
  typeName: PropTypes.string,
  children: PropTypes.func.isRequired,
};

RollbackMutation.defaultProps = {};

export default RollbackMutation;
