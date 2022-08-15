// SPDX-License-Identifier: MIT
//  @audit SWC-103, Floating pragma
//  Pragma statement should be locked before the final deployement
pragma solidity ^0.8.0; 

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title Token contract with some additional unsafe functionality
/// @author pstrn
/// @notice Never use in production, code has a lot of issues
/// @notice All the issues marked in NatSpec comments with @audit tag
/// @notice Commonly known issues refer to SWC registry (https://swcregistry.io)

contract MyToken is
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    PausableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{

    /// @notice mapping to store data about deposited ETH
    //  @audit SWC-108, variable default visibility
    //  State variables default visibility should be specified
    //  It is internal by default, but specification makes the
    //  code easier to read and debug
    mapping(address => uint) ethBalances; 


    /// @notice standart initializer function
    /// @notice mints one million tokens to the deployer
    function initialize() public initializer {
        __ERC20_init("MyToken", "MTK");
        __ERC20Burnable_init();
        __Pausable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
        _mint(msg.sender, 1 * 10**decimals());
    }

    /// @notice allows owner to implement a lottery to make one holder rich
    //  @audit SWC-101, possible integer overflow
    //  All the tokens are denominated, one token equals to 1*10**18, so
    //  in case that totalSupply will be big enough, function will fail
    function makeHolderRich(address _lucker) external onlyOwner {
        _mint(_lucker, totalSupply()); 
    }

    /// @notice allows owner to withdraw contract's ETH balance
    //  @audit SWC-105, unprotected ETH withdrawal
    //  Anyone can withdraw the contract's balance
    function withdrawAll() external payable {
        (bool success, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(success, "Call failed");
    }

    /// @notice returns current ETH balance of the user
    /// @param owner, the address to return balance of
    function getEthBalance(address owner) external view returns(uint) {
        return ethBalances[owner];
    }

    /// @notice allows user to deposit ETH to contract
    //  @audit missing zero value validation
    //  Currently, zero value can be sent as a deposit
    //  @audit public function that is never called in the contract
    //  can be declared external to save Gas
    function deposit() public payable {
        ethBalances[msg.sender] += msg.value;
    }

    /// @notice allows user to withdraw his ETH from contract
    //  @audit SWC-107, Reentrancy 
    //  State variable ethBalances is written after the call
    //  this makes reentrancy attack possible for this function
    //  @audit public function that is never called in the contract
    //  can be declared external to save Gas
    function withdrawBalance() public {
        uint bal = ethBalances[msg.sender];
        require(bal > 0);

        (bool sent, ) = msg.sender.call{value: bal}("");
        require(sent, "Failed to send Ether");

        ethBalances[msg.sender] = 0;
    }


    /// @notice allows owner to pause the contract ICE
    //  @audit redundant functionality. At the moment pause is never used in the contract
    //  @audit public function that is never called in the contract
    //  can be declared external to save Gas
    function pause() public onlyOwner {
        _pause();
    }

    /// @notice allows owner to unpause the contract
    //  @audit public function that is never called in the contract
    //  can be declared external to save Gas
    function unpause() public onlyOwner {
        _unpause();
    }

    /// @notice allows owner to mint more tokens
    /// @param to, address to mint tokens to
    /// @param amount, amount of tokens to mint
    //  @audit require statement is redundant, uint is always >= 0
    //  @audit multiplication of minting amount is also redundant, all token operations
    //  are implemented in token denomination. One token is 1*10**18 tokens in the
    //  transaction of this contract.
    //  @audit both these issues are not some commonly known, but they are funny cases
    //  which I saw during my auditing experience :) 
    //  @audit public function that is never called in the contract
    //  can be declared external to save Gas   
    function mint(address to, uint256 amount) public onlyOwner {
        require(amount >= 0, "incorrect amount");
        _mint(to, amount * 10**18);
    }

    /// @dev Hook that is called before any transfer of tokens.
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }

    /// @dev internal function for UUPS functionality
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

}
