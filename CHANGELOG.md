[Compare changes](https://github.com/stacksjs/bun-queue/compare/v0.1.0...v0.1.1)

## 🚀 Features

- add useHead page titles across all devtools pages ([e0f18a4](https://github.com/stacksjs/bun-queue/commit/e0f18a4)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **devtools**: add EmptyState component for table/list empty states ([89f70b2](https://github.com/stacksjs/bun-queue/commit/89f70b2)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- use file-based dynamic routes for detail pages ([86857b2](https://github.com/stacksjs/bun-queue/commit/86857b2)) _(by glennmichael123 <gtorregosa@gmail.com>)_

## 🐛 Bug Fixes

- **pkg**: resolve @stacksjs/bun-queue exports to built dist ([3a3e281](https://github.com/stacksjs/bun-queue/commit/3a3e281)) _(by Chris <chrisbreuer93@gmail.com>)_
- **scripts**: stop double-generating CHANGELOG on release ([8f0da90](https://github.com/stacksjs/bun-queue/commit/8f0da90)) _(by Glenn Michael Torregosa <gtorregosa@gmail.com>)_
- restore docs content deleted by pickier --fix ([7bcaab8](https://github.com/stacksjs/bun-queue/commit/7bcaab8)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- add setup-bun to publish-commit job ([d999f31](https://github.com/stacksjs/bun-queue/commit/d999f31)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- resolve lint errors ([b47e7c8](https://github.com/stacksjs/bun-queue/commit/b47e7c8)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- make store exports callable (Pinia composable pattern) ([ceddd5d](https://github.com/stacksjs/bun-queue/commit/ceddd5d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- use @/ import paths for functions (not relative) ([ac213f0](https://github.com/stacksjs/bun-queue/commit/ac213f0)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- scan partials and components in crosswind config ([a61d48e](https://github.com/stacksjs/bun-queue/commit/a61d48e)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **devtools**: update crosswind content path to pages/ ([52263f8](https://github.com/stacksjs/bun-queue/commit/52263f8)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- chain pantry publish:commit calls for single-arg CLI ([75d53da](https://github.com/stacksjs/bun-queue/commit/75d53da)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **devtools**: use :show and :if instead of @show and @if ([bc01844](https://github.com/stacksjs/bun-queue/commit/bc01844)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **devtools**: use @if directive instead of :if for conditionals ([b4fea1f](https://github.com/stacksjs/bun-queue/commit/b4fea1f)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- restructure devtools to root-level dirs and fix SPA navigation ([ae736b6](https://github.com/stacksjs/bun-queue/commit/ae736b6)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **devtools**: use @show directive instead of :show for visibility ([c37b22d](https://github.com/stacksjs/bun-queue/commit/c37b22d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **devtools**: guard canvas ref access for Chart.js pages ([897c227](https://github.com/stacksjs/bun-queue/commit/897c227)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- Bun Redis client compatibility — replace MULTI/EXEC with Lua EVAL ([33d6eb7](https://github.com/stacksjs/bun-queue/commit/33d6eb7)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- sidebar active link highlighting and scoped nav management ([7bc9e58](https://github.com/stacksjs/bun-queue/commit/7bc9e58)) _(by glennmichael123 <gtorregosa@gmail.com>)_

## ♻️ Code Refactoring

- replace inline fetch with shared stores ([71e3149](https://github.com/stacksjs/bun-queue/commit/71e3149)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- extract shared logic into functions/ and stores/ ([de5e211](https://github.com/stacksjs/bun-queue/commit/de5e211)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- replace data-stx-link with StxLink component ([bde86ef](https://github.com/stacksjs/bun-queue/commit/bde86ef)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- move router config to stx.config.ts, remove @stxRouter directive ([95970c0](https://github.com/stacksjs/bun-queue/commit/95970c0)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- remove HTML boilerplate from layouts — use auto-shell ([0be539f](https://github.com/stacksjs/bun-queue/commit/0be539f)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **devtools**: use stx serveApp() for full SPA pipeline ([fca3189](https://github.com/stacksjs/bun-queue/commit/fca3189)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **devtools**: migrate to @extends + @stxRouter SPA pattern ([f35caeb](https://github.com/stacksjs/bun-queue/commit/f35caeb)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **devtools**: migrate to stx v2 app shell for SPA navigation ([3ae9d71](https://github.com/stacksjs/bun-queue/commit/3ae9d71)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **devtools**: replace <a> tags with <StxLink> for router-managed navigation ([407959d](https://github.com/stacksjs/bun-queue/commit/407959d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **devtools**: extract shared functions into src/functions/ to eliminate duplication ([404d71a](https://github.com/stacksjs/bun-queue/commit/404d71a)) _(by glennmichael123 <gtorregosa@gmail.com>)_

## 📚 Documentation

- rewrite placeholder docs and add comprehensive API reference ([982bc81](https://github.com/stacksjs/bun-queue/commit/982bc81)) _(by glennmichael123 <gtorregosa@gmail.com>)_

## 🤖 Continuous Integration

- **buddy-bot**: add daily cleanup cron to workflow ([8644827](https://github.com/stacksjs/bun-queue/commit/8644827)) _(by Glenn Michael Torregosa <gtorregosa@gmail.com>)_
- **buddy-bot**: regenerate workflow from current template ([9d24e71](https://github.com/stacksjs/bun-queue/commit/9d24e71)) _(by Glenn Michael Torregosa <gtorregosa@gmail.com>)_
- drop redundant setup-bun (pantry installs bun via deps.yaml) ([31a431d](https://github.com/stacksjs/bun-queue/commit/31a431d)) _(by glennmichael123 <gtorregosa@gmail.com>)_

## 🧹 Chores

- release v0.1.1 ([d2b92f2](https://github.com/stacksjs/bun-queue/commit/d2b92f2)) _(by Chris <chrisbreuer93@gmail.com>)_
- upgrade to TypeScript 7 ([ed35015](https://github.com/stacksjs/bun-queue/commit/ed35015)) _(by Chris <chrisbreuer93@gmail.com>)_
- **config**: move stx.config.ts to config/stx.ts ([bd7c223](https://github.com/stacksjs/bun-queue/commit/bd7c223)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **config**: move crosswind.config.ts to config/crosswind.ts ([c305813](https://github.com/stacksjs/bun-queue/commit/c305813)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: upgrade @cwcss/crosswind to 0.2.6 ([76b8b30](https://github.com/stacksjs/bun-queue/commit/76b8b30)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: refresh bun.lock to pick up pickier 0.1.35 ([ed58d55](https://github.com/stacksjs/bun-queue/commit/ed58d55)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: refresh bun.lock to pick up pickier 0.1.33 ([b86627a](https://github.com/stacksjs/bun-queue/commit/b86627a)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: refresh bun.lock to pick up @stacksjs/logsmith 0.2.3 ([1ef47d8](https://github.com/stacksjs/bun-queue/commit/1ef47d8)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: refresh bun.lock to pick up buddy-bot 0.9.20 ([eae9cec](https://github.com/stacksjs/bun-queue/commit/eae9cec)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: bump better-dx to ^0.2.15 ([2e26491](https://github.com/stacksjs/bun-queue/commit/2e26491)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- switch lint scripts from eslint to pickier ([9289923](https://github.com/stacksjs/bun-queue/commit/9289923)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- refresh bun.lock to pick up bun-plugin-dtsx@0.9.18 ([39d33ac](https://github.com/stacksjs/bun-queue/commit/39d33ac)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- refresh bun.lock and apply pickier --fix ([01e0448](https://github.com/stacksjs/bun-queue/commit/01e0448)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- refresh bun.lock ([79b202b](https://github.com/stacksjs/bun-queue/commit/79b202b)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- refresh bun.lock to pick up latest pickier ([27ca53a](https://github.com/stacksjs/bun-queue/commit/27ca53a)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([4fda0ba](https://github.com/stacksjs/bun-queue/commit/4fda0ba)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- fresh install to pick up dtsx 0.9.14 and bunfig 0.15.9 ([cd5b52e](https://github.com/stacksjs/bun-queue/commit/cd5b52e)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- fresh install to pick up pickier 0.1.21 ([2e5ffb7](https://github.com/stacksjs/bun-queue/commit/2e5ffb7)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- gitignore pantry directory ([9617b07](https://github.com/stacksjs/bun-queue/commit/9617b07)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- minor updates ([3db5ed8](https://github.com/stacksjs/bun-queue/commit/3db5ed8)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- fix lint errors ([3ba0d8b](https://github.com/stacksjs/bun-queue/commit/3ba0d8b)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- minor updates ([5d6947e](https://github.com/stacksjs/bun-queue/commit/5d6947e)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- add css config path to stx.config.ts ([77b1ba1](https://github.com/stacksjs/bun-queue/commit/77b1ba1)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- add stx runtime type declarations ([70d86d3](https://github.com/stacksjs/bun-queue/commit/70d86d3)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: update all non-major dependencies (rebased) (#750) ([7981bfb](https://github.com/stacksjs/bun-queue/commit/7981bfb)) _(by [github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>](https://github.com/github-actions[bot]))_ ([#750](https://github.com/stacksjs/bun-queue/issues/750), [#750](https://github.com/stacksjs/bun-queue/issues/750))
- gitignore .output and .stx build artifacts ([325fb94](https://github.com/stacksjs/bun-queue/commit/325fb94)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([22514ce](https://github.com/stacksjs/bun-queue/commit/22514ce)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- fix lint errors ([93d529a](https://github.com/stacksjs/bun-queue/commit/93d529a)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- repo cleanup and modernization ([133ea09](https://github.com/stacksjs/bun-queue/commit/133ea09)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- use Pantry action for publish-commit and add job dependencies ([ee5f3db](https://github.com/stacksjs/bun-queue/commit/ee5f3db)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: update all non-major dependencies (rebased) (#749) ([769198c](https://github.com/stacksjs/bun-queue/commit/769198c)) _(by [github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>](https://github.com/github-actions[bot]))_ ([#749](https://github.com/stacksjs/bun-queue/issues/749), [#749](https://github.com/stacksjs/bun-queue/issues/749))
- wip ([bb5511b](https://github.com/stacksjs/bun-queue/commit/bb5511b)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([804036d](https://github.com/stacksjs/bun-queue/commit/804036d)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([3592d4b](https://github.com/stacksjs/bun-queue/commit/3592d4b)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- fix lint warnings ([fe7ddff](https://github.com/stacksjs/bun-queue/commit/fe7ddff)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- fix lint warnings ([12b664f](https://github.com/stacksjs/bun-queue/commit/12b664f)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- remove .pickierignore ([879a97e](https://github.com/stacksjs/bun-queue/commit/879a97e)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- update better-dx to ^0.2.7 ([f70b24c](https://github.com/stacksjs/bun-queue/commit/f70b24c)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- update CLAUDE.md with project context and crosswind details ([97dc4dd](https://github.com/stacksjs/bun-queue/commit/97dc4dd)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- add proper claude code guidelines ([234cf64](https://github.com/stacksjs/bun-queue/commit/234cf64)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- use pantry monorepo action instead of pantry-setup ([78eb523](https://github.com/stacksjs/bun-queue/commit/78eb523)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- ignore claude config in linter ([e581187](https://github.com/stacksjs/bun-queue/commit/e581187)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- add claude code guidelines ([bf8ae85](https://github.com/stacksjs/bun-queue/commit/bf8ae85)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([52bc411](https://github.com/stacksjs/bun-queue/commit/52bc411)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([032a98b](https://github.com/stacksjs/bun-queue/commit/032a98b)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: update all non-major dependencies (rebased) (#748) ([119c710](https://github.com/stacksjs/bun-queue/commit/119c710)) _(by [github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>](https://github.com/github-actions[bot]))_ ([#748](https://github.com/stacksjs/bun-queue/issues/748), [#748](https://github.com/stacksjs/bun-queue/issues/748))
- wip ([a5e1f6d](https://github.com/stacksjs/bun-queue/commit/a5e1f6d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([8335bc1](https://github.com/stacksjs/bun-queue/commit/8335bc1)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([4dc8ad1](https://github.com/stacksjs/bun-queue/commit/4dc8ad1)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([095a06c](https://github.com/stacksjs/bun-queue/commit/095a06c)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([948c459](https://github.com/stacksjs/bun-queue/commit/948c459)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([4239b10](https://github.com/stacksjs/bun-queue/commit/4239b10)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([291da0b](https://github.com/stacksjs/bun-queue/commit/291da0b)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([98dcb35](https://github.com/stacksjs/bun-queue/commit/98dcb35)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([f5f1238](https://github.com/stacksjs/bun-queue/commit/f5f1238)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([0defec8](https://github.com/stacksjs/bun-queue/commit/0defec8)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([45b798e](https://github.com/stacksjs/bun-queue/commit/45b798e)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([9764184](https://github.com/stacksjs/bun-queue/commit/9764184)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([47274a6](https://github.com/stacksjs/bun-queue/commit/47274a6)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([051514a](https://github.com/stacksjs/bun-queue/commit/051514a)) _(by glennmichael123 <gtorregosa@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_
- _Glenn Michael Torregosa <gtorregosa@gmail.com>_
- _glennmichael123 <gtorregosa@gmail.com>_

[Compare changes](https://github.com/stacksjs/bun-queue/compare/v0.0.1...v0.1.0)

### 🧹 Chores

- release v0.1.0 ([03e8310](https://github.com/stacksjs/bun-queue/commit/03e8310)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([a9441d3](https://github.com/stacksjs/bun-queue/commit/a9441d3)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([d0c5bca](https://github.com/stacksjs/bun-queue/commit/d0c5bca)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([db93269](https://github.com/stacksjs/bun-queue/commit/db93269)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([60c5ccf](https://github.com/stacksjs/bun-queue/commit/60c5ccf)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([bcbe71e](https://github.com/stacksjs/bun-queue/commit/bcbe71e)) _(by Chris <chrisbreuer93@gmail.com>)_
- exclude docs from typecheck ([5c2a390](https://github.com/stacksjs/bun-queue/commit/5c2a390)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([ca0eb3e](https://github.com/stacksjs/bun-queue/commit/ca0eb3e)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([e8890da](https://github.com/stacksjs/bun-queue/commit/e8890da)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([cb82c9f](https://github.com/stacksjs/bun-queue/commit/cb82c9f)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([10fbf5c](https://github.com/stacksjs/bun-queue/commit/10fbf5c)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([df647d1](https://github.com/stacksjs/bun-queue/commit/df647d1)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([679a584](https://github.com/stacksjs/bun-queue/commit/679a584)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([a976b63](https://github.com/stacksjs/bun-queue/commit/a976b63)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([e2b54c8](https://github.com/stacksjs/bun-queue/commit/e2b54c8)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([db292c6](https://github.com/stacksjs/bun-queue/commit/db292c6)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([7d615fe](https://github.com/stacksjs/bun-queue/commit/7d615fe)) _(by glennmichael123 <gtorregosa@gmail.com>)_

### Contributors

- _Chris <chrisbreuer93@gmail.com>_
- _glennmichael123 <gtorregosa@gmail.com>_

[Compare changes](https://github.com/stacksjs/bun-queue/compare/v0.0.1...HEAD)

### 🧹 Chores

- wip ([a9441d3](https://github.com/stacksjs/bun-queue/commit/a9441d3)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([d0c5bca](https://github.com/stacksjs/bun-queue/commit/d0c5bca)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([db93269](https://github.com/stacksjs/bun-queue/commit/db93269)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([60c5ccf](https://github.com/stacksjs/bun-queue/commit/60c5ccf)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([bcbe71e](https://github.com/stacksjs/bun-queue/commit/bcbe71e)) _(by Chris <chrisbreuer93@gmail.com>)_
- exclude docs from typecheck ([5c2a390](https://github.com/stacksjs/bun-queue/commit/5c2a390)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([ca0eb3e](https://github.com/stacksjs/bun-queue/commit/ca0eb3e)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([e8890da](https://github.com/stacksjs/bun-queue/commit/e8890da)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([cb82c9f](https://github.com/stacksjs/bun-queue/commit/cb82c9f)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([10fbf5c](https://github.com/stacksjs/bun-queue/commit/10fbf5c)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([df647d1](https://github.com/stacksjs/bun-queue/commit/df647d1)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([679a584](https://github.com/stacksjs/bun-queue/commit/679a584)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([a976b63](https://github.com/stacksjs/bun-queue/commit/a976b63)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([e2b54c8](https://github.com/stacksjs/bun-queue/commit/e2b54c8)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([db292c6](https://github.com/stacksjs/bun-queue/commit/db292c6)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([7d615fe](https://github.com/stacksjs/bun-queue/commit/7d615fe)) _(by glennmichael123 <gtorregosa@gmail.com>)_

### Contributors

- _Chris <chrisbreuer93@gmail.com>_
- _glennmichael123 <gtorregosa@gmail.com>_

### 🧹 Chores

- release v0.0.1 ([fa4c8ee](https://github.com/stacksjs/bun-queue/commit/fa4c8ee)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- release v0.0.1 ([118e8d7](https://github.com/stacksjs/bun-queue/commit/118e8d7)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([12d8d97](https://github.com/stacksjs/bun-queue/commit/12d8d97)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([631b555](https://github.com/stacksjs/bun-queue/commit/631b555)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: update all non-major dependencies (#734) ([c74e4b5](https://github.com/stacksjs/bun-queue/commit/c74e4b5)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#734](https://github.com/stacksjs/bun-queue/issues/734), [#734](https://github.com/stacksjs/bun-queue/issues/734))
- **deps**: update dependency vue-tsc to 3.2.4 (#659) ([5b6a430](https://github.com/stacksjs/bun-queue/commit/5b6a430)) _(by Chris <chrisbreuer93@gmail.com>)_ ([#659](https://github.com/stacksjs/bun-queue/issues/659), [#659](https://github.com/stacksjs/bun-queue/issues/659))
- **deps**: update dependency vue-router to 5.0.2 (#658) ([eb046d9](https://github.com/stacksjs/bun-queue/commit/eb046d9)) _(by Chris <chrisbreuer93@gmail.com>)_ ([#658](https://github.com/stacksjs/bun-queue/issues/658), [#658](https://github.com/stacksjs/bun-queue/issues/658))
- **deps**: update dependency @vitejs/plugin-vue to 6.0.4 (#657) ([b3ec970](https://github.com/stacksjs/bun-queue/commit/b3ec970)) _(by Chris <chrisbreuer93@gmail.com>)_ ([#657](https://github.com/stacksjs/bun-queue/issues/657), [#657](https://github.com/stacksjs/bun-queue/issues/657))
- **deps**: update dependency vue-router to v5 (#160) ([671e779](https://github.com/stacksjs/bun-queue/commit/671e779)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#160](https://github.com/stacksjs/bun-queue/issues/160), [#160](https://github.com/stacksjs/bun-queue/issues/160))
- release v0.0.1 ([f0a90ad](https://github.com/stacksjs/bun-queue/commit/f0a90ad)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([16f09fc](https://github.com/stacksjs/bun-queue/commit/16f09fc)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([5a9714f](https://github.com/stacksjs/bun-queue/commit/5a9714f)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([b7e5704](https://github.com/stacksjs/bun-queue/commit/b7e5704)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([4ea8161](https://github.com/stacksjs/bun-queue/commit/4ea8161)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([43f06ad](https://github.com/stacksjs/bun-queue/commit/43f06ad)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([aa39ed1](https://github.com/stacksjs/bun-queue/commit/aa39ed1)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([c7ee95d](https://github.com/stacksjs/bun-queue/commit/c7ee95d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: update all non-major dependencies (#52) ([c067652](https://github.com/stacksjs/bun-queue/commit/c067652)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#52](https://github.com/stacksjs/bun-queue/issues/52), [#52](https://github.com/stacksjs/bun-queue/issues/52))
- **deps**: update actions/cache action to v5 (#54) ([a8c90e6](https://github.com/stacksjs/bun-queue/commit/a8c90e6)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#54](https://github.com/stacksjs/bun-queue/issues/54), [#54](https://github.com/stacksjs/bun-queue/issues/54))
- wip ([576934b](https://github.com/stacksjs/bun-queue/commit/576934b)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([78ca4d2](https://github.com/stacksjs/bun-queue/commit/78ca4d2)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: update dependency better-dx to ^0.2.4 (#48) ([ef71ef0](https://github.com/stacksjs/bun-queue/commit/ef71ef0)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#48](https://github.com/stacksjs/bun-queue/issues/48), [#48](https://github.com/stacksjs/bun-queue/issues/48))
- **deps**: update all non-major dependencies (#45) ([20827e5](https://github.com/stacksjs/bun-queue/commit/20827e5)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#45](https://github.com/stacksjs/bun-queue/issues/45), [#45](https://github.com/stacksjs/bun-queue/issues/45))
- **deps**: update actions/checkout action to v6 (#47) ([3e33ee7](https://github.com/stacksjs/bun-queue/commit/3e33ee7)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#47](https://github.com/stacksjs/bun-queue/issues/47), [#47](https://github.com/stacksjs/bun-queue/issues/47))
- **deps**: update dependency @unocss/reset to ^66.5.7 (#43) ([f1cb263](https://github.com/stacksjs/bun-queue/commit/f1cb263)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#43](https://github.com/stacksjs/bun-queue/issues/43), [#43](https://github.com/stacksjs/bun-queue/issues/43))
- **deps**: update all non-major dependencies (#39) ([4cb63d4](https://github.com/stacksjs/bun-queue/commit/4cb63d4)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#39](https://github.com/stacksjs/bun-queue/issues/39), [#39](https://github.com/stacksjs/bun-queue/issues/39))
- wip ([43e4085](https://github.com/stacksjs/bun-queue/commit/43e4085)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([e705718](https://github.com/stacksjs/bun-queue/commit/e705718)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([5149131](https://github.com/stacksjs/bun-queue/commit/5149131)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([9bb6946](https://github.com/stacksjs/bun-queue/commit/9bb6946)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: update dependency vite to v7 (#11) ([c59e0a5](https://github.com/stacksjs/bun-queue/commit/c59e0a5)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#11](https://github.com/stacksjs/bun-queue/issues/11), [#11](https://github.com/stacksjs/bun-queue/issues/11))
- **deps**: update actions/checkout action to v5 (#13) ([8ba17bf](https://github.com/stacksjs/bun-queue/commit/8ba17bf)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#13](https://github.com/stacksjs/bun-queue/issues/13), [#13](https://github.com/stacksjs/bun-queue/issues/13))
- **deps**: update all non-major dependencies (#7) ([227bd13](https://github.com/stacksjs/bun-queue/commit/227bd13)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#7](https://github.com/stacksjs/bun-queue/issues/7), [#7](https://github.com/stacksjs/bun-queue/issues/7))
- wip ([72b5318](https://github.com/stacksjs/bun-queue/commit/72b5318)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([0076af6](https://github.com/stacksjs/bun-queue/commit/0076af6)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([29b76eb](https://github.com/stacksjs/bun-queue/commit/29b76eb)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([d540271](https://github.com/stacksjs/bun-queue/commit/d540271)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([065aeb8](https://github.com/stacksjs/bun-queue/commit/065aeb8)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([5b41099](https://github.com/stacksjs/bun-queue/commit/5b41099)) _(by Chris <chrisbreuer93@gmail.com>)_
- update tools ([ae152b7](https://github.com/stacksjs/bun-queue/commit/ae152b7)) _(by Adelino Ngomacha <adelinob335@gmail.com>)_
- update tools ([520c4f3](https://github.com/stacksjs/bun-queue/commit/520c4f3)) _(by Adelino Ngomacha <adelinob335@gmail.com>)_
- **deps**: update all non-major dependencies (#3) ([e6c1351](https://github.com/stacksjs/bun-queue/commit/e6c1351)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#3](https://github.com/stacksjs/bun-queue/issues/3), [#3](https://github.com/stacksjs/bun-queue/issues/3))
- wip ([cc596ba](https://github.com/stacksjs/bun-queue/commit/cc596ba)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([8eb1ef1](https://github.com/stacksjs/bun-queue/commit/8eb1ef1)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([78f4766](https://github.com/stacksjs/bun-queue/commit/78f4766)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([5789ce9](https://github.com/stacksjs/bun-queue/commit/5789ce9)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([b83f35c](https://github.com/stacksjs/bun-queue/commit/b83f35c)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([fc5b287](https://github.com/stacksjs/bun-queue/commit/fc5b287)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([4fbdf26](https://github.com/stacksjs/bun-queue/commit/4fbdf26)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([64cf43d](https://github.com/stacksjs/bun-queue/commit/64cf43d)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([18c680e](https://github.com/stacksjs/bun-queue/commit/18c680e)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([71fddf7](https://github.com/stacksjs/bun-queue/commit/71fddf7)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([ab2cb74](https://github.com/stacksjs/bun-queue/commit/ab2cb74)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([82554ed](https://github.com/stacksjs/bun-queue/commit/82554ed)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([a948214](https://github.com/stacksjs/bun-queue/commit/a948214)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([090bbb9](https://github.com/stacksjs/bun-queue/commit/090bbb9)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([660c1a5](https://github.com/stacksjs/bun-queue/commit/660c1a5)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([1b4e662](https://github.com/stacksjs/bun-queue/commit/1b4e662)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([f995e02](https://github.com/stacksjs/bun-queue/commit/f995e02)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([eb19ddf](https://github.com/stacksjs/bun-queue/commit/eb19ddf)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([527b0b8](https://github.com/stacksjs/bun-queue/commit/527b0b8)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([850509a](https://github.com/stacksjs/bun-queue/commit/850509a)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([bef9330](https://github.com/stacksjs/bun-queue/commit/bef9330)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([fe8763d](https://github.com/stacksjs/bun-queue/commit/fe8763d)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([797f589](https://github.com/stacksjs/bun-queue/commit/797f589)) _(by Chris <chrisbreuer93@gmail.com>)_
- initial commit ([0667d7d](https://github.com/stacksjs/bun-queue/commit/0667d7d)) _(by Chris <chrisbreuer93@gmail.com>)_

### 📄 Miscellaneous

- Update release.yml ([f84baf9](https://github.com/stacksjs/bun-queue/commit/f84baf9)) _(by glennmichael123 <gtorregosa@gmail.com>)_

### Contributors

- _Adelino Ngomacha <adelinob335@gmail.com>_
- _Chris <chrisbreuer93@gmail.com>_
- _[renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot])_
- _glennmichael123 <gtorregosa@gmail.com>_

### 🧹 Chores

- release v0.0.1 ([118e8d7](https://github.com/stacksjs/bun-queue/commit/118e8d7)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([12d8d97](https://github.com/stacksjs/bun-queue/commit/12d8d97)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([631b555](https://github.com/stacksjs/bun-queue/commit/631b555)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: update all non-major dependencies (#734) ([c74e4b5](https://github.com/stacksjs/bun-queue/commit/c74e4b5)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#734](https://github.com/stacksjs/bun-queue/issues/734), [#734](https://github.com/stacksjs/bun-queue/issues/734))
- **deps**: update dependency vue-tsc to 3.2.4 (#659) ([5b6a430](https://github.com/stacksjs/bun-queue/commit/5b6a430)) _(by Chris <chrisbreuer93@gmail.com>)_ ([#659](https://github.com/stacksjs/bun-queue/issues/659), [#659](https://github.com/stacksjs/bun-queue/issues/659))
- **deps**: update dependency vue-router to 5.0.2 (#658) ([eb046d9](https://github.com/stacksjs/bun-queue/commit/eb046d9)) _(by Chris <chrisbreuer93@gmail.com>)_ ([#658](https://github.com/stacksjs/bun-queue/issues/658), [#658](https://github.com/stacksjs/bun-queue/issues/658))
- **deps**: update dependency @vitejs/plugin-vue to 6.0.4 (#657) ([b3ec970](https://github.com/stacksjs/bun-queue/commit/b3ec970)) _(by Chris <chrisbreuer93@gmail.com>)_ ([#657](https://github.com/stacksjs/bun-queue/issues/657), [#657](https://github.com/stacksjs/bun-queue/issues/657))
- **deps**: update dependency vue-router to v5 (#160) ([671e779](https://github.com/stacksjs/bun-queue/commit/671e779)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#160](https://github.com/stacksjs/bun-queue/issues/160), [#160](https://github.com/stacksjs/bun-queue/issues/160))
- release v0.0.1 ([f0a90ad](https://github.com/stacksjs/bun-queue/commit/f0a90ad)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([16f09fc](https://github.com/stacksjs/bun-queue/commit/16f09fc)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([5a9714f](https://github.com/stacksjs/bun-queue/commit/5a9714f)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([b7e5704](https://github.com/stacksjs/bun-queue/commit/b7e5704)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([4ea8161](https://github.com/stacksjs/bun-queue/commit/4ea8161)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([43f06ad](https://github.com/stacksjs/bun-queue/commit/43f06ad)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([aa39ed1](https://github.com/stacksjs/bun-queue/commit/aa39ed1)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([c7ee95d](https://github.com/stacksjs/bun-queue/commit/c7ee95d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: update all non-major dependencies (#52) ([c067652](https://github.com/stacksjs/bun-queue/commit/c067652)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#52](https://github.com/stacksjs/bun-queue/issues/52), [#52](https://github.com/stacksjs/bun-queue/issues/52))
- **deps**: update actions/cache action to v5 (#54) ([a8c90e6](https://github.com/stacksjs/bun-queue/commit/a8c90e6)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#54](https://github.com/stacksjs/bun-queue/issues/54), [#54](https://github.com/stacksjs/bun-queue/issues/54))
- wip ([576934b](https://github.com/stacksjs/bun-queue/commit/576934b)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([78ca4d2](https://github.com/stacksjs/bun-queue/commit/78ca4d2)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: update dependency better-dx to ^0.2.4 (#48) ([ef71ef0](https://github.com/stacksjs/bun-queue/commit/ef71ef0)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#48](https://github.com/stacksjs/bun-queue/issues/48), [#48](https://github.com/stacksjs/bun-queue/issues/48))
- **deps**: update all non-major dependencies (#45) ([20827e5](https://github.com/stacksjs/bun-queue/commit/20827e5)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#45](https://github.com/stacksjs/bun-queue/issues/45), [#45](https://github.com/stacksjs/bun-queue/issues/45))
- **deps**: update actions/checkout action to v6 (#47) ([3e33ee7](https://github.com/stacksjs/bun-queue/commit/3e33ee7)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#47](https://github.com/stacksjs/bun-queue/issues/47), [#47](https://github.com/stacksjs/bun-queue/issues/47))
- **deps**: update dependency @unocss/reset to ^66.5.7 (#43) ([f1cb263](https://github.com/stacksjs/bun-queue/commit/f1cb263)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#43](https://github.com/stacksjs/bun-queue/issues/43), [#43](https://github.com/stacksjs/bun-queue/issues/43))
- **deps**: update all non-major dependencies (#39) ([4cb63d4](https://github.com/stacksjs/bun-queue/commit/4cb63d4)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#39](https://github.com/stacksjs/bun-queue/issues/39), [#39](https://github.com/stacksjs/bun-queue/issues/39))
- wip ([43e4085](https://github.com/stacksjs/bun-queue/commit/43e4085)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([e705718](https://github.com/stacksjs/bun-queue/commit/e705718)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([5149131](https://github.com/stacksjs/bun-queue/commit/5149131)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([9bb6946](https://github.com/stacksjs/bun-queue/commit/9bb6946)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: update dependency vite to v7 (#11) ([c59e0a5](https://github.com/stacksjs/bun-queue/commit/c59e0a5)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#11](https://github.com/stacksjs/bun-queue/issues/11), [#11](https://github.com/stacksjs/bun-queue/issues/11))
- **deps**: update actions/checkout action to v5 (#13) ([8ba17bf](https://github.com/stacksjs/bun-queue/commit/8ba17bf)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#13](https://github.com/stacksjs/bun-queue/issues/13), [#13](https://github.com/stacksjs/bun-queue/issues/13))
- **deps**: update all non-major dependencies (#7) ([227bd13](https://github.com/stacksjs/bun-queue/commit/227bd13)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#7](https://github.com/stacksjs/bun-queue/issues/7), [#7](https://github.com/stacksjs/bun-queue/issues/7))
- wip ([72b5318](https://github.com/stacksjs/bun-queue/commit/72b5318)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([0076af6](https://github.com/stacksjs/bun-queue/commit/0076af6)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([29b76eb](https://github.com/stacksjs/bun-queue/commit/29b76eb)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([d540271](https://github.com/stacksjs/bun-queue/commit/d540271)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([065aeb8](https://github.com/stacksjs/bun-queue/commit/065aeb8)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([5b41099](https://github.com/stacksjs/bun-queue/commit/5b41099)) _(by Chris <chrisbreuer93@gmail.com>)_
- update tools ([ae152b7](https://github.com/stacksjs/bun-queue/commit/ae152b7)) _(by Adelino Ngomacha <adelinob335@gmail.com>)_
- update tools ([520c4f3](https://github.com/stacksjs/bun-queue/commit/520c4f3)) _(by Adelino Ngomacha <adelinob335@gmail.com>)_
- **deps**: update all non-major dependencies (#3) ([e6c1351](https://github.com/stacksjs/bun-queue/commit/e6c1351)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#3](https://github.com/stacksjs/bun-queue/issues/3), [#3](https://github.com/stacksjs/bun-queue/issues/3))
- wip ([cc596ba](https://github.com/stacksjs/bun-queue/commit/cc596ba)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([8eb1ef1](https://github.com/stacksjs/bun-queue/commit/8eb1ef1)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([78f4766](https://github.com/stacksjs/bun-queue/commit/78f4766)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([5789ce9](https://github.com/stacksjs/bun-queue/commit/5789ce9)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([b83f35c](https://github.com/stacksjs/bun-queue/commit/b83f35c)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([fc5b287](https://github.com/stacksjs/bun-queue/commit/fc5b287)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([4fbdf26](https://github.com/stacksjs/bun-queue/commit/4fbdf26)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([64cf43d](https://github.com/stacksjs/bun-queue/commit/64cf43d)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([18c680e](https://github.com/stacksjs/bun-queue/commit/18c680e)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([71fddf7](https://github.com/stacksjs/bun-queue/commit/71fddf7)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([ab2cb74](https://github.com/stacksjs/bun-queue/commit/ab2cb74)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([82554ed](https://github.com/stacksjs/bun-queue/commit/82554ed)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([a948214](https://github.com/stacksjs/bun-queue/commit/a948214)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([090bbb9](https://github.com/stacksjs/bun-queue/commit/090bbb9)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([660c1a5](https://github.com/stacksjs/bun-queue/commit/660c1a5)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([1b4e662](https://github.com/stacksjs/bun-queue/commit/1b4e662)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([f995e02](https://github.com/stacksjs/bun-queue/commit/f995e02)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([eb19ddf](https://github.com/stacksjs/bun-queue/commit/eb19ddf)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([527b0b8](https://github.com/stacksjs/bun-queue/commit/527b0b8)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([850509a](https://github.com/stacksjs/bun-queue/commit/850509a)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([bef9330](https://github.com/stacksjs/bun-queue/commit/bef9330)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([fe8763d](https://github.com/stacksjs/bun-queue/commit/fe8763d)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([797f589](https://github.com/stacksjs/bun-queue/commit/797f589)) _(by Chris <chrisbreuer93@gmail.com>)_
- initial commit ([0667d7d](https://github.com/stacksjs/bun-queue/commit/0667d7d)) _(by Chris <chrisbreuer93@gmail.com>)_

### 📄 Miscellaneous

- Update release.yml ([f84baf9](https://github.com/stacksjs/bun-queue/commit/f84baf9)) _(by glennmichael123 <gtorregosa@gmail.com>)_

### Contributors

- _Adelino Ngomacha <adelinob335@gmail.com>_
- _Chris <chrisbreuer93@gmail.com>_
- _[renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot])_
- _glennmichael123 <gtorregosa@gmail.com>_

### 🧹 Chores

- wip ([12d8d97](https://github.com/stacksjs/bun-queue/commit/12d8d97)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([631b555](https://github.com/stacksjs/bun-queue/commit/631b555)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: update all non-major dependencies (#734) ([c74e4b5](https://github.com/stacksjs/bun-queue/commit/c74e4b5)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#734](https://github.com/stacksjs/bun-queue/issues/734), [#734](https://github.com/stacksjs/bun-queue/issues/734))
- **deps**: update dependency vue-tsc to 3.2.4 (#659) ([5b6a430](https://github.com/stacksjs/bun-queue/commit/5b6a430)) _(by Chris <chrisbreuer93@gmail.com>)_ ([#659](https://github.com/stacksjs/bun-queue/issues/659), [#659](https://github.com/stacksjs/bun-queue/issues/659))
- **deps**: update dependency vue-router to 5.0.2 (#658) ([eb046d9](https://github.com/stacksjs/bun-queue/commit/eb046d9)) _(by Chris <chrisbreuer93@gmail.com>)_ ([#658](https://github.com/stacksjs/bun-queue/issues/658), [#658](https://github.com/stacksjs/bun-queue/issues/658))
- **deps**: update dependency @vitejs/plugin-vue to 6.0.4 (#657) ([b3ec970](https://github.com/stacksjs/bun-queue/commit/b3ec970)) _(by Chris <chrisbreuer93@gmail.com>)_ ([#657](https://github.com/stacksjs/bun-queue/issues/657), [#657](https://github.com/stacksjs/bun-queue/issues/657))
- **deps**: update dependency vue-router to v5 (#160) ([671e779](https://github.com/stacksjs/bun-queue/commit/671e779)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#160](https://github.com/stacksjs/bun-queue/issues/160), [#160](https://github.com/stacksjs/bun-queue/issues/160))
- release v0.0.1 ([f0a90ad](https://github.com/stacksjs/bun-queue/commit/f0a90ad)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([16f09fc](https://github.com/stacksjs/bun-queue/commit/16f09fc)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([5a9714f](https://github.com/stacksjs/bun-queue/commit/5a9714f)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([b7e5704](https://github.com/stacksjs/bun-queue/commit/b7e5704)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([4ea8161](https://github.com/stacksjs/bun-queue/commit/4ea8161)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([43f06ad](https://github.com/stacksjs/bun-queue/commit/43f06ad)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([aa39ed1](https://github.com/stacksjs/bun-queue/commit/aa39ed1)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([c7ee95d](https://github.com/stacksjs/bun-queue/commit/c7ee95d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: update all non-major dependencies (#52) ([c067652](https://github.com/stacksjs/bun-queue/commit/c067652)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#52](https://github.com/stacksjs/bun-queue/issues/52), [#52](https://github.com/stacksjs/bun-queue/issues/52))
- **deps**: update actions/cache action to v5 (#54) ([a8c90e6](https://github.com/stacksjs/bun-queue/commit/a8c90e6)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#54](https://github.com/stacksjs/bun-queue/issues/54), [#54](https://github.com/stacksjs/bun-queue/issues/54))
- wip ([576934b](https://github.com/stacksjs/bun-queue/commit/576934b)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([78ca4d2](https://github.com/stacksjs/bun-queue/commit/78ca4d2)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: update dependency better-dx to ^0.2.4 (#48) ([ef71ef0](https://github.com/stacksjs/bun-queue/commit/ef71ef0)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#48](https://github.com/stacksjs/bun-queue/issues/48), [#48](https://github.com/stacksjs/bun-queue/issues/48))
- **deps**: update all non-major dependencies (#45) ([20827e5](https://github.com/stacksjs/bun-queue/commit/20827e5)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#45](https://github.com/stacksjs/bun-queue/issues/45), [#45](https://github.com/stacksjs/bun-queue/issues/45))
- **deps**: update actions/checkout action to v6 (#47) ([3e33ee7](https://github.com/stacksjs/bun-queue/commit/3e33ee7)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#47](https://github.com/stacksjs/bun-queue/issues/47), [#47](https://github.com/stacksjs/bun-queue/issues/47))
- **deps**: update dependency @unocss/reset to ^66.5.7 (#43) ([f1cb263](https://github.com/stacksjs/bun-queue/commit/f1cb263)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#43](https://github.com/stacksjs/bun-queue/issues/43), [#43](https://github.com/stacksjs/bun-queue/issues/43))
- **deps**: update all non-major dependencies (#39) ([4cb63d4](https://github.com/stacksjs/bun-queue/commit/4cb63d4)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#39](https://github.com/stacksjs/bun-queue/issues/39), [#39](https://github.com/stacksjs/bun-queue/issues/39))
- wip ([43e4085](https://github.com/stacksjs/bun-queue/commit/43e4085)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([e705718](https://github.com/stacksjs/bun-queue/commit/e705718)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([5149131](https://github.com/stacksjs/bun-queue/commit/5149131)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([9bb6946](https://github.com/stacksjs/bun-queue/commit/9bb6946)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: update dependency vite to v7 (#11) ([c59e0a5](https://github.com/stacksjs/bun-queue/commit/c59e0a5)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#11](https://github.com/stacksjs/bun-queue/issues/11), [#11](https://github.com/stacksjs/bun-queue/issues/11))
- **deps**: update actions/checkout action to v5 (#13) ([8ba17bf](https://github.com/stacksjs/bun-queue/commit/8ba17bf)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#13](https://github.com/stacksjs/bun-queue/issues/13), [#13](https://github.com/stacksjs/bun-queue/issues/13))
- **deps**: update all non-major dependencies (#7) ([227bd13](https://github.com/stacksjs/bun-queue/commit/227bd13)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#7](https://github.com/stacksjs/bun-queue/issues/7), [#7](https://github.com/stacksjs/bun-queue/issues/7))
- wip ([72b5318](https://github.com/stacksjs/bun-queue/commit/72b5318)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([0076af6](https://github.com/stacksjs/bun-queue/commit/0076af6)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([29b76eb](https://github.com/stacksjs/bun-queue/commit/29b76eb)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([d540271](https://github.com/stacksjs/bun-queue/commit/d540271)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([065aeb8](https://github.com/stacksjs/bun-queue/commit/065aeb8)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([5b41099](https://github.com/stacksjs/bun-queue/commit/5b41099)) _(by Chris <chrisbreuer93@gmail.com>)_
- update tools ([ae152b7](https://github.com/stacksjs/bun-queue/commit/ae152b7)) _(by Adelino Ngomacha <adelinob335@gmail.com>)_
- update tools ([520c4f3](https://github.com/stacksjs/bun-queue/commit/520c4f3)) _(by Adelino Ngomacha <adelinob335@gmail.com>)_
- **deps**: update all non-major dependencies (#3) ([e6c1351](https://github.com/stacksjs/bun-queue/commit/e6c1351)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#3](https://github.com/stacksjs/bun-queue/issues/3), [#3](https://github.com/stacksjs/bun-queue/issues/3))
- wip ([cc596ba](https://github.com/stacksjs/bun-queue/commit/cc596ba)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([8eb1ef1](https://github.com/stacksjs/bun-queue/commit/8eb1ef1)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([78f4766](https://github.com/stacksjs/bun-queue/commit/78f4766)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([5789ce9](https://github.com/stacksjs/bun-queue/commit/5789ce9)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([b83f35c](https://github.com/stacksjs/bun-queue/commit/b83f35c)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([fc5b287](https://github.com/stacksjs/bun-queue/commit/fc5b287)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([4fbdf26](https://github.com/stacksjs/bun-queue/commit/4fbdf26)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([64cf43d](https://github.com/stacksjs/bun-queue/commit/64cf43d)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([18c680e](https://github.com/stacksjs/bun-queue/commit/18c680e)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([71fddf7](https://github.com/stacksjs/bun-queue/commit/71fddf7)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([ab2cb74](https://github.com/stacksjs/bun-queue/commit/ab2cb74)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([82554ed](https://github.com/stacksjs/bun-queue/commit/82554ed)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([a948214](https://github.com/stacksjs/bun-queue/commit/a948214)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([090bbb9](https://github.com/stacksjs/bun-queue/commit/090bbb9)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([660c1a5](https://github.com/stacksjs/bun-queue/commit/660c1a5)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([1b4e662](https://github.com/stacksjs/bun-queue/commit/1b4e662)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([f995e02](https://github.com/stacksjs/bun-queue/commit/f995e02)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([eb19ddf](https://github.com/stacksjs/bun-queue/commit/eb19ddf)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([527b0b8](https://github.com/stacksjs/bun-queue/commit/527b0b8)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([850509a](https://github.com/stacksjs/bun-queue/commit/850509a)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([bef9330](https://github.com/stacksjs/bun-queue/commit/bef9330)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([fe8763d](https://github.com/stacksjs/bun-queue/commit/fe8763d)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([797f589](https://github.com/stacksjs/bun-queue/commit/797f589)) _(by Chris <chrisbreuer93@gmail.com>)_
- initial commit ([0667d7d](https://github.com/stacksjs/bun-queue/commit/0667d7d)) _(by Chris <chrisbreuer93@gmail.com>)_

### 📄 Miscellaneous

- Update release.yml ([f84baf9](https://github.com/stacksjs/bun-queue/commit/f84baf9)) _(by glennmichael123 <gtorregosa@gmail.com>)_

### Contributors

- _Adelino Ngomacha <adelinob335@gmail.com>_
- _Chris <chrisbreuer93@gmail.com>_
- _[renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot])_
- _glennmichael123 <gtorregosa@gmail.com>_

### 🧹 Chores

- wip ([16f09fc](https://github.com/stacksjs/bun-queue/commit/16f09fc)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([5a9714f](https://github.com/stacksjs/bun-queue/commit/5a9714f)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([b7e5704](https://github.com/stacksjs/bun-queue/commit/b7e5704)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([4ea8161](https://github.com/stacksjs/bun-queue/commit/4ea8161)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([43f06ad](https://github.com/stacksjs/bun-queue/commit/43f06ad)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([aa39ed1](https://github.com/stacksjs/bun-queue/commit/aa39ed1)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([c7ee95d](https://github.com/stacksjs/bun-queue/commit/c7ee95d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: update all non-major dependencies (#52) ([c067652](https://github.com/stacksjs/bun-queue/commit/c067652)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#52](https://github.com/stacksjs/bun-queue/issues/52), [#52](https://github.com/stacksjs/bun-queue/issues/52))
- **deps**: update actions/cache action to v5 (#54) ([a8c90e6](https://github.com/stacksjs/bun-queue/commit/a8c90e6)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#54](https://github.com/stacksjs/bun-queue/issues/54), [#54](https://github.com/stacksjs/bun-queue/issues/54))
- wip ([576934b](https://github.com/stacksjs/bun-queue/commit/576934b)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([78ca4d2](https://github.com/stacksjs/bun-queue/commit/78ca4d2)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: update dependency better-dx to ^0.2.4 (#48) ([ef71ef0](https://github.com/stacksjs/bun-queue/commit/ef71ef0)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#48](https://github.com/stacksjs/bun-queue/issues/48), [#48](https://github.com/stacksjs/bun-queue/issues/48))
- **deps**: update all non-major dependencies (#45) ([20827e5](https://github.com/stacksjs/bun-queue/commit/20827e5)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#45](https://github.com/stacksjs/bun-queue/issues/45), [#45](https://github.com/stacksjs/bun-queue/issues/45))
- **deps**: update actions/checkout action to v6 (#47) ([3e33ee7](https://github.com/stacksjs/bun-queue/commit/3e33ee7)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#47](https://github.com/stacksjs/bun-queue/issues/47), [#47](https://github.com/stacksjs/bun-queue/issues/47))
- **deps**: update dependency @unocss/reset to ^66.5.7 (#43) ([f1cb263](https://github.com/stacksjs/bun-queue/commit/f1cb263)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#43](https://github.com/stacksjs/bun-queue/issues/43), [#43](https://github.com/stacksjs/bun-queue/issues/43))
- **deps**: update all non-major dependencies (#39) ([4cb63d4](https://github.com/stacksjs/bun-queue/commit/4cb63d4)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#39](https://github.com/stacksjs/bun-queue/issues/39), [#39](https://github.com/stacksjs/bun-queue/issues/39))
- wip ([43e4085](https://github.com/stacksjs/bun-queue/commit/43e4085)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([e705718](https://github.com/stacksjs/bun-queue/commit/e705718)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([5149131](https://github.com/stacksjs/bun-queue/commit/5149131)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([9bb6946](https://github.com/stacksjs/bun-queue/commit/9bb6946)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: update dependency vite to v7 (#11) ([c59e0a5](https://github.com/stacksjs/bun-queue/commit/c59e0a5)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#11](https://github.com/stacksjs/bun-queue/issues/11), [#11](https://github.com/stacksjs/bun-queue/issues/11))
- **deps**: update actions/checkout action to v5 (#13) ([8ba17bf](https://github.com/stacksjs/bun-queue/commit/8ba17bf)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#13](https://github.com/stacksjs/bun-queue/issues/13), [#13](https://github.com/stacksjs/bun-queue/issues/13))
- **deps**: update all non-major dependencies (#7) ([227bd13](https://github.com/stacksjs/bun-queue/commit/227bd13)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#7](https://github.com/stacksjs/bun-queue/issues/7), [#7](https://github.com/stacksjs/bun-queue/issues/7))
- wip ([72b5318](https://github.com/stacksjs/bun-queue/commit/72b5318)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([0076af6](https://github.com/stacksjs/bun-queue/commit/0076af6)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([29b76eb](https://github.com/stacksjs/bun-queue/commit/29b76eb)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([d540271](https://github.com/stacksjs/bun-queue/commit/d540271)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([065aeb8](https://github.com/stacksjs/bun-queue/commit/065aeb8)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([5b41099](https://github.com/stacksjs/bun-queue/commit/5b41099)) _(by Chris <chrisbreuer93@gmail.com>)_
- update tools ([ae152b7](https://github.com/stacksjs/bun-queue/commit/ae152b7)) _(by Adelino Ngomacha <adelinob335@gmail.com>)_
- update tools ([520c4f3](https://github.com/stacksjs/bun-queue/commit/520c4f3)) _(by Adelino Ngomacha <adelinob335@gmail.com>)_
- **deps**: update all non-major dependencies (#3) ([e6c1351](https://github.com/stacksjs/bun-queue/commit/e6c1351)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#3](https://github.com/stacksjs/bun-queue/issues/3), [#3](https://github.com/stacksjs/bun-queue/issues/3))
- wip ([cc596ba](https://github.com/stacksjs/bun-queue/commit/cc596ba)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([8eb1ef1](https://github.com/stacksjs/bun-queue/commit/8eb1ef1)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([78f4766](https://github.com/stacksjs/bun-queue/commit/78f4766)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([5789ce9](https://github.com/stacksjs/bun-queue/commit/5789ce9)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([b83f35c](https://github.com/stacksjs/bun-queue/commit/b83f35c)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([fc5b287](https://github.com/stacksjs/bun-queue/commit/fc5b287)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([4fbdf26](https://github.com/stacksjs/bun-queue/commit/4fbdf26)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([64cf43d](https://github.com/stacksjs/bun-queue/commit/64cf43d)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([18c680e](https://github.com/stacksjs/bun-queue/commit/18c680e)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([71fddf7](https://github.com/stacksjs/bun-queue/commit/71fddf7)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([ab2cb74](https://github.com/stacksjs/bun-queue/commit/ab2cb74)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([82554ed](https://github.com/stacksjs/bun-queue/commit/82554ed)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([a948214](https://github.com/stacksjs/bun-queue/commit/a948214)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([090bbb9](https://github.com/stacksjs/bun-queue/commit/090bbb9)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([660c1a5](https://github.com/stacksjs/bun-queue/commit/660c1a5)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([1b4e662](https://github.com/stacksjs/bun-queue/commit/1b4e662)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([f995e02](https://github.com/stacksjs/bun-queue/commit/f995e02)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([eb19ddf](https://github.com/stacksjs/bun-queue/commit/eb19ddf)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([527b0b8](https://github.com/stacksjs/bun-queue/commit/527b0b8)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([850509a](https://github.com/stacksjs/bun-queue/commit/850509a)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([bef9330](https://github.com/stacksjs/bun-queue/commit/bef9330)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([fe8763d](https://github.com/stacksjs/bun-queue/commit/fe8763d)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([797f589](https://github.com/stacksjs/bun-queue/commit/797f589)) _(by Chris <chrisbreuer93@gmail.com>)_
- initial commit ([0667d7d](https://github.com/stacksjs/bun-queue/commit/0667d7d)) _(by Chris <chrisbreuer93@gmail.com>)_

### 📄 Miscellaneous

- Update release.yml ([f84baf9](https://github.com/stacksjs/bun-queue/commit/f84baf9)) _(by glennmichael123 <gtorregosa@gmail.com>)_

### Contributors

- _Adelino Ngomacha <adelinob335@gmail.com>_
- _Chris <chrisbreuer93@gmail.com>_
- _[renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot])_
- _glennmichael123 <gtorregosa@gmail.com>_

## v0.3.1...main

[compare changes](https://github.com/stacksjs/ts-starter/compare/v0.3.1...main)

### 🚀 Enhancements

- Add `bun-plugin-dts-auto` ([c0c487b](https://github.com/stacksjs/ts-starter/commit/c0c487b))

### ❤️ Contributors

- Chris <chrisbreuer93@gmail.com>

## v0.3.0...main

[compare changes](https://github.com/stacksjs/ts-starter/compare/v0.3.0...main)

### 🏡 Chore

- Fix isolatedDeclarations setting ([b87b6b1](https://github.com/stacksjs/ts-starter/commit/b87b6b1))
- Adjust urls ([0a40b72](https://github.com/stacksjs/ts-starter/commit/0a40b72))

### ❤️ Contributors

- Chris <chrisbreuer93@gmail.com>

## v0.2.1...main

[compare changes](https://github.com/stacksjs/ts-starter/compare/v0.2.1...main)

### 🚀 Enhancements

- Add `noFallthroughCasesInSwitch` ([b9cfa30](https://github.com/stacksjs/ts-starter/commit/b9cfa30))
- Add `verbatimModuleSyntax` ([c495d17](https://github.com/stacksjs/ts-starter/commit/c495d17))
- Several updates ([f703179](https://github.com/stacksjs/ts-starter/commit/f703179))

### 🩹 Fixes

- Properly use bun types ([7144221](https://github.com/stacksjs/ts-starter/commit/7144221))

### 🏡 Chore

- Adjust badge links ([432aff7](https://github.com/stacksjs/ts-starter/commit/432aff7))
- Add `runs-on` options ([9a5b97f](https://github.com/stacksjs/ts-starter/commit/9a5b97f))
- Cache node_modules ([ba2f6ce](https://github.com/stacksjs/ts-starter/commit/ba2f6ce))
- Use `ubuntu-latest` for now ([1add684](https://github.com/stacksjs/ts-starter/commit/1add684))
- Minor updates ([1007cff](https://github.com/stacksjs/ts-starter/commit/1007cff))
- Lint ([d531bdc](https://github.com/stacksjs/ts-starter/commit/d531bdc))
- Remove bunx usage ([e1a5575](https://github.com/stacksjs/ts-starter/commit/e1a5575))
- Pass bun flag ([960976f](https://github.com/stacksjs/ts-starter/commit/960976f))
- Use defaults ([157455b](https://github.com/stacksjs/ts-starter/commit/157455b))
- Run typecheck using bun flag ([f22f3b1](https://github.com/stacksjs/ts-starter/commit/f22f3b1))
- Test ([0b3c3a1](https://github.com/stacksjs/ts-starter/commit/0b3c3a1))
- Use modern js for commitlint ([4bd6978](https://github.com/stacksjs/ts-starter/commit/4bd6978))
- Update worklows readme ([f54aae9](https://github.com/stacksjs/ts-starter/commit/f54aae9))
- Adjust readme ([92d7ff1](https://github.com/stacksjs/ts-starter/commit/92d7ff1))
- More updates ([0225587](https://github.com/stacksjs/ts-starter/commit/0225587))
- Add .zed settings for biome ([1688024](https://github.com/stacksjs/ts-starter/commit/1688024))
- Extend via alias ([b108d30](https://github.com/stacksjs/ts-starter/commit/b108d30))
- Lint ([d961b2a](https://github.com/stacksjs/ts-starter/commit/d961b2a))
- Minor updates ([e66d44a](https://github.com/stacksjs/ts-starter/commit/e66d44a))

### ❤️ Contributors

- Chris <chrisbreuer93@gmail.com>

## v0.2.0...main

[compare changes](https://github.com/stacksjs/ts-starter/compare/v0.2.0...main)

### 🏡 Chore

- Remove unused action ([066f85a](https://github.com/stacksjs/ts-starter/commit/066f85a))
- Housekeeping ([fc4e24d](https://github.com/stacksjs/ts-starter/commit/fc4e24d))

### ❤️ Contributors

- Chris <chrisbreuer93@gmail.com>

## v0.1.1...main

[compare changes](https://github.com/stacksjs/ts-starter/compare/v0.1.1...main)

### 🏡 Chore

- Adjust eslint config name ([53c2aa6](https://github.com/stacksjs/ts-starter/commit/53c2aa6))
- Set type module ([22dde14](https://github.com/stacksjs/ts-starter/commit/22dde14))

### ❤️ Contributors

- Chris <chrisbreuer93@gmail.com>

## v0.1.0...main

[compare changes](https://github.com/stacksjs/ts-starter/compare/v0.1.0...main)

### 🏡 Chore

- Use correct cover image ([75bd3ae](https://github.com/stacksjs/ts-starter/commit/75bd3ae))

### ❤️ Contributors

- Chris <chrisbreuer93@gmail.com>

## v0.0.5...main

[compare changes](https://github.com/stacksjs/ts-starter/compare/v0.0.5...main)

### 🚀 Enhancements

- Add pkgx deps ([319c066](https://github.com/stacksjs/ts-starter/commit/319c066))
- Use flat eslint config ([cdb0093](https://github.com/stacksjs/ts-starter/commit/cdb0093))

### 🏡 Chore

- Fix badge ([bc3b000](https://github.com/stacksjs/ts-starter/commit/bc3b000))
- Minor updates ([78dc522](https://github.com/stacksjs/ts-starter/commit/78dc522))
- Housekeeping ([e1cba3b](https://github.com/stacksjs/ts-starter/commit/e1cba3b))
- Additional housekeeping ([f5dc625](https://github.com/stacksjs/ts-starter/commit/f5dc625))
- Add `.gitattributes` ([7080f8c](https://github.com/stacksjs/ts-starter/commit/7080f8c))
- Adjust deps ([cc71b42](https://github.com/stacksjs/ts-starter/commit/cc71b42))
- Adjust wording ([3bc54b3](https://github.com/stacksjs/ts-starter/commit/3bc54b3))
- Adjust readme cover ([e6acbb2](https://github.com/stacksjs/ts-starter/commit/e6acbb2))

### ❤️ Contributors

- Chris <chrisbreuer93@gmail.com>

## v0.0.5...main

[compare changes](https://github.com/stacksjs/ts-starter/compare/v0.0.5...main)

### 🚀 Enhancements

- Add pkgx deps ([319c066](https://github.com/stacksjs/ts-starter/commit/319c066))
- Use flat eslint config ([cdb0093](https://github.com/stacksjs/ts-starter/commit/cdb0093))

### 🏡 Chore

- Fix badge ([bc3b000](https://github.com/stacksjs/ts-starter/commit/bc3b000))
- Minor updates ([78dc522](https://github.com/stacksjs/ts-starter/commit/78dc522))
- Housekeeping ([e1cba3b](https://github.com/stacksjs/ts-starter/commit/e1cba3b))
- Additional housekeeping ([f5dc625](https://github.com/stacksjs/ts-starter/commit/f5dc625))
- Add `.gitattributes` ([7080f8c](https://github.com/stacksjs/ts-starter/commit/7080f8c))
- Adjust deps ([cc71b42](https://github.com/stacksjs/ts-starter/commit/cc71b42))
- Adjust wording ([3bc54b3](https://github.com/stacksjs/ts-starter/commit/3bc54b3))
- Adjust readme cover ([e6acbb2](https://github.com/stacksjs/ts-starter/commit/e6acbb2))

### ❤️ Contributors

- Chris <chrisbreuer93@gmail.com>
