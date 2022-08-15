const { ethers, upgrades } = require("hardhat");

async function main() {

  const TokenFactory = await ethers.getContractFactory("MyToken");
    const token = await upgrades.deployProxy(TokenFactory, [], {
      initializer: 'initialize',
      kind: 'uups',
    });
    await token.deployed();


  console.log("First version deployed to: ", token.address);

  const TokenFactoryV2 = await ethers.getContractFactory("MyToken2");
  await upgrades.upgradeProxy(token.address, TokenFactoryV2)

  console.log("Succesfully upgraded")

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
