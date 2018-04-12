var _error = require("graphql/error");

function noUnknownInputTypeMessage(operationName, inputType) {
  return `${operationName} has unknown input type: ${inputType}`;
}

/**
 * No unknown input types
 *
 * A query and/or mutation should have a defined input type if not a primitive
 */

function NoUnknownInputTypes(context) {
  return {
    OperationDefinition(node) {
      if (node.variableDefinitions.length > 0) {
        node.variableDefinitions.forEach(def => {
          if (def.type.type) {
            const type = def.type.type;
            if (!context._schema._typeMap[type.name.value]) {
              context.reportError(
                new _error.GraphQLError(
                  noUnknownInputTypeMessage(node.name.value, type),
                  [node]
                )
              );
            }
          }
        });
      }
    }
  };
}

module.exports = NoUnknownInputTypes;
