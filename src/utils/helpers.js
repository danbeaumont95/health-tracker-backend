const moment = require('moment');

exports.checkIfDetailsChanged = (oldDetails, newDetails) => {
  const diff = Object.keys(oldDetails).reduce((memo, key) => {
    const attributeBefore = oldDetails[key];
    const attributeAfter = newDetails[key];

    if (attributeBefore !== attributeAfter) {
      // eslint-disable-next-line no-param-reassign
      memo[key] = {
        from: attributeBefore,
        to: attributeAfter,
      };
    }
    return memo;
  }, {});
  return diff;
};

exports.returnDateIfBetween2Dates = (timePeriod, now, date) => {
  const input = moment(date);
  return input.isBetween(timePeriod, now) ? date : null;
};

exports.getAllDatesBetweenTimePeriod = (timePeriod, now) => {
  const nbDays = now.diff(timePeriod, 'days') + 1;

  const result = [...Array(nbDays).keys()]
    .map((i) => (timePeriod.clone().add(i, 'd').startOf('day').format()));

  return result;
};
