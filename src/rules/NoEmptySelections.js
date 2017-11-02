var _error = require("graphql/error");

function noEmptySelectionMessage(parentNodeName, parentNodeType) {
  return `${parentNodeType} "${parentNodeName}" has an empty selection.`;
}

/**
 * No empty selections
 *
 * A GraphQL document is only valid if all selections contain
 * at least one field.
 */
function NoEmptySelections(context) {
  return {
    SelectionSet(node, key, parent) {
      if (node.selections.length === 0) {
        let name;
        if (parent.name) {
          name = parent.name.value;
        } else {
          name = "InlineFragment";
        }
        context.reportError(
          new _error.GraphQLError(noEmptySelectionMessage(name, parent.kind), [
            parent,
            node
          ])
        );
      }
    }
  };
}

module.exports = NoEmptySelections;
