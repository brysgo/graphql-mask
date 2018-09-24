# graphql-mask

[![Greenkeeper badge](https://badges.greenkeeper.io/brysgo/graphql-mask.svg)](https://greenkeeper.io/)

[![CircleCI][build-badge]][build]
[![npm package][npm-badge]][npm]
[![npm downloads][npm-downloads-badge]][npm]

Graphql Mask is a simple utility for removing everything in a query (or its variables) that is not defined in a schema. Use it by passing in an arguments object containing the schema to mask against, the query to be masked, and optionally, the variables to be masked:

```
const { maskedQuery, maskedVariables } = graphqlMask({schema, query, variables});
```

## Usage

```bash
$ npm install graphql-mask
# or
$ yarn add graphql-mask
```

Filtering a query:

```
const graphqlMask = require("graphql-mask");
// const graphqlMask = require("graphql-mask/es5"); if you need to use this in a browser

const { maskedQuery } = graphqlMask({
  schema: `
    type Query {
      something: String!
      somethingElse: Int
    }
  `,
  query: `
    query ExampleQuery {
      something
      somethingElse
      somethingNotInSchema
    }
  `}
})

console.log(maskedQuery)
```

This will print...

```graphql
query ExampleQuery {
  something
  somethingElse
}
```

Since GraphQL 14 now supports the extension of `input` types, you can now use `grapqhl-mask` to filter input variables as well:

```
const { maskedQuery, maskedVariables } = graphqlMask({
  schema: `
    type Query {
      something: String!
    }

    type Mutation {
      mutateSomething(something: SomethingInput): SomethingOutput
    }

    input SomethingInput {
      thisThing: String
    }

    type SomethingOutput {
      thisThing: String
    }
  `,
  query: `
    mutation ExampleMutation($something: SomethingInput) {
      mutationSomething(something: $something) {
        thisThing
        thatThing
      }
    }
  `,
  variables: {
    something: {
      thisThing: "Apple",
      thatThing: "Orange"
    }
  }
});

console.log(maskedQuery)
console.log(maskedVariables);
```

This will print...

```graphql
mutation ExampleMutation($something: SomethingInput) {
  mutationSomething(something: $something) {
    thisThing
  }
}
```

and

```
{
  something: {
    thisThing: "Apple",
  }
}
```

# Deprecated usage

To support filtering of both query and input variables, the following usage has been deprecated as of v0.1.0. This method of invoking `graphql-mask` is still supported, but wil result in warning messages.

```
const result = graphqlMask(`
  type Query {
    something: String!
    somethingElse: Int
  }
`,`
  query ExampleQuery {
    something
    somethingElse
    somethingNotInSchema
  }
`)

console.log(result)
```

This will print...

```graphql
query ExampleQuery {
  something
  somethingElse
}
```

[build-badge]: https://circleci.com/gh/brysgo/graphql-mask.svg?style=shield
[build]: https://circleci.com/gh/brysgo/graphql-mask
[npm-badge]: https://img.shields.io/npm/v/graphql-mask.png?style=flat-square
[npm]: https://www.npmjs.org/package/graphql-mask
[npm-downloads-badge]: https://img.shields.io/npm/dt/graphql-mask.svg
