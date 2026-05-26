import React from 'react';
// eslint-disable-next-line import/no-unresolved
import Config from 'lib/Config';
// eslint-disable-next-line import/no-unresolved
import { inject } from 'lib/Injector';

const historyViewerConfig = (HistoryViewer) => {
  class HistoryViewerConfigProvider extends React.Component {
    getConfig() {
      const sectionKey = 'SilverStripe\\VersionedAdmin\\Controllers\\HistoryViewerController';
      return Config.getSection(sectionKey);
    }

    getSchemaUrlDetails() {
      const { compare } = this.props;
      if (compare) {
        return {
          formName: 'compareForm',
          queryParts: [
            'RecordVersionFrom=:from',
            'RecordVersionTo=:to',
          ],
        };
      }
      return {
        formName: 'versionForm',
        queryParts: [
          'RecordVersion=:version',
          'RecordDate=:date',
        ],
      };
    }

    getSchemaUrl() {
      const config = this.getConfig();
      const { formName, queryParts } = this.getSchemaUrlDetails();
      const schemaUrlBase = `${config.form[formName].schemaUrl}/:id`;
      const schemaUrlQuery = queryParts.concat('RecordClass=:class&RecordID=:id').join('&');
      return `${schemaUrlBase}?${schemaUrlQuery}`;
    }

    render() {
      const props = {
        ...this.props,
        config: this.getConfig(),
        HistoryViewer,
        schemaUrl: this.getSchemaUrl(),
      };

      return (
        <HistoryViewer
          {...props}
        />
      );
    }
  }

  return inject(['SnapshotHistoryViewer'])(HistoryViewerConfigProvider);
};

export default historyViewerConfig;
