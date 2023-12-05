![Test Ubuntu](https://github.com/roaminro/koinos-sdk-as-cli/actions/workflows/test-ubuntu.yml/badge.svg)
![Test Windows](https://github.com/roaminro/koinos-sdk-as-cli/actions/workflows/test-windows.yml/badge.svg)
![Test MacOS](https://github.com/roaminro/koinos-sdk-as-cli/actions/workflows/test-macos.yml/badge.svg)


## Installation

```sh
# with npm
npm install -g @roamin/sdk-as-cli

# with yarn
yarn global add @roamin/sdk-as-cli
```

## Create a contract boilerplate
```sh
# will create "mycontract" in the current working folder
koinos-sdk-as-cli create mycontract
```

## Important note
- It important that your smart contract file lives in the `assembly` folder of your project. (i.e.: `assembly/Calculator.ts`)
- And, it is also important that your `proto` files live in the `assembly/proto/` folder of your project. (i.e.: `assembly/proto/calculator.proto`)

## Help
```sh
koinos-sdk-as-cli help
```
## Build a contract
```sh
# example for building a calculator contract
# build the debug version
koinos-sdk-as-cli build-all debug calculator.proto 

# build the release version
koinos-sdk-as-cli build-all release calculator.proto 
```

This will result in the generation of:

- a `calculator.abi` file in the folder `abi/`
- a `calculator-abi.json` file in the folder `abi/`
- a `contract.wasm` file in the folder `build/release` and `build/debug`
- an `index.ts` file in the folder `assembly/`
- a `Calculator.boilerplate.ts` file in the folder `assembly/`
  
## Generate ABI file
```sh
# example for a calculator contract
koinos-sdk-as-cli generate-abi calculator.proto
```
This will generate a calculator.abi file in the folder `abi/`

## Generate contract.boilerplate.ts and index.ts files
```sh
# example for a calculator contract
koinos-sdk-as-cli generate-contract-as calculator.proto
```

This will generate a `Calculator.boilerplate.ts`file and `index.ts` file in the folder `assembly/`

## Generate AssemblyScript files for all the proto files of a contract
```sh
koinos-sdk-as-cli generate-contract-proto
```

## Generate AS files for the given proto files
```sh
# example for a calculator contract
koinos-sdk-as-cli generate-as-proto calculator/assembly/proto/calculator.proto
```

## Run tests
```sh
koinos-sdk-as-cli run-tests
```