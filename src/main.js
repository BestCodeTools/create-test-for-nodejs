const fs = require('fs');
const path = require('path');
const { default: inquirer } = require('inquirer');
const camelCase = (str) => str.replace(/[-_]([a-z])/g, (g) => g[1].toUpperCase());
/**
 * 
 * @param {string[]} args 
 */
async function main(args) {
  /**
   * @type {{ paths: string[], testPath?: string, help?: boolean }}
   */
  const options = args.reduce((acc, arg) => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.replace('--', '').split('=');
      acc[camelCase(key)] = value || true;
      return acc;
    }
    // @ts-ignore
    acc.paths.push(arg);
    return acc;
  }, { paths: [] });
  if (options.help || options.paths.length === 0) {
    require('./usage').default();
    return;
  }
  const currentPath = process.cwd();
  const currentPathPosix = path.posix.normalize(currentPath);
  const fullPaths = options.paths.map(arg => path.posix.normalize(path.resolve(currentPath, arg)));
  if (options.testPath && options.testPath != '@' && !fs.existsSync(options.testPath)) { 
    fs.mkdirSync(options.testPath);
  }
  let testRoot = [options.testPath, 'test', 'tests'].reduce((acc, dir) => {
    if (acc || !dir) {
      return acc;
    }
    if(dir === '@') return dir;
    const possibleTestRoot = path.join(currentPath, dir);
    const exists = fs.existsSync(possibleTestRoot);
    if(!exists) return acc;
    const stat = fs.statSync(possibleTestRoot);
    const isDirAndExists =  stat.isDirectory();
    if (isDirAndExists) return dir.replace(/\\/g, '/');
    return acc;
  }, '');
  if (!testRoot) {
    const promptResult = await inquirer.prompt([{ type: 'input', name: 'testRoot', message: 'Enter the test root path' }]);
    testRoot = promptResult.testRoot;
    if (testRoot != '@' && testRoot) {      
      if(!fs.existsSync(testRoot) || !fs.statSync(testRoot).isDirectory()) {
        fs.mkdirSync(testRoot);
      }
    }
  }
  const buildTestPathFor = (fullPath) => { 
    console.log('[buildTestPathFor] testRoot:', testRoot);
    if (testRoot === '@') {
      const fullTestPath = fullPath.replace(/[.]([tj]s)x?$/, '.test.$1');
      console.log('fullTestPath:', fullTestPath);
      return fullTestPath;
    }
    const relativePath = path.relative(currentPathPosix, fullPath).replace(/\\/g, '/');
    const fullTestPath = path.join(`${testRoot}`, relativePath.replace(/^src\//, ''));
    console.log('relativePath:', relativePath);
    console.log('fullTestPath:', fullTestPath);
    const testDir = path.dirname(fullTestPath);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    return fullTestPath.replace(/[.]([tj]s)x?$/, '.test.$1');
  };
  const buildTestFileFor = async (fullPath, fullTestPath) => { 
    const generateImportFor = (fullPath, fullTestPath, importName) => {
      const relativePath = path.relative(fullTestPath, fullPath).replace(/\\/g, '/');
      console.log('relativePath:', relativePath);
      return `import ${importName} from '${relativePath.replace(/[.][tj]sx?$/,'')}';`;
    };
    const getDefaultExportName = async (fileContent) => { 
      const imported = require(fullPath);
      let name = '';
      let _import = '';
      if (typeof imported.default === 'function') {
        name = imported.default.name;
        _import = name;
      }
      else if (typeof imported === 'function') {
        name = imported.name;
        _import = name;
      }
      else if (typeof imported === 'object') {
        const keys = Object.keys(imported);
        if (keys.length === 1) {
          name = keys[0];
          _import = '{' + name + '}';
        }
      }
      return {name, import: _import };
    };
    const fileContent = fs.readFileSync(fullPath, 'utf-8').toString();
    const defaultExportName = await getDefaultExportName(fileContent);
    const content = [
      `${generateImportFor(fullPath, fullTestPath, defaultExportName.import)}`,
      '',
      `describe('${defaultExportName.name}', () => {`,
      `  it('should work', () => {`,
      `    // TODO: Implement test for ${defaultExportName.name}`,
      `  });`,
      `});`
    ].join('\n');
    fs.writeFileSync(fullTestPath, content);
  };
  const isScriptFile = (fullPath) => {
    const ext = path.extname(fullPath).toLowerCase();
    return ['.js', '.ts', '.jsx', '.tsx', '.mjs'].includes(ext);
  };
  const iterateThroughPaths = (fullPaths) => { 
    for (let index = 0; index < fullPaths.length; index++) {
      const fullPath = fullPaths[index];
      if (!fs.existsSync(fullPath)) {
        console.warn(`\x1b[33m[warn] File not found: ${fullPath}\x1b[0m`);
        continue;
      }
      // if is dir iterate through all files
      if (fs.statSync(fullPath).isDirectory()) { 
        const files = fs.readdirSync(fullPath);
        const fullFiles = files.map(file => path.join(fullPath, file));
        iterateThroughPaths(fullFiles);
        continue;
      }
      if (!isScriptFile(fullPath)) {
        console.warn(`\x1b[33m[warn] Ignored: ${fullPath}\x1b[0m`);
        continue;
      }
      const fullTestPath = buildTestPathFor(fullPath);
      buildTestFileFor(fullPath, fullTestPath);
    }
  };
  iterateThroughPaths(fullPaths);
}
module.exports.default = main;