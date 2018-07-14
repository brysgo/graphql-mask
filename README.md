# graphql-mask

[![Greenkeeper badge](https://badges.greenkeeper.io/brysgo/graphql-mask.svg)](https://greenkeeper.io/)

[![CircleCI][build-badge]][build]
[![npm package][npm-badge]][npm]
[![npm downloads][npm-downloads-badge]][npm]

Graphql Mask is a simple utility for removing everything in a query that is not defined in a schema. Use it the same way you would use the library function for `graphql-js` e.g. `graphqlMask(schema, query)` but instead of getting back results, you will get back a trimmed down query.

## Usage

```bash
$ npm install graphql-mask
# or 
$ yarn add graphql-mask
```

```
const graphqlMask = require("graphql-mask");
// const graphqlMask = require("graphql-mask/es5"); if you need to use this in a browser

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

[build]: 
https://circleci.com/gh/brysgo/graphql-mask

[npm-badge]: https://img.shields.io/npm/v/graphql-mask.png?style=flat-square
[npm]: https://www.npmjs.org/package/graphql-mask
[npm-downloads-badge]:https://img.shields.io/npm/dt/graphql-mask.svg
