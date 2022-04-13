const { checkIfDetailsChanged } = require('../../../src/utils/helpers');

describe('checkIfDetailsChanged', () => {
  it('returns object of updated details when comparing 2 arrays', () => {
    const newObject = checkIfDetailsChanged({ name: "Dan", age: 26 }, { name: "Cloe", age: 23 });
    expect(newObject).to.include.keys('name', 'age');
    expect(newObject.name).to.include.keys('from', 'to');
    expect(newObject.age).to.include.keys('from', 'to');
    expect(newObject.name.from).to.equal('Dan');
    expect(newObject.age.from).to.equal(26);
    expect(newObject.name.to).to.equal('Cloe');
    expect(newObject.age.to).to.equal(23);
  });
});
