const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const roots = ['App.js', 'index.js', 'app.config.js', 'src', 'public/sw.js', 'scripts', 'tests'];
const files = [];
function collect(file) {
  if (!fs.existsSync(file)) return;
  if (fs.statSync(file).isDirectory()) { for (const name of fs.readdirSync(file)) collect(path.join(file, name)); }
  else if (/\.(?:js|cjs|mjs)$/.test(file)) files.push(file);
}
roots.forEach(collect);
const errors = [];
for (const file of files) {
  try {
    const ast = parser.parse(fs.readFileSync(file, 'utf8'), { sourceType: 'unambiguous', plugins: ['jsx'] });
    function visit(node) {
      if (!node || typeof node !== 'object') return;
      const source = ['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) ? node.source?.value
        : node.type === 'CallExpression' && node.callee?.name === 'require' && node.arguments?.[0]?.type === 'StringLiteral' ? node.arguments[0].value : null;
      if (source?.startsWith('.')) {
        const target = path.resolve(path.dirname(file), source);
        if (![target, ...['.js', '.cjs', '.json', '/index.js'].map((suffix) => target + suffix)].some((candidate) => fs.existsSync(candidate))) errors.push(`${file}: missing import ${source}`);
      }
      for (const [key, value] of Object.entries(node)) {
        if (['loc', 'comments', 'tokens', 'leadingComments', 'trailingComments', 'innerComments'].includes(key)) continue;
        if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === 'object') visit(value);
      }
    }
    visit(ast.program);
  } catch (error) { errors.push(`${file}: ${error.message}`); }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Parsed ${files.length} source/test files; all relative imports and assets resolve.`);
