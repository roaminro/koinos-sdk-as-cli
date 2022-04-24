![Test Ubuntu](https://github.com/roaminroe/koinos-sdk-as-cli/actions/workflows/test-ubuntu.yml/badge.svg)
![Test Windows](https://github.com/roaminroe/koinos-sdk-as-cli/actions/workflows/test-windows.yml/badge.svg)
![Test MacOS](https://github.com/roaminroe/koinos-sdk-as-cli/actions/workflows/test-macos.yml/badge.svg)


## Installation

```sh
# with npm
npm install -g koinos-sdk-as-cli

# with yarn
yarn global add koinos-sdk-as-cli
```

## Create a contract boilerplate
```sh
# will create "mycontract" in the current working folder
koinos-sdk-as-cli create mycontract
```

## Important note
- It important that your smart contract file lives in the `assembly` folder of your project. (i.e.: `./calculator/assembly/Calculator.ts`)
- And, it is also important that your `proto` files live in the `assembly/proto/` folder of your project. (i.e.: `./calculator/assembly/proto/calculator.proto`)

## Help
```sh
koinos-sdk-as-cli help
```
## Build a contract
```sh
# example for building a calculator contract
# build the debug version
koinos-sdk-as-cli build-all calculator debug calculator.proto 

# build the release version
koinos-sdk-as-cli build-all calculator release calculator.proto 
```

This will result in the generation of:

- a `calculator.abi` file in the folder `calculator/abi/`
- a `calculator-abi.json` file in the folder `calculator/abi/`
- a `contract.wasm` file in the folder `calculator/build/release` and `calculator/build/debug`
- an `index.ts` file in the folder `calculator/assembly/`
- a `Calculator.boilerplate.ts` file in the folder `calculator/assembly/`
  
## Generate ABI file
```sh
# example for the calculator contract
koinos-sdk-as-cli generate-abi calculator calculator.proto
```
This will generate a calculator.abi file in the folder `calculator/abi/`

## Generate contract.boilerplate.ts and index.ts files
```sh
# example for the calculator contract
koinos-sdk-as-cli generate-contract-as calculator calculator.proto
```

This will generate a `Calculator.boilerplate.ts`file and `index.ts` file in the folder `calculator/assembly/`

## Generate AssemblyScript files for all the proto files of a contract
```sh
# example for the calculator contract
koinos-sdk-as-cli generate-contract-proto calculator
```

## Generate AS files for the given proto files
```sh
# example for the calculator contract
koinos-sdk-as-cli generate-as-proto calculator/assembly/proto/calculator.proto
```

## Run tests
```sh
# example for the calculator contract
koinos-sdk-as-cli run-tests calculator
```