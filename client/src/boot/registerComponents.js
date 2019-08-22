import Injector from 'lib/Injector';
import React from 'react';
import HistoryViewer from 'components/HistoryViewer/HistoryViewer';
import HistoryViewerHeading from 'components/HistoryViewer/HistoryViewerHeading';
import HistoryViewerToolbar from 'components/HistoryViewer/HistoryViewerToolbar';
import HistoryViewerVersion from 'components/HistoryViewer/HistoryViewerVersion';
import HistoryViewerVersionDetail from 'components/HistoryViewer/HistoryViewerVersionDetail';
import HistoryViewerVersionList from 'components/HistoryViewer/HistoryViewerVersionList';
import HistoryViewerVersionState from 'components/HistoryViewer/HistoryViewerVersionState';
import HistoryViewerSnapshotState from 'components/HistoryViewer/HistoryViewerSnapshotState';
import HistoryViewerSnapshot from 'components/HistoryViewer/HistoryViewerSnapshot';
import HistoryViewerCompareWarning from 'components/HistoryViewer/HistoryViewerCompareWarning';
import snapshotQuery from 'graphql/snapshotsQuery';

export default () => {
  Injector.component.register('SnapshotViewer', HistoryViewer);
  Injector.component.register('HistoryViewer', HistoryViewer);
  Injector.component.registerMany({
    HistoryViewerHeading,
    HistoryViewerToolbar,
    HistoryViewerVersion,
    HistoryViewerVersionDetail,
    HistoryViewerVersionList,
    HistoryViewerVersionState,
    HistoryViewerSnapshotState,
    HistoryViewerSnapshot,
    HistoryViewerCompareWarning,
  }, { force: true });
  // Overide the existing namespaced component pages-history

  const HistoryViewerWithSnapshot = () => (props) => {
    const HistoryViewerWithSnapshotQuery = snapshotQuery(HistoryViewer);
    // We have all the versions we need from snapshotQuery
    delete props.versions; // eslint-disable-line
    return (<HistoryViewerWithSnapshotQuery {...props} />);
  };

  Injector.transform(
    'pages-history',
    (updater) => {
      // Add CMS page history GraphQL query to the HistoryViewer
      updater.component('SnapshotViewer', HistoryViewerWithSnapshot, 'PageHistoryViewer');
      updater.component('HistoryViewer', HistoryViewerWithSnapshot, 'PageHistoryViewer');
    }
  );
};

