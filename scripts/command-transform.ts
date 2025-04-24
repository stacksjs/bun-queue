import fs from 'node:fs'
import path from 'node:path'
import { argv } from 'node:process'

const readFile = fs.promises.readFile
const writeFile = fs.promises.writeFile
const readdir = fs.promises.readdir

async function loadScripts(readDir: string, writeDir: string) {
  const normalizedDir = path.normalize(readDir)
  const files = await readdir(normalizedDir)
  const luaFiles = files.filter(file => path.extname(file) === '.lua')
  const writeFilenamePath = path.normalize(writeDir)

  if (!fs.existsSync(writeFilenamePath)) {
    fs.mkdirSync(writeFilenamePath)
  }

  let indexContent = ''

  if (luaFiles.length === 0) {
    /**
     * To prevent unclarified runtime error "updateDelayset is not a function
     * @see https://github.com/OptimalBits/bull/issues/920
     */
    throw new Error('No .lua files found!')
  }

  for (let i = 0; i < luaFiles.length; i++) {
    const completedFilename = path.join(normalizedDir, luaFiles[i])
    const longName = path.basename(luaFiles[i], '.lua')
    indexContent += `export * from './${longName}';\n`

    await loadCommand(completedFilename, longName, writeFilenamePath)
  }

  await writeFile(path.join(writeFilenamePath, 'index.ts'), indexContent)
}

async function loadCommand(filename: string, longName: string, writeFilenamePath: string) {
  const filenamePath = path.resolve(filename)
  const content = (await readFile(filenamePath)).toString()
  const [name, num] = longName.split('-')
  const numberOfKeys = num && Number.parseInt(num, 10)
  const newContent = `const content = \`${content}\`;
export const ${name} = {
  name: '${name}',
  content,${numberOfKeys
      ? `
  keys: ${numberOfKeys},`
      : ''
  }
};
`
  await writeFile(path.join(writeFilenamePath, `${longName}.ts`), newContent)
}

loadScripts(argv[2], argv[3])
