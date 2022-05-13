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
      content = content.replaceAll('##_CLI_VERSION_##', packageJson.version)
      content = content.replaceAll('##_SDK_VERSION_##', packageJson.devDependencies['koinos-sdk-as'])
      content = content.replaceAll('##_MOCK_VM_VERSION_##', packageJson.devDependencies['koinos-mock-vm'])

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
  .argument('<buildMode>', 'Build mode debug or realease')
  .argument('<protoFileNames...>', 'Name of the contract proto files')
  .option('--generate_authorize', 'generate the authorize entry point')
  .action((buildMode, protoFileNames, options) => {
    const generateAuthEndpoint = options.generate_authorize ? isWin ? 'set GENERATE_AUTHORIZE_ENTRY_POINT=1&&' : 'GENERATE_AUTHORIZE_ENTRY_POINT=1 ' : ''
    const includeKoinosChainAuth = generateAuthEndpoint ? 'koinos/chain/authority.proto' : ''

    // to make it easier for dapps devs, the first proto filename is considered to be the contract proto file
    // that's the only one for which we auto populate the contract path
    // the rest must have the full path to the proto files
    protoFileNames[0] = `assembly/proto/${protoFileNames[0]}`

    // compile proto file
    console.log(chalk.green('Generating ABI file...'))
    let cmd = `${generateAuthEndpoint} yarn protoc --plugin=protoc-gen-abi=${koinoABIGenPath} --abi_out=abi/ ${protoFileNames.join(' ')} ${includeKoinosChainAuth}`
    console.log(chalk.blue(cmd))
    execSync(cmd, { stdio: 'inherit' })

    console.log(chalk.green('Generating proto files...'))
    cmd = `yarn protoc --plugin=protoc-gen-as=${ASProtoGenPath} --as_out=. assembly/proto/*.proto`
    console.log(chalk.blue(cmd))
    execSync(cmd, { stdio: 'inherit' })

    // Generate CONTRACT.boilerplate.ts and index.ts files
    console.log(chalk.green('Generating boilerplate.ts and index.ts files...'))
    cmd = `${generateAuthEndpoint}yarn protoc --plugin=protoc-gen-as=${koinosASGenPath} --as_out=assembly/ ${protoFileNames[0]}`
    console.log(chalk.blue(cmd))
    execSync(cmd, { stdio: 'inherit' })

    // compile index.ts
    console.log(chalk.green('Compiling index.ts...'))
    cmd = `node ./node_modules/assemblyscript/bin/asc assembly/index.ts --target ${buildMode} --use abort= --config asconfig.json`
    console.log(chalk.blue(cmd))
    execSync(cmd, { stdio: 'inherit' })
  })

program.command('build')
  .description('Build index.ts file')
  .argument('<buildMode>', 'Build mode debug or realease')
  .action((buildMode) => {
    // compile index.ts
    console.log(chalk.green('Compiling index.ts...'))
    const cmd = `node ./node_modules/assemblyscript/bin/asc assembly/index.ts --target ${buildMode} --use abort= --config asconfig.json`
    console.log(chalk.blue(cmd))
    execSync(cmd, { stdio: 'inherit' })
  })

program.command('generate-abi')
  .description('Generate ABI files')
  .argument('<protoFileNames...>', 'Name of the contract proto files')
  .action((protoFileNames) => {
    // to make it easier for dapps devs, the first proto filename is considered to be the contract proto file
    // that's the only one for which we auto populate the contract path
    // the rest must have the full path to the proto files
    protoFileNames[0] = `assembly/proto/${protoFileNames[0]}`

    // compile proto file
    console.log(chalk.green('Generating ABI file...'))
    const cmd = `yarn protoc --plugin=protoc-gen-abi=${koinoABIGenPath} --abi_out=abi/ ${protoFileNames.join(' ')}`
    console.log(chalk.blue(cmd))
    execSync(cmd, { stdio: 'inherit' })
  })

program.command('generate-contract-as')
  .description('Generate contract.boilerplate.ts and index.ts files')
  .argument('<protoFileNames...>', 'Name of the contract proto files')
  .option('--generate_authorize', 'generate the authorize entry point')
  .action((protoFileNames, options) => {
    const generateAuthEndpoint = options.generate_authorize ? isWin ? 'set GENERATE_AUTHORIZE_ENTRY_POINT=1&&' : 'GENERATE_AUTHORIZE_ENTRY_POINT=1 ' : ''

    // to make it easier for dapps devs, the first proto filename is considered to be the contract proto file
    // that's the only one for which we auto populate the contract path
    // the rest must have the full path to the proto files
    protoFileNames[0] = `assembly/proto/${protoFileNames[0]}`

    // Generate CONTRACT.boilerplate.ts and index.ts files
    console.log(chalk.green('Generating boilerplate.ts and index.ts files...'))
    const cmd = `${generateAuthEndpoint}yarn protoc --plugin=protoc-gen-as=${koinosASGenPath} --as_out=assembly/ ${protoFileNames.join(' ')}`
    console.log(chalk.blue(cmd))
    execSync(cmd, { stdio: 'inherit' })
  })

program.command('generate-contract-proto')
  .description('Generate AS files for the contract proto files')
  .action(() => {
    // compile proto file
    console.log(chalk.green('Generating Contract AS proto files...'))
    const cmd = `yarn protoc --plugin=protoc-gen-as=${ASProtoGenPath} --as_out=. assembly/proto/*.proto`
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
  .action(() => {
    console.log(chalk.green('Running tests...'))
    const cmd = 'yarn asp --verbose --config as-pect.config.js'
    console.log(chalk.blue(cmd))
    execSync(cmd, { stdio: 'inherit' })
  })

program.command('create')
  .description('Create a boilerplate contract')
  .argument('<contractName>', 'Name of the contract to create')
  .action((contractName) => {
    const protoPackageName = contractName.toLowerCase().trim()
    const templatePath = path.join(__dirname, '..', '__template__')
    const tartgetPath = path.join(CURR_DIR, protoPackageName)
    console.log(chalk.green(`Generating contract at "${tartgetPath}" ...`))

    if (!createProject(tartgetPath)) {
      return
    }

    contractName = contractName.charAt(0).toUpperCase() + contractName.slice(1)

    createDirectoryContents(templatePath, protoPackageName, contractName, protoPackageName)

    console.log('')
    console.log(chalk.green('Contract successfully generated!'))
    console.log('')
    console.log(chalk.green("You're all set! Run the following set of commands to verify that the generated contract is correctly setup:"))
    console.log('')
    console.log(chalk.blue(`  cd ${tartgetPath} && yarn install && yarn build:debug && yarn test`))
    console.log('')
  })

program.parse()
