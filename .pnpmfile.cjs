// Permite scripts de build para bcrypt e esbuild
function readPackage(pkg) {
  return pkg
}

module.exports = { hooks: { readPackage } }
