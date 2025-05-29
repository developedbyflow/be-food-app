import esbuild from 'esbuild';

const isProduction = process.env.NODE_ENV === 'production';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  platform: 'node',
  target: 'node18', // Adjust to your Node.js version
  format: 'esm', // Matches your tsconfig ESNext modules
  sourcemap: !isProduction,
  minify: isProduction,

  // Don't bundle Node.js built-ins and large dependencies
  external: [
    'fsevents',
    'chokidar',
    // Add other dependencies you don't want bundled
  ],

  // Tree-shaking and optimization
  treeShaking: true,

  // Environment variables
  define: {
    'process.env.NODE_ENV': `"${process.env.NODE_ENV || 'development'}"`,
  },
});

console.log(
  `✅ Build complete (${isProduction ? 'production' : 'development'})`
);
