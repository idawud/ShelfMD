// svelte-check (<=4.7) refuses to run when its `typescript` resolves to 7.
// The project uses TypeScript 7; give svelte-check its own private
// TypeScript 6 so it can start, while `svelte-check --tsgo` does the actual
// type-checking with TS 7 via the @typescript/native alias.
// Remove once svelte-check supports TypeScript 7 as its main `typescript`.
function readPackage(pkg) {
  if (pkg.name === 'svelte-check') {
    delete pkg.peerDependencies?.typescript;
    pkg.dependencies = { ...pkg.dependencies, typescript: '~6' };
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
