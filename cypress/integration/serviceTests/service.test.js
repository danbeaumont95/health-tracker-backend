/// <reference types="cypress" />
import 'babel-polyfill';

const { getAveragePainLevelFromMeals, getUserPainLevelByTimePeriod, getMealCausingMostPain } = require('../../../src/service/user');

describe('getAveragePainLevelFromMeals', () => {
  it('returns average pain level for all painLevels in array', () => {
    const breakfastArr = [
      {
        mealType: 'breakfast',
        food: ['smoothie'],
        date: '2022-04-13T19:53:13.071Z',
        painLevel: 1,
      },
      {
        mealType: 'breakfast',
        food: ['ceral'],
        date: '2022-04-15T21:16:35.463Z',
        painLevel: 3,
      },
    ];
    const lunchArr = [
      {
        mealType: 'lunch',
        food: ['sandwich'],
        date: '2022-04-13T19:53:13.071Z',
        painLevel: 1,
      },
      {
        mealType: 'lunch',
        food: ['burger'],
        date: '2022-04-15T21:16:35.463Z',
        painLevel: 8,
      },
      {
        mealType: 'lunch',
        food: ['crisps'],
        date: '2022-04-15T21:16:35.463Z',
        painLevel: 4,
      },
    ];
    const dinnerArr = [
      {
        mealType: 'dinner',
        food: ['duck', 'rice', 'sweet and sour sauce'],
        date: '2022-04-13T19:53:13.071Z',
        painLevel: 4,
      },
      {
        mealType: 'dinner',
        food: ['burgers', 'chips'],
        date: '2022-04-15T21:16:35.463Z',
        painLevel: 9,
      },
    ];
    const averageBreakfastPainLevel = getAveragePainLevelFromMeals(breakfastArr);
    expect(averageBreakfastPainLevel).to.equal(2);

    const averageLunchPainLevel = getAveragePainLevelFromMeals(lunchArr);
    expect(averageLunchPainLevel).to.equal(4.33);

    const averageDinnerPainLevel = getAveragePainLevelFromMeals(dinnerArr);
    expect(averageDinnerPainLevel).to.equal(6.5);
  });
});

describe('getUserPainLevelByTimePeriod', () => {
  const allMeals = {
    _id: '62572a29fc9cde321abc5c5c',
    user: '6255d369e90d08cdd8567704',
    meals: [
      {
        mealType: 'dinner',
        food: [Array],
        date: '2022-04-13T19:53:13.071Z',
        painLevel: 4,
      },
      {
        mealType: 'breakfast',
        food: [Array],
        date: '2022-04-13T19:53:27.603Z',
        painLevel: 2,
      },
      {
        mealType: 'lunch',
        food: [Array],
        date: '2022-04-13T19:53:38.662Z',
        painLevel: 4,
      },
      {
        mealType: 'breakfast',
        food: [Array],
        date: '2022-04-15T09:59:40.972Z',
        painLevel: 1,
      },
      {
        mealType: 'dinner',
        food: [Array],
        date: '2022-04-15T21:16:35.463Z',
        painLevel: 9,
      },
      {
        mealType: 'lunch',
        food: [Array],
        date: '2022-04-17T14:25:09.820Z',
        painLevel: 5,
      },
    ],
  };
  it('returns correct data type and object with 7 keys for passed time period of week', () => {
    const time = 'week';
    const painLevelPerTimePeriod = getUserPainLevelByTimePeriod(allMeals, time);

    // eslint-disable-next-line no-unused-expressions
    expect(typeof painLevelPerTimePeriod === 'object').to.be.true;
    const objectKeys = Object.keys(painLevelPerTimePeriod);
    expect(objectKeys.length).to.equal(7);
  });
  it('returns object with 7 keys for passed time period of month', () => {
    const time = 'month';
    const painLevelPerTimePeriod = getUserPainLevelByTimePeriod(allMeals, time);

    const objectKeys = Object.keys(painLevelPerTimePeriod);
    expect(objectKeys.length).to.equal(31);
  });
  it('returns object with 7 keys for passed time period of year', () => {
    const time = 'year';
    const painLevelPerTimePeriod = getUserPainLevelByTimePeriod(allMeals, time);

    const objectKeys = Object.keys(painLevelPerTimePeriod);
    expect(objectKeys.length).to.equal(365);
  });
});

describe('getMealCausingMostPain', () => {
  it('returns most common element in array', () => {
    const foodArray = [
      {
        food: ['duck', 'rice', 'sweet and sour sauce'],
        painLevel: 4,
      },
      {
        food: ['smoothie'],
        painLevel: 2,
      },
      {
        food: ['chicken', 'rice'],
        painLevel: 4,
      },
      {
        food: ['smoothie'],
        painLevel: 1,
      },
      {
        food: ['burgers', 'chips'],
        painLevel: 9,
      },
      {
        food: ['peri wings', 'fris'],
        painLevel: 5,
      },
      {
        food: ['smoothie'],
        painLevel: 1,
      },
      {
        food: ['chicken'],
        painLevel: 2,
      },
      {
        food: ['burgers', 'chips'],
        painLevel: 7,
      },
      {
        food: ['pizza'],
        painLevel: 6,
      },
      {
        food: ['curry'],
        painLevel: 8,
      },
      {
        food: ['rice'],
        painLevel: 4,
      },
      {
        food: ['curry', 'rice', 'lamb chops'],
        painLevel: 8,
      },
      {
        food: ['curry', 'rice', 'naan bread'],
        painLevel: 9,
      },
    ];
    const numberArray = [
      {
        food: [1, 2, 3, 3, 9],
        painLevel: 8,
      },
      {
        food: [2, 3, 3, 9, 9],
        painLevel: 9,
      },
      {
        food: [9, 9, 9, 9],
        painLevel: 7,
      },
    ];
    const food = getMealCausingMostPain(foodArray);
    const numbers = getMealCausingMostPain(numberArray);

    expect(food).to.equal('curry');
    expect(numbers).to.equal(3);
  });
});
