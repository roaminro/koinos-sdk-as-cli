const { program } = require('commander')
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const { execSync } = require('child_process')
const packageJson = require('../package.json')

let ASProtoGenPath
let koinoABIGenPath
let koinosASGenPath

let isWin = false

switch (process.platform) {
  case 'win32':
    isWin = true
    ASProtoGenPath = '.\\node_modules\\.bin\\as-proto-gen.cmd'
    koinoABIGenPath = '.\\node_modules\\.bin\\koinos-abi-proto-gen.cmd'
    koinosASGenPath = '.\\node_modules\\.bin\\koinos-as-gen.cmd'
    break
  default:
    ASProtoGenPath = './node_modules/.bin/as-proto-gen'
    koinoABIGenPath = './node_modules/.bin/koinos-abi-proto-gen'
    koinosASGenPath = './node_modules/.bin/koinos-as-gen'
    break
}

// list of file/folder that should not be copied
const SKIP_FILES = ['node_modules', '.template.json']
const CURR_DIR = process.cwd()

function createProject (projectPath) {
  if (fs.existsSync(projectPath)) {
    console.log(chalk.red(`Folder ${projectPath} already exists. Delete or use another contract name.`))
    return false
  }

  fs.mkdirSync(projectPath)
  return true
}

function createDirectoryContents (templatePath, projectName, contractName, protoPackageName) {
  // read all files/folders (1 level) from template folder
  const filesToCreate = fs.readdirSync(templatePath)
  // loop each file/folder
  filesToCreate.forEach(file => {
    const origFilePath = path.join(templatePath, file)

    // get stats about the current file
    const stats = fs.statSync(origFilePath)

    // skip files that should not be copied
    if (SKIP_FILES.indexOf(file) > -1) return

    let destFile = file.replaceAll('##_CONTRACT_NAME_##', contractName)
    destFile = destFile.replaceAll('##_PROTO_PACKAGE_##', protoPackageName)

    if (stats.isFile()) {
      // read file content and transform it using template engine
      let content = fs.readFileSync(origFilePath, 'utf8')
      content = content.replaceAll('##_CONTRACT_NAME_##', contractName)
      content = content.replaceAll('##_PROTO_PACKAGE_##', protoPackageName)

      // write file to destination folder
      const writePath = path.join(CURR_DIR, projectName, destFile)
      fs.writeFileSync(writePath, content, 'utf8')
    } else if (stats.isDirectory()) {
      // create folder in destination folder
      fs.mkdirSync(path.join(CURR_DIR, projectName, destFile))
      // copy files/folder inside current folder recursively
      createDirectoryContents(path.join(templatePath, file), path.join(projectName, destFile), contractName, protoPackageName)
    }
  })
}

program
  .name('Koinos AssemblyScript Smart Contracts CLI')
  .description('CLI to build Koinos Smart Contracts in AssemblyScript')
  .version(packageJson.version)

program.command('build-all')
  .description('Build all Smart Contract files')
  .argument('<contractFolderPath>', 'Path to the contract folder')
  .argument('<buildMode>', 'Build mode debug or realease')
  .argument('<protoFileNames...>', 'Name of the contract proto files')
  .option('--generate_authorize', 'generate the authorize entry point')
  .action((contractFolderPath, buildMode, protoFileNames, options) => {
    const generateAuthEndpoint = options.generate_authorize ? isWin ? 'set GENERATE_AUTHORIZE_ENTRY_POINT=1&&' : 'GENERATE_AUTHORIZE_ENTRY_POINT=1 ' : ''
    const includeKoinosChainAuth = generateAuthEndpoint ? 'koinos/chain/authority.proto' : ''

    // to make it easier for dapps devs, the first proto filename is considered to be the contract proto file
    // that's the only one for which we auto populate the contract path
    // the rest must have the full path to the proto files
    protoFileNames[0] = `${contractFolderPath}/assembly/proto/${protoFileNames[0]}`

    // compile proto file
    console.log(chalk.green('Generating ABI file...'))
    let cmd = `${generateAuthEndpoint} yarn protoc --plugin=protoc-gen-abi=${koinoABIGenPath} --abi_out=${contractFolderPath}/abi/ ${protoFileNames.join(' ')} ${includeKoinosChainAuth}`
    console.log(chalk.blue(cmd))
    execSync(cmd, { stdio: 'inherit' })

    console.log(chalk.green('Generating proto files...'))
    cmd = `yarn protoc --plugin=protoc-gen-as=${ASProtoGenPath} --as_out=. ${contractFolderPath}/assembly/proto/*.proto`
    console.log(chalk.blue(cmd))
    execSync(cmd, { stdio: 'inherit' })

    // Generate CONTRACT.boilerplate.ts and index.ts files
    console.log(chalk.green('Generating boilerplate.ts and index.ts files...'))
    cmd = `${generateAuthEndpoint}yarn protoc --plugin=protoc-gen-as=${koinosASGenPath} --as_out=${contractFolderPath}/assembly/ ${protoFileNames[0]}`
    console.log(chalk.blue(cmd))
    execSync(cmd, { stdio: 'inherit' })

    // compile index.ts
    console.log(chalk.green('Compiling index.ts...'))
    cmd = `node ./node_modules/assemblyscript/bin/asc ${contractFolderPath}/assembly/index.ts --target ${buildMode} --use abort= --config ${contractFolderPath}/asconfig.json`
    console.log(chalk.blue(cmd))
    execSync(cmd, { stdio: 'inherit' })
  })

