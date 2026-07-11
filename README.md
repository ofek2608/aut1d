# Aut1D

An interactive playground for one-dimensional cellular automata. Define states and rules, paint an initial pattern, and watch it evolve row by row.

## Features

- **Rules** — Configure neighborhood size, rule mode (asymmetric, symmetric, or unordered), and a full rule table
- **Pattern** — Set the initial row and padding on each side
- **Identifier** — Share or restore configurations with a compact encoded string
- **View** — Choose color palettes, customize colors, and align the automata on the canvas
- **Canvas** — Pan, zoom, and explore the evolving grid

## Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173/aut1d](http://localhost:5173/aut1d) in your browser.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Type-check and build for production |
| `pnpm preview` | Preview the production build locally |

## Deployment

Build output goes to `dist/`. See the [Vite static deploy guide](https://vite.dev/guide/static-deploy.html) for hosting options.

## Author

Made by **OfekN**
