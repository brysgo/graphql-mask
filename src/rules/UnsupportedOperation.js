var _error = require("graphql/error");

var _definition = require("graphql/type/definition");

function unsupportedOperationMessage(operationName) {
  let message = `Schema does not support "${operationName}". Declare the "${operationName}" type or add it to schema definition.`;
  return message;
}

/**
 * Unsupported operation
 *
 * An operation can only be performed on a schema if it is defined.
 */

function UnsupportedOperation(context) {
  return {
    OperationDefinition(node) {
      const type = context.getType();
      if (!type) {
        context.reportError(
          new _error.GraphQLError(
            unsupportedOperationMessage(node.name.value),
            [node]
          )
        );
      }
    }
  };
}

module.exports = UnsupportedOperation;
