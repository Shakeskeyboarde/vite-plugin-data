# Contributing

Thanks for your interest in contributing to this project! We welcome any contributions, including bug reports, feature requests, questions, discussions, code, documentation, tests, or anything else that you think would improve the project.

PRs for bug fixes can be submitted directly, but PRs for new features should be discussed in an issue first.

Before you get started, please read the following guidelines.

## Setup

1. Fork the repository on GitHub and clone your fork to your local machine.
2. Run `corepack enable` at the repo root to enable Corepack and PNPM. This repo is a PNPM monorepo, so all package manager commands will be PNPM commands.
3. Run `pnpm install` at the repo root to restore all dependencies.
4. Run `pnpm build` at the repo root to build all packages.
5. Run `pnpm test` at the repo root to run all tests.

## Style

Please use the following style guide when contributing to this project.

- Use 2 spaces for indentation.
- Use single quotes for strings.
- Use `camelCase` for variable and function names.
- Use `PascalCase` for class names.
- Use `kebab-case` for filenames.
  - Name the file after the class or function it exports.
  - Export only one class or function per file.
  - Exporting supporting types is also fine.
- Wrap all code at 120 characters (max).
- Use Expect (instead of Assert) syntax for tests.

This project uses ESLint to check style, but not all rules are strictly enforced, and you should use your best judgment when contributing.

If you use VSCode (recommended), you can install the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) to get real-time feedback on your code.

Useful VSCode [Project Settings](.vscode/settings.json):

```json
{
  "explorer.excludeGitIgnore": true,
  "eslint.format.enable": true,
  "editor.defaultFormatter": "dbaeumer.vscode-eslint",
  "editor.tabSize": 2,
}
```

## Test

Please add/modify tests for any code changes you make. Generally, we want test files to be fairly self contained, so please keep any utilities, fixtures, or constants in the same file as the tests that use them. Test files should be placed in the `__tests__` directory.

## Merge

Once you open a PR, it will be reviewed by a maintainer. If the PR is approved, it will be merged. If the PR is not approved, the maintainer will leave a comment explaining why, and possible changes that could be made to get the PR approved.

After the PR is merged, it will be released in the next version of the project. The next version may not be released immediately, and it may contain changes for several PRs. We will try to release new version in a timely manner.
