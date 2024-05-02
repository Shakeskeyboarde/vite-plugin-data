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
import { data } from 'vite-plugin-data';

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

### config

A Vite configuration (`UserConfig`) object that is used to transpile/bundle data loaders. By default, the plugin uses an internal Vite configuration that only inherits the `root` and `resolve.alias` options from parent configuration.

```ts
data({
  // Custom Vite configuration used to transpile/bundle data loaders.
  config: {
    build: {
      target: 'node20',
    },
  },
});
```

## Data Loader Dependencies

Data loaders may use file system resources that are not imported or required. These dependencies can't be detected automatically by Vite, so they must be defined explicitly. This is done using a special configuration comment in a data loader file.

Here's an example of a data loader that reads the contents of a text file.

```ts
/* vite-plugin-data {
  dependencies: ["./data.txt"]
} */

const text = await fs.readFile(path.resolve(__dirname, './data.txt'), 'utf8');
```

The configuration comment is always a block comment, that starts with the `vite-plugin-data` prefix, followed by a JSON-like configuration object. The `dependencies` property is an array of glob patterns that the data loader depends on.

> NOTE: Relative paths must start with a dot (`.`) and are relative to the data loader directory (`__dirname`), just like a relative import/require path would be.

> NOTE: The JSON-like configuration value is parsed as [Relaxed JSON (aka: RJSON)](https://www.relaxedjson.org/). The most important differences are that simple keys and values do not need to be quoted, and single (`'`) or backtick (`` ` ``) quotes can be used in place of double quotes (`"`) when necessary.

> NOTE: The `dependencies` configuration only works if the paths are watched by Vite. Vite only watches the [root](https://vitejs.dev/config/shared-options.html#root) directory. This plugin does _not_ watch any additional paths. If your data loader has dependencies outside of the root, then you will need to use a custom configuration and/or additional plugins to add additional paths to the watcher so that HMR is aware of changes to those dependency files.

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

Data loaders are not tree-shaken at build-time, so they can have build-time
side-effects.

However, the final bundle does not contain the data loader source, only its static exports. So, data loaders cannot have runtime side-effects. As such, the transpiled data is marked as side-effect-free and can be tree-shaken out of the
final bundle.

## API

In addition to the Vite plugin, the following exports are also available.

### `load`

Get the exports of a data loader. This will bundle the data loader and import
the bundle entrypoint.

Signature:

```ts
async function load(filename: string, config?: UserConfig): Promise<Result>;
```

Example:

```ts
import { load } from 'vite-plugin-data';

const {
  exports,
  dependencies,
  dependencyPatterns
} = await load('./timestamp.data.js', {
  // Optional Vite config for data loader bundling.
});
```

Returns:

- `exports`
  - Result of importing the data loader bundle.
- `dependencies`
  - Absolute paths of all modules included in the data loader bundle.
- `dependencyPatterns`
  - Normalized dependency patterns defined in the data loader configuration comment.