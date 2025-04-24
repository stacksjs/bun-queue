<p align="center"><img src=".github/art/cover.jpg" alt="Social Card of this repo"></p>

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
<!-- [![npm downloads][npm-downloads-src]][npm-downloads-href] -->
<!-- [![Codecov][codecov-src]][codecov-href] -->

# bun-ts-starter

This is an opinionated TypeScript Starter kit to help kick-start development of your next Bun package.

## Features

This Starter Kit comes pre-configured with the following:

- 🛠️ [Powerful Build Process](https://github.com/oven-sh/bun) - via Bun
- 💪🏽 [Fully Typed APIs](https://www.typescriptlang.org/) - via TypeScript
- 📚 [Documentation-ready](https://vitepress.dev/) - via VitePress
- ⌘ [CLI & Binary](https://www.npmjs.com/package/bunx) - via Bun & CAC
- 🧪 [Built With Testing In Mind](https://bun.sh/docs/cli/test) - pre-configured unit-testing powered by [Bun](https://bun.sh/docs/cli/test)
- 🤖 [Renovate](https://renovatebot.com/) - optimized & automated PR dependency updates
- 🎨 [ESLint](https://eslint.org/) - for code linting _(and formatting)_
- 📦️ [pkg.pr.new](https://pkg.pr.new) - Continuous (Preview) Releases for your libraries
- 🐙 [GitHub Actions](https://github.com/features/actions) - runs your CI _(fixes code style issues, tags releases & creates its changelogs, runs the test suite, etc.)_

## Get Started

It's rather simple to get your package development started:

```bash
# you may use this GitHub template or the following command:
bunx degit stacksjs/ts-starter my-pkg
cd my-pkg

bun i # install all deps
bun run build # builds the library for production-ready use

# after you have successfully committed, you may create a "release"
bun run release # automates git commits, versioning, and changelog generations
```

_Check out the package.json scripts for more commands._

## Testing

```bash
bun test
```

## Changelog

Please see our [releases](https://github.com/stackjs/bun-ts-starter/releases) page for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](.github/CONTRIBUTING.md) for details.

## Community

For help, discussion about best practices, or any other conversation that would benefit from being searchable:

[Discussions on GitHub](https://github.com/stacksjs/ts-starter/discussions)

For casual chit-chat with others using this package:

[Join the Stacks Discord Server](https://discord.gg/stacksjs)

## Postcardware

“Software that is free, but hopes for a postcard.” We love receiving postcards from around the world showing where Stacks is being used! We showcase them on our website too.

Our address: Stacks.js, 12665 Village Ln #2306, Playa Vista, CA 90094, United States 🌎

## Sponsors

We would like to extend our thanks to the following sponsors for funding Stacks development. If you are interested in becoming a sponsor, please reach out to us.

- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## License

The MIT License (MIT). Please see [LICENSE](LICENSE.md) for more information.

Made with 💙

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/bun-ts-starter?style=flat-square
[npm-version-href]: https://npmjs.com/package/bun-ts-starter
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/stacksjs/ts-starter/ci.yml?style=flat-square&branch=main
[github-actions-href]: https://github.com/stacksjs/ts-starter/actions?query=workflow%3Aci

<!-- [codecov-src]: https://img.shields.io/codecov/c/gh/stacksjs/ts-starter/main?style=flat-square
[codecov-href]: https://codecov.io/gh/stacksjs/ts-starter -->
