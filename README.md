# Sample Bad ERC20 Token

This project demonstrates just a liitle amount of all of the possible issues that developer can create while writing in Solidity

To run the tests you can simply clon the repo and:

```shell
yarn install
yarn hardhat test
yarn hardhat coverage
```

Notice, 3 tests should fail due to the errors in V1 token, same tests succesfully run with V2

The system is upgradeable ERC20 token, repo contains bad implementation (V1) and the implementation with the fixed issues (V2)

All the issues are marked with @audit tag