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

var existingFragmentDefinitions;
var usedFragments;
var markedForRemovalThisPass;

function markForRemoval(node) {
  markedForRemovalThisPass++;
  return (node.markedForRemoval = true);
}
function markedForRemoval(node) {
  return node.markedForRemoval;
}
function markNode(node, typeInfo) {
  var parentType = typeInfo.getParentType();
  var type = typeInfo.getType();
  var inputType = typeInfo.getInputType();

  if (!node) return;
  switch (node.kind) {
    case "Document":
      if (node.definitions.every(markedForRemoval)) markForRemoval(node);
      break;
    case "SelectionSet":
      if (node.selections.every(markedForRemoval)) markForRemoval(node);
      break;
    case "FragmentSpread":
      usedFragments[node.name.value] = true;
      break;
    case "FragmentDefinition":
      if (!node.selectionSet || node.selectionSet.markedForRemoval) {
        markForRemoval(node);
      } else if (!node.markedForRemoval) {
        existingFragmentDefinitions[node.name.value] = true;
      }
      break;
    case "Field":
      if (!type) markForRemoval(node);
      if (
        !isLeafType(getNamedType(type)) &&
        (!node.selectionSet || node.selectionSet.markedForRemoval)
      )
        markForRemoval(node);
      break;
    case "OperationDefinition":
      if (!type) {
        markForRemoval(node);
      }
    case "InlineFragment":
      if (!node.selectionSet || node.selectionSet.markedForRemoval) {
        markForRemoval(node);
      }
      break;
    case "Argument":
      if (!inputType) markForRemoval(node);
      break;
  }
}

module.exports = function graphqlMask(schema, query) {
  var astSchema =
    typeof schema === "string" ? buildASTSchema(parse(schema)) : schema;
  var typeInfo = new TypeInfo(astSchema);
  var incrementalAst = parse(query);
  do {
    markedForRemovalThisPass = 0;
    existingFragmentDefinitions = {};
    usedFragments = {};
    incrementalAst = visit(
      incrementalAst,
      visitWithTypeInfo(typeInfo, {
        enter: function(node, key, siblings, path, ancestors) {
          markNode(node, typeInfo);
        },
        leave: function(node, key, siblings, path, ancestors) {
          switch (node.kind) {
            case "FragmentSpread":
              if (!existingFragmentDefinitions[node.name.value])
                markForRemoval(node);
              break;
            case "FragmentDefinition":
              if (!usedFragments[node.name.value]) markForRemoval(node);
              break;
          }

          if (node.markedForRemoval) {
            return null;
          }
        }
      })
    );
  } while (markedForRemovalThisPass > 0);
  return print(incrementalAst);
};
