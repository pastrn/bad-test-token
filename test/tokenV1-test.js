const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

//Tests for the first version of token
describe("V1 token", function() {
  const oneEther = ethers.utils.parseEther("1")
  async function dep() {
    const [ deployer, addr1 ] = await ethers.getSigners();

    const TokenFactory = await ethers.getContractFactory("MyToken");
    const token = await upgrades.deployProxy(TokenFactory, [], {
      initializer: 'initialize',
      kind: 'uups',
    });
    await token.deployed();

    return { token, deployer, addr1 }
  }

  it("Succesfully initializes", async () => {
    const { token, deployer } = await loadFixture(dep);
    const tokenAttributes = ["MyToken", "MTK"]
    expect(await token.balanceOf(deployer.address)).to.eq(oneEther);
    expect(await token.owner()).to.eq(deployer.address)
    expect(await token.name()).to.eq(tokenAttributes[0])
    expect(await token.symbol()).to.eq(tokenAttributes[1])
  })

  describe("Work with Eth", async () => {

    //fails in V1 due to contract errors
    it("Reverts if ETH sending value is zero", async () => {
      const { token } = await loadFixture(dep)
      await expect(token.deposit()).to.be.reverted;
    })
  
    it("Correctly stores data about deposited ETH", async () => {
      const { token, deployer } = await loadFixture(dep)
      await token.deposit({ value : oneEther })
      const deposit = await token.getEthBalance(deployer.address)
      expect(deposit).to.eq(oneEther)
    })
  
    it("Allows to correctly deposit and withdraw ETH", async () => {
      const { token } = await loadFixture(dep)
      const startingEthBalance = await token.provider.getBalance(
        token.address
      );
      await token.deposit({ value : oneEther })
      const contractBalanceWithDeposit = await token.provider.getBalance(
        token.address
      );
      expect(contractBalanceWithDeposit).to.eq(oneEther)
      await token.withdrawBalance()
      const tokenBalanceAfterWithdrawal = await token.provider.getBalance(
        token.address
      );
      expect(startingEthBalance).to.eq(tokenBalanceAfterWithdrawal)
    })

    it("Allows the owner to withdraw all the contract's balance", async () => {
      const { token, deployer } = await loadFixture(dep)
      const accounts = await ethers.getSigners()
      const startingEthBalance = await token.provider.getBalance(
        token.address
      );
      for (let i = 1; i < 6; i++) {
        const tokenConnectedContract = await token.connect(accounts[i]);
        await tokenConnectedContract.deposit({ value: oneEther });
      }
      const tokenBalancesWithDeposit = await token.provider.getBalance(
        token.address
      );
      expect(tokenBalancesWithDeposit).to.eq(ethers.utils.parseEther("5"))
      await token.withdrawAll()
      const tokenBalanceAfterWithdrawal = await token.provider.getBalance(
        token.address
      );
      expect(startingEthBalance).to.eq(tokenBalanceAfterWithdrawal)
    })
  })

  describe("Work with tokens", async () => {

    //fails in V1 due to contract errors
    it("Correctly mints tokens", async () => {
      const { token, deployer } = await loadFixture(dep)
      const startingOwnerBalance = await token.balanceOf(deployer.address)
      await token.mint(deployer.address, oneEther)
      const afterMintOwnerBalance = await token.balanceOf(deployer.address)
      expect(startingOwnerBalance.add(oneEther)).to.eq(afterMintOwnerBalance)
    })

    it("Correctly approves token transfer", async () => {
      const { token, deployer, addr1 } = await loadFixture(dep)
      const startingAllowances = await token.allowance(deployer.address, addr1.address)
      await token.increaseAllowance(addr1.address, oneEther)
      const afterAllowance = await token.allowance(deployer.address, addr1.address)
      expect(startingAllowances.add(oneEther)).to.eq(afterAllowance)
    })

    it("Correctly transfers tokens", async () => {
      const { token, deployer, addr1 } = await loadFixture(dep)
      const startingOwnerBalance = await token.balanceOf(deployer.address)
      const startingUserBalance = await token.balanceOf(addr1.address)
      await token.increaseAllowance(addr1.address, oneEther)
      await token.transfer(addr1.address, oneEther)
      const afterOwnerBalance = await token.balanceOf(deployer.address)
      const afterUserBalance = await token.balanceOf(addr1.address)
      expect(startingOwnerBalance.sub(oneEther)).to.eq(afterOwnerBalance)
      expect(startingUserBalance.add(oneEther)).to.eq(afterUserBalance)
    })

    it("Correctly burns tokens", async () => {
      const { token, deployer } = await loadFixture(dep)
      const startingOwnerBalance = await token.balanceOf(deployer.address)
      await token.burn(oneEther)
      const afterOwnerBalance = await token.balanceOf(deployer.address)
      expect(afterOwnerBalance.add(oneEther)).to.eq(startingOwnerBalance)
    })

    it("Correctly distributes lottery rewards to make holder rich", async () => {
      const { token, addr1 } = await loadFixture(dep)
      const totalSupply = await token.totalSupply()
      const startingHolderBalance = await token.balanceOf(addr1.address)
      await token.makeHolderRich(addr1.address)
      const afterHolderBalance = await token.balanceOf(addr1.address)
      expect(startingHolderBalance.add(totalSupply.toString())).to.eq(afterHolderBalance)
    })
  })

  describe("Admin's functionality", () => {
    it("Correctly pauses", async () => {
      const { token } = await loadFixture(dep)
      await token.pause()
      const pauseStatus = await token.paused()
      expect(pauseStatus).to.eq(true)
    })

    it("Correctly unpauses", async () => {
      const { token } = await loadFixture(dep)
      await token.pause()
      const pauseStatus = await token.paused()
      expect(pauseStatus).to.eq(true)
      await token.unpause()
      const unpauseStatus = await token.paused()
      expect(unpauseStatus).to.eq(false)
    })

    //fails in V1 due to contract errors
    it("Allows to withdraw all only to the owner", async () => {
      const { token, addr1 } = await loadFixture(dep)
      const connectedAttackerContract = await token.connect(addr1)
      await expect(connectedAttackerContract.withdrawAll()).to.be.reverted
    })
  })
});

