import path from 'node:path';

import { build, mergeConfig, type ModuleNode, normalizePath, type Rollup, type UserConfig } from 'vite';
import { expect, test, vi } from 'vitest';

import { type Options, plugin } from '../plugin.js';

// Spy on the load module without changing its behavior.
vi.mock('./load.js', async (importOriginal) => {
  const { load, ...rest }: any = await importOriginal();
  return { ...rest, load: vi.fn(load) };
});

// Spy on the Vite API without changing its behavior.
vi.mock('vite', async (importOriginal) => {
  const { build: viteBuild, ...rest }: any = await importOriginal();
  return { ...rest, build: vi.fn(viteBuild) };
});

const buildWithPlugin = async (
  entry: string,
  options?: Options,
  buildConfig: UserConfig = {},
): Promise<Rollup.OutputChunk> => {
  const outputs = await build(mergeConfig(buildConfig, {
    root: __dirname,
    logLevel: 'silent',
    plugins: [plugin(options)],
    build: {
      write: false,
      minify: false,
      target: 'esnext',
      lib: { entry: path.resolve(__dirname, entry), formats: ['es'] },
      rollupOptions: { treeshake: false },
    },
  }));

  const { output: [chunk] } = Array.isArray(outputs) ? outputs[0]! : outputs as Rollup.RollupOutput;

  return chunk;
};

test('compiles to static exports', async () => {
  const chunk = await buildWithPlugin('./src/demo.data.ts');

  expect(chunk.code).toMatchInlineSnapshot(`
    "const demo_data = "default-string";
    const imported = "imported-string";
    const named = "named-string";
    const promised = Promise.resolve("promised-string");
    const read = Promise.resolve("read-string");

    export { demo_data as default, imported, named, promised, read };
    "
  `);
});

test('ignores modules that do not have a data loader extension', async () => {
  const chunk = await buildWithPlugin('./src/not-a-loader.ts');

  expect(chunk.code).toMatchInlineSnapshot(`
    "const notALoader = () => {
      return "Functions are not JSON-safe, so this was not treated as a data loader.";
    };

    export { notALoader as default };
    "
  `);
});

test('ignores data loaders in node_modules', async () => {
  const chunk = await buildWithPlugin('./src/node_modules/not-a-loader.ts');

  expect(chunk.code).toMatchInlineSnapshot(`
    "const notALoader = () => {
      return "Functions are not JSON-safe, so this was not treated as a data loader.";
    };

    export { notALoader as default };
    "
  `);
});

test('ignores data loaders matching an ignore pattern', async () => {
  const chunk = await buildWithPlugin('./src/ignored.data.ts', {
    ignore: ['./src/*ignored*'],
  });

  expect(chunk.code).toMatchInlineSnapshot(`
    "const ignored_data = () => {
      return "Functions are not JSON-safe, so this was not treated as a data loader.";
    };

    export { ignored_data as default };
    "
  `);
});

test('merges user provided Vite config into the internal config', async () => {
  await buildWithPlugin(
    './src/demo.data.ts',
    // Plugin Options
    { config: { resolve: { alias: { foo: 'FOO' } } } as UserConfig },
    // Build Config
    { resolve: { alias: { bar: 'BAR' } } } as UserConfig,
  );

  const lastConfig: any = vi.mocked(build).mock.calls.at(-1)?.at(0);

  expect(lastConfig.root).toBe(__dirname);
  expect(lastConfig.resolve.alias).toEqual(expect.arrayContaining([{ find: 'foo', replacement: 'FOO' }, { find: 'bar', replacement: 'BAR' }]));
});

test('handleHotUpdate invalidates data loader module when dependencies are modified', async () => {
  const instance = plugin();
  const entryId = normalizePath(path.resolve(__dirname, './src/demo.data.ts'));
  const someOtherModule = { file: '/some/other/module.ts' } as ModuleNode;
  const entryModule = { file: entryId } as ModuleNode;

  instance.configResolved({
    root: __dirname,
    logger: { info: vi.fn() },
    logLevel: 'silent',
    resolve: { alias: [] },
  });

  await instance.load(normalizePath(path.resolve(__dirname, './src/demo.data.ts')));

  const simulateHotUpdate = (file: string): ModuleNode[] => {
    return instance.handleHotUpdate({
      file: normalizePath(path.resolve(__dirname, file)),
      modules: [someOtherModule],
      server: {
        moduleGraph: {
          getModuleById(id: string) {
            return id === entryId ? entryModule : undefined;
          },
        },
      },
    });
  };

  expect(simulateHotUpdate('./src/demo.data.ts')).toStrictEqual([someOtherModule, entryModule]);
  expect(simulateHotUpdate('./src/to-be-imported.ts')).toStrictEqual([someOtherModule, entryModule]);
  expect(simulateHotUpdate('./src/data.txt')).toStrictEqual([someOtherModule, entryModule]);
  expect(simulateHotUpdate('./src/not-a-dependency.ts')).toStrictEqual([someOtherModule]);
});
