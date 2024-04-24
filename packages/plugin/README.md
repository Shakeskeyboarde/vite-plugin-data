# Vite Plugin Data

This plugin resolves the exports of `*.data.{js,ts}` files at build time, and then replaces the original file source with only the resolved exports.

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

Create data files with exports that should be resolved at build-time.

Example: `timestamp.data.ts`

```ts
export const timestamp = Date.now();
```

The bundled content from this file will be equivalent to the following, where the actual timestamp value was the result of `Date.now()` at build-time.

```ts
export const timestamp = 1634160000000;
```

Top-level awaits are supported, even if the Vite configuration `target` does not support them.

## Limitations

The resolved exports must be JSON-serializable. This plugin will raise an error if the exports contain any non-JSON-serializable values.
