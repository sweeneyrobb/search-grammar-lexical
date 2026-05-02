# Codex Project Rules

## Components

- Use barrel exports for components: each component folder should export via an `index.ts`.
- The primary component should be named the same as the folder it is exporting from.
- Feature-specific subcomponents should live in a `component/` folder under that feature.
- Use a `<Component>.container.tsx` file when a component needs data preparation, state orchestration, or wiring before rendering the downstream component.
- Keep test, sample, or static fixture data in a colocated `constant.ts` file when it belongs to a feature or component.
- Styling should be named the same as a component but include the suffix `.style`, for example `<Component>/<Component>.style.css`.
- `index.ts` files should typically be reserved for barrel exporting. It is not expected to have implementation code in these files.

## Types

- Types belong in a `type` file or `type/` folder; avoid inline type definitions in components unless tiny and local.
- Component prop types should stay in the component file.
- A feature or component can keep types in a single `type.ts` until it becomes large.
- When exporting 4 or more types, prefer a `type/` folder with per-type files and a barrel `type/index.ts`.

## Code Organization

- Prefer collocating feature code under `src/feature/<FeatureName>/`.
- Store feature-specific helper functions in a colocated `helper/` folder, with a barrel `helper/index.ts` when helpers are imported outside that folder.
- Keep top-level feature components focused on composition. When a component
  accumulates substantial editor/plugin behavior, event orchestration, or
  reusable pure logic, extract feature-specific plugins into a colocated
  `plugin/` folder, subcomponents into `component/`, and pure logic into
  `helper/` before adding more behavior.
- Put custom hooks in `src/hook/` and re-export them from a barrel `src/hook/index.ts`.
- Keep new utilities in `src/util/` and re-export from an `index.ts` barrel.
- Avoid using plural form when grouping code into a folder. This makes import statements read better, for example `src/util` instead of `src/utils`.
