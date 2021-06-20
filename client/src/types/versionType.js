import PropTypes from 'prop-types';

// Describes the expected data structure for a member attached to a version
const memberShape = PropTypes.shape({
  firstName: PropTypes.string,
  surname: PropTypes.string,
});

// Describes the data structure for a Version, returned via GraphQL scaffolding
const versionType = PropTypes.shape({
  version: PropTypes.number,
  absoluteLink: PropTypes.string,
  lastEdited: PropTypes.string,
  published: PropTypes.boolean,
  liveVersion: PropTypes.boolean,
  latestDraftVersion: PropTypes.boolean,
  message: PropTypes.string,
  publisher: memberShape,
  author: memberShape,
});

// A default (empty) data set for a version
const defaultVersion = {
  version: 0,
  absoluteLink: '',
  lastEdited: '',
  published: false,
  liveVersion: false,
  latestDraftVersion: false,
  message: '',
  publisher: {
    firstName: '',
    surname: '',
  },
  author: {
    firstName: '',
    surname: '',
  },
};

export { versionType, defaultVersion };