program.command('build')
  .description('Build index.ts file')
  .argument('<contractFolderPath>', 'Path to the contract folder')
  .argument('<buildMode>', 'Build mode debug or realease')
  .action((contractFolderPath, buildMode) => {
    // compile index.ts
    console.log(chalk.green('Compiling index.ts...'))
    const cmd = `node ./node_modules/assemblyscript/bin/asc ${contractFolderPath}/assembly/index.ts --target ${buildMode} --use abort= --config ${contractFolderPath}/asconfig.json`
    console.log(chalk.blue(cmd))
    execSync(cmd, { stdio: 'inherit' })
  })

program.command('generate-abi')
  .description('Generate ABI files')
  .argument('<contractFolderPath>', 'Path to the contract folder')
  .argument('<protoFileNames...>', 'Name of the contract proto files')
  .action((contractFolderPath, protoFileNames) => {
    // to make it easier for dapps devs, the first proto filename is considered to be the contract proto file
    // that's the only one for which we auto populate the contract path
    // the rest must have the full path to the proto files
    protoFileNames[0] = `${contractFolderPath}/assembly/proto/${protoFileNames[0]}`

    // compile proto file
    console.log(chalk.green('Generating ABI file...'))
    const cmd = `yarn protoc --plugin=protoc-gen-abi=${koinoABIGenPath} --abi_out=${contractFolderPath}/abi/ ${protoFileNames.join(' ')}`
    console.log(chalk.blue(cmd))
    execSync(cmd, { stdio: 'inherit' })
  })

program.command('generate-contract-as')
  .description('Generate contract.boilerplate.ts and index.ts files')
  .argument('<contractFolderPath>', 'Path to the contract folder')
  .argument('<protoFileName>', 'Name of the contract proto file')
  .argument('<additionalProtoFileNames...>', 'Name of the additional proto files')
  .option('--generate_authorize', 'generate the authorize entry point')
  .action((contractFolderPath, protoFileName, additionalProtoFileNames, options) => {
    const generateAuthEndpoint = options.generate_authorize ? isWin ? 'set GENERATE_AUTHORIZE_ENTRY_POINT=1&&' : 'GENERATE_AUTHORIZE_ENTRY_POINT=1 ' : ''

    // Generate CONTRACT.boilerplate.ts and index.ts files
    console.log(chalk.green('Generating boilerplate.ts and index.ts files...'))
    const cmd = `${generateAuthEndpoint}yarn protoc --plugin=protoc-gen-as=${koinosASGenPath} --as_out=${contractFolderPath}/assembly/ ${contractFolderPath}/assembly/proto/${protoFileName} ${additionalProtoFileNames.join(' ')}`
    console.log(chalk.blue(cmd))
    execSync(cmd, { stdio: 'inherit' })
  })

program.command('generate-contract-proto')
  .description('Generate AS files for the contract proto files')
  .argument('<contractFolderPath>', 'Path to the contract folder')
  .argument('<additionalProtoFileNames...>', 'Name of the additional proto files')
  .action((contractFolderPath, additionalProtoFileNames) => {
    // compile proto file
    console.log(chalk.green('Generating Contract AS proto files...'))
    const cmd = `yarn protoc --plugin=protoc-gen-as=${ASProtoGenPath} --as_out=. ${contractFolderPath}/assembly/proto/*.proto ${additionalProtoFileNames.join(' ')}`
    console.log(chalk.blue(cmd))
    execSync(cmd, { stdio: 'inherit' })
  })

program.command('generate-as-proto')
  .description('Generate AS files for the given proto files')
  .argument('<protoFileNames...>', 'Name of the proto files to compile')
  .action((protoFileNames) => {
    // compile proto files
    console.log(chalk.green('Generating AS proto files...'))
    const cmd = `yarn protoc --plugin=protoc-gen-as=${ASProtoGenPath} --as_out=. ${protoFileNames.join(' ')}`
    console.log(chalk.blue(cmd))
    execSync(cmd, { stdio: 'inherit' })
  })

program.command('run-tests')
  .description('Run contract tests')
  .argument('<contractFolderPath>', 'Path to the contract folder')
  .action((contractFolderPath) => {
    console.log(chalk.green('Running tests...'))
    const cmd = `yarn asp --verbose --config ${contractFolderPath}/as-pect.config.js`
    console.log(chalk.blue(cmd))
    execSync(cmd, { stdio: 'inherit' })
  })

program.command('generate')
  .description('Generate a boilerplate contract')
  .argument('<contractName>', 'Name of the contract to generate')
  .action((contractName) => {
    const templatePath = path.join(__dirname, '..', '__template__')
    const tartgetPath = path.join(CURR_DIR, contractName)
    console.log(chalk.green(`Generating contract at "${tartgetPath}"`))

    if (!createProject(tartgetPath)) {
      return
    }

    const protoPackageName = contractName.toLowerCase()
    contractName = contractName.charAt(0).toUpperCase() + contractName.slice(1)

    createDirectoryContents(templatePath, contractName, contractName, protoPackageName)

    console.log(chalk.green('Contract successfully generated!'))
    console.log(chalk.blue(`cd ${tartgetPath} && yarn install && yarn build:debug && yarn test`))
  })

program.parse()
