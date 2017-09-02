# graphql-mask

[![CircleCI][build-badge]][build]
[![npm package][npm-badge]][npm]

Graphql Mask is a simple utility for removing everything in a query that is not defined in a schema. Use it the same way you would use the library function for `graphql-js` e.g. `graphqlMask(schema, query)` but instead of getting back results, you will get back a trimmed down query.

[build-badge]: https://circleci.com/gh/:owner/:repo.svg?style=shield&circle-token=:circle-token

[build]: 
https://circleci.com/gh/brysgo/graphql-mask

[npm-badge]: https://img.shields.io/npm/v/npm-package.png?style=flat-square
[npm]: https://www.npmjs.org/package/graphql-mask