# ##_CONTRACT_NAME_##

## Build
```sh
# build the debug version
yarn build:debug
# or
yarn exec koinos-sdk-as-cli build-all debug 0 ##_PROTO_PACKAGE_##.proto 

# build the release version
yarn build:release
# or
yarn exec koinos-sdk-as-cli build-all release 0 ##_PROTO_PACKAGE_##.proto 
```

## Test
```sh
yarn test
# or
yarn exec koinos-sdk-as-cli run-tests
```