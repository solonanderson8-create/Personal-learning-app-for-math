// Rebuilds the vendor/ folder from node_modules. Run by Claude (npm run vendor), never on GitHub.
// The output is committed so GitHub Pages can serve it as-is.
import { build } from 'esbuild';
import { cpSync, readdirSync, mkdirSync, rmSync } from 'node:fs';

rmSync('vendor', { recursive: true, force: true });
mkdirSync('vendor/katex/fonts', { recursive: true });

await build({
  entryPoints: ['tools/firebase-entry.js'],
  bundle: true, format: 'esm', minify: true, target: 'safari15',
  outfile: 'vendor/firebase.js', legalComments: 'none',
});

const k = 'node_modules/katex/dist/';
cpSync(k + 'katex.min.js', 'vendor/katex/katex.min.js');
cpSync(k + 'katex.min.css', 'vendor/katex/katex.min.css');
for (const f of readdirSync(k + 'fonts')) {
  if (f.endsWith('.woff2')) cpSync(k + 'fonts/' + f, 'vendor/katex/fonts/' + f);
}
console.log('vendor OK');
