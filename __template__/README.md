# ##_CONTRACT_NAME_##

## Build
```sh
# build the debug version
yarn build:debug
# or
yarn exec koinos-sdk-as-cli build-all ##_CONTRACT_NAME_## debug ##_PROTO_PACKAGE_##.proto 

# build the release version
yarn build:release
# or
yarn exec koinos-sdk-as-cli build-all ##_CONTRACT_NAME_## release ##_PROTO_PACKAGE_##.proto 
```

## Test
```sh
yarn test
# or
yarn exec koinos-sdk-as-cli run-tests ##_CONTRACT_NAME_##
```