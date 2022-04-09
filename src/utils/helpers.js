exports.checkIfDetailsChanged = async (oldDetails, newDetails) => {
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
