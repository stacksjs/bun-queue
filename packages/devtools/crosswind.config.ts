export default {
  content: [
    './pages/**/*.stx',
    './partials/**/*.stx',
    './components/**/*.stx',
  ],
  output: './dist/crosswind.css',
  minify: false,
  preflight: true,
  cssVariables: true,
}
