import i18n from 'i18n';
import moment from 'moment';

/**
 * Formats the last edited date according to the current locale and return it in the example
 * format "03/01/2018 2:45 PM"
 *
 * @returns {string}
 */
const getDateFromVersion = version => {
  moment.locale(i18n.detectLocale());
  return moment(version.lastEdited).format('L LT');
};

export default getDateFromVersion;
