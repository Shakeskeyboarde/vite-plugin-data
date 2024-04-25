# Vite Plugin Data

A Vite plugin that resolves the exports of data loader files at build-time and replaces the original file source with the pre-resolved exports.

A "data loader" file is a source file with one of the following extensions:

- `.data.js`
- `.data.cjs`
- `.data.mjs`
- `.data.ts`
- `.data.cts`
- `.data.mts`

## Getting Started

Install the plugin.

```bash
npm install --save-dev vite-plugin-data
```

Add the plugin to your Vite configuration.

```ts
import data from 'vite-plugin-data';

export default defineConfig({
  plugins: [
    data(),
  ],
});
```

Create a data loader with exports that should be resolved at build-time.

Example: `timestamp.data.ts`

```ts
export const timestamp = Date.now();
```

The bundled content from this file will be equivalent to the following, where the actual timestamp value was the result of `Date.now()` at build-time.

```ts
export const timestamp = 1634160000000;
```

Import the the data loader just like any other source file. No special handling is required for Typescript, because the export types are the same.

```ts
import { timestamp } from './timestamp.data.js';

console.log(timestamp);
```

## Plugin Options

### ignore

Ignore file patterns which should not be treated as data loaders.

```ts
data({
  // Ignore all test files.
  ignore: ['**/*.@(spec|test).*']
});
```

> NOTE: Files inside `node_modules` directories are always ignored.

## Adding Watch Patterns

Sometimes your data loaders may depend on other files. If those other files change, the data loader should also be considered changed for the purposes of HMR. You can provide watch patterns (globs) using a configuration comment in the data file. All paths must use forward slashes. Relative paths are relative to the data file containing the comment.

```ts
/* vite-plugin-data {
  watch: ["./*.json"]
} */
```

The JSON object which follows the `vite-plugin-data` comment keyword is parsed as [Relaxed JSON (aka: RJSON)](https://www.relaxedjson.org/). The most important differences are that simple keys and values do not need to be quoted, and single (`'`) or backtick (`` ` ``) quotes can be used in place of double quotes (`"`) when necessary.

> NOTE: Data loader imports are not automatically watched. You must watch them explicitly.

## Limitations

### JSON-Safe Exports

Data loader resolved exports must be JSON-safe values or _promises_ for JSON-safe values.

JSON-safe values include the following types:

- Any primitive
- Any value with a `toJSON` method
- Any object that is not a class instance and contains only JSON-safe values
- Any array that contains only JSON-safe values

Exported promises are awaited at build-time. The resolved value is injected into the bundle wrapped in a pre-resolved promise (eg. `Promise.resolve(<value>)`). This allows for asynchronous data loading at build-time in contexts where [top-level awaits](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await#top_level_await) are not supported (eg. CommonJS modules).

## Side Effects

Data loader files are resolved at build-time to JSON-compatible data. The bundle only contains the resolved data, not the module implementation that created it. Therefore, data loaders cannot have runtime side-effects and are marked as side-effect-free and tree-shakable in the Vite build.
