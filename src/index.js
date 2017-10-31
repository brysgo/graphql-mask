// @flow

var graphqlLanguage = require("graphql/language"),
  parse = graphqlLanguage.parse,
  visit = graphqlLanguage.visit,
  visitWithTypeInfo = graphqlLanguage.visitWithTypeInfo,
  print = graphqlLanguage.print;

var graphqlType = require("graphql/type"),
  isLeafType = graphqlType.isLeafType,
  getNamedType = graphqlType.getNamedType;

var graphqlUtilities = require("graphql/utilities"),
  TypeInfo = graphqlUtilities.TypeInfo,
  buildASTSchema = graphqlUtilities.buildASTSchema;

var removedFragmentDefinitions = {};

function markedForRemoval(node) {
  return node.markedForRemoval;
}
function markAncestors(ancestors, type) {
  ancestors.some(function(node, type) {
    markNode(node, type);
    return !node.markedForRemoval;
  });
}
function markNode(node, type) {
  if (!node) return;
  switch (node.kind) {
    case "Document":
      if (node.definitions.every(markedForRemoval))
        node.markedForRemoval = true;
      break;
    case "SelectionSet":
      if (node.selections.every(markedForRemoval)) node.markedForRemoval = true;
      break;
    case "FragmentSpread":
      break;
    case "FragmentDefinition":
      if (!node.selectionSet || node.selectionSet.markedForRemoval) {
        removedFragmentDefinitions[node.name.value] = true;
        node.markedForRemoval = true;
      }
      break;
    case "Field":
      if (isLeafType(getNamedType(type))) break;
    case "OperationDefinition":
    case "InlineFragment":
      if (!node.selectionSet || node.selectionSet.markedForRemoval) {
        node.markedForRemoval = true;
      }
      break;
  }
}

module.exports = function graphqlMask(schema, query) {
  var astSchema =
    typeof schema === "string" ? buildASTSchema(parse(schema)) : schema;
  var typeInfo = new TypeInfo(astSchema);
  return print(
    visit(
      visit(
        parse(query),
        visitWithTypeInfo(typeInfo, {
          enter: function(node, key, siblings, path, ancestors) {
            var parentType = typeInfo.getParentType();
            var type = typeInfo.getType();
            var inputType = typeInfo.getInputType();
            switch (node.kind) {
              case "Field":
              case "OperationDefinition":
                if (!type) {
                  node.markedForRemoval = true;
                  if (siblings[siblings.length - 1] === node) {
                    markAncestors(ancestors, type);
                  }
                }
                break;
              case "Argument":
                if (!inputType) node.markedForRemoval = true;
                break;
            }
          },
          leave: function(node, key, siblings, path, ancestors) {
            var type = typeInfo.getType();

            markNode(node, type);
          }
        })
      ),
      {
        leave: function(node, key, siblings, path, ancestors) {
          if (node.markedForRemoval) {
            return null;
          }

          switch (node.kind) {
            case "FragmentSpread":
              if (removedFragmentDefinitions[node.name.value]) return null;
              break;
          }
        }
      }
    )
  );
};
