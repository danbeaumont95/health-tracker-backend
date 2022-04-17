/// <reference types="cypress" />
const moment = require('moment');
const { checkIfDetailsChanged, returnDateIfBetween2Dates, getAllDatesBetweenTimePeriod } = require('../../../src/utils/helpers');

describe('checkIfDetailsChanged', () => {
  it('returns object of updated details when comparing 2 arrays', () => {
    const newObject = checkIfDetailsChanged({ name: 'Dan', age: 26 }, { name: 'Cloe', age: 23 });
    expect(newObject).to.include.keys('name', 'age');
    expect(newObject.name).to.include.keys('from', 'to');
    expect(newObject.age).to.include.keys('from', 'to');
    expect(newObject.name.from).to.equal('Dan');
    expect(newObject.age.from).to.equal(26);
    expect(newObject.name.to).to.equal('Cloe');
    expect(newObject.age.to).to.equal(23);
  });
});

describe('returnDateIfBetween2Dates', () => {
  it('doenst return null', () => {
    const timePeriod = moment().subtract(1, 'w').add(1, 'd');
    const now = moment();

    const date = moment().subtract(2, 'd');
    const dateWithinPastWeek = returnDateIfBetween2Dates(timePeriod, now, date);

    expect(dateWithinPastWeek).to.not.equal(null);
  });
  it('returns null', () => {
    const timePeriod = moment().subtract(1, 'w').add(1, 'd');
    const now = moment();

    const date = moment().subtract(1, 'y');
    const dateNotWithinPastWeek = returnDateIfBetween2Dates(timePeriod, now, date);

    expect(dateNotWithinPastWeek).to.equal(null);
  });
});

describe('getAllDatesBetweenTimePeriod', () => {
  it('returns dates between 2 dates with time period week', () => {
    const timePeriod = moment().subtract(1, 'w').add(1, 'd');
    const now = moment();
    const dates = getAllDatesBetweenTimePeriod(timePeriod, now);

    expect(dates).to.be.a('array');
    expect(dates.length).to.equal(7);
  });
  it('returns dates between 2 dates with time period month', () => {
    const timePeriod = moment().subtract(1, 'month').add(1, 'd');
    const now = moment();
    const dates = getAllDatesBetweenTimePeriod(timePeriod, now);

    expect(dates).to.be.a('array');
    expect(dates.length).to.equal(31);
  });
  it('returns dates between 2 dates with time period month', () => {
    const timePeriod = moment().subtract(1, 'y').add(1, 'd');
    const now = moment();
    const dates = getAllDatesBetweenTimePeriod(timePeriod, now);

    expect(dates).to.be.a('array');
    expect(dates.length).to.equal(365);
  });
});
