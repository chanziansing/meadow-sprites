// Transpiles the mod's drawing modules to plain ES modules the demo page imports.
import ts from 'typescript'
import fs from 'fs'
const dir = process.argv[2] ?? '../../hooks'
fs.mkdirSync('lib', { recursive: true })
for (const f of ['palette', 'characters', 'scenery', 'koriko', 'sky']) {
  const code = fs.readFileSync(`${dir}/${f}.ts`, 'utf8').replace(/^import type .*$/gm, '').replace(/from '\.\/(\w+)'/g, "from './$1.mjs'")
  fs.writeFileSync(`lib/${f}.mjs`, ts.transpileModule(code, { compilerOptions: { target: 'es2022', module: 'esnext' } }).outputText)
}
