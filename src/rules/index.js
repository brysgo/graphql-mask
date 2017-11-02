module.exports = [].concat.apply(
  [require("./NoEmptySelections"), require("./UnsupportedOperation")],
  require("graphql/validation").specifiedRules
);
