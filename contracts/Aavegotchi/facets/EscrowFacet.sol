// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {Modifiers} from "../libraries/LibAppStorage.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
import {CollateralEscrow} from "../CollateralEscrow.sol";

contract EscrowFacet is Modifiers {
    event Erc20Deposited(uint256 indexed _tokenId, address indexed _erc20Contract, address indexed _from, address _to, uint256 _depositAmount);
    event TransferEscrow(uint256 indexed _tokenId, address indexed _erc20Contract, address _from, address indexed _to, uint256 _transferAmount);

    function gotchiEscrow(uint256 _tokenId) public view returns (address) {
        return s.aavegotchis[_tokenId].escrow;
    }

    ///@notice Allow the deposit of an ERC20 token to the escrow contract of a claimed aavegotchi
    ///@dev Will throw if token being deposited is same as collateral token for the aavegotchi
    ///@param _tokenId The identifier of the NFT receiving the ERC20 token
    ///@param _erc20Contract The contract address of the ERC20 token to be deposited
    ///@param _value The amount of ERC20 tokens to deposit
    function depositERC20(
        uint256 _tokenId,
        address _erc20Contract,
        uint256 _value
    ) public {
        address escrow = s.aavegotchis[_tokenId].escrow;
        address collateralType = s.aavegotchis[_tokenId].collateralType;
        require(escrow != address(0), "EscrowFacet: Does not have an escrow");
        require(collateralType != _erc20Contract, "EscrowFacet: Depositing ERC20 token CANNOT be same as collateral ERC20 token");

        emit Erc20Deposited(_tokenId, _erc20Contract, LibMeta.msgSender(), escrow, _value);

        LibERC20.transferFrom(_erc20Contract, LibMeta.msgSender(), escrow, _value);
    }

    ///@notice Allow the deposit of multiple ERC20 tokens to the escrow contract of a multiple claimed aavegotchis
    ///@dev Will throw if one of the tokens being deposited is same as collateral token for the corresponding aavegotchi
    ///@param _tokenIds An array containing the identifiers of the NFTs receiving the ERC20 tokens
    ///@param _erc20Contracts An array containing the contract addresses of the ERC20 tokens to be deposited
    ///@param _values An array containing the amounts of ERC20 tokens to deposit
    function batchDepositERC20(
        uint256[] calldata _tokenIds,
        address[] calldata _erc20Contracts,
        uint256[] calldata _values
    ) external {
        require(_tokenIds.length == _values.length, "EscrowFacet: TokenIDs and Values length must match");
        require(_tokenIds.length == _erc20Contracts.length, "EscrowFacet: TokenIDs and ERC20Contracts length must match");

        for (uint256 index = 0; index < _tokenIds.length; index++) {
            uint256 tokenId = _tokenIds[index];
            address erc20Contract = _erc20Contracts[index];
            uint256 value = _values[index];
            depositERC20(tokenId, erc20Contract, value);
        }
    }

    ///@notice Allow the deposit of GHST into the escrow of multiple aavegotchis
    ///@param _tokenIds An array containing the identifiers of the NFTs receiving GHST
    ///@param _values An array containing the amounts of ERC20 tokens to deposit into each aavegotchi

    function batchDepositGHST(uint256[] calldata _tokenIds, uint256[] calldata _values) external {
        require(_tokenIds.length == _values.length, "EscrowFacet: TokenIDs and Values length must match");

        address maticGHST = 0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7;
        for (uint256 index = 0; index < _tokenIds.length; index++) {
            uint256 tokenId = _tokenIds[index];
            uint256 value = _values[index];
            address escrow = s.aavegotchis[tokenId].escrow;
            require(escrow != address(0), "EscrowFacet: Does not have an escrow");
            //emit Erc20Deposited(tokenId, maticGHST, value, LibMeta.msgSender(), escrow);
            LibERC20.transferFrom(maticGHST, LibMeta.msgSender(), escrow, value);
        }
    }

    ///@notice Query the balance of any ERC20 token being hekd in the escrow of an aavegotchi
    ///@param _tokenId Identifier of NFT to query
    ///@param _erc20Contract Contract address of ERC20 token to query
    ///@return The balance of the escrow contract in `_erc20Contract` tokens
    function escrowBalance(uint256 _tokenId, address _erc20Contract) external view returns (uint256) {
        address escrow = s.aavegotchis[_tokenId].escrow;
        require(escrow != address(0), "EscrowFacet: Does not have an escrow");

        uint256 balance = IERC20(_erc20Contract).balanceOf(escrow);

        return balance;
    }

    ///@notice Allow the owner of the aavegotchi to transfer out any ERC20 token in the escrow to an external address
    ///@dev Will throw if there is an attempt to transfer out the collateral ERC20 token
    ///@param _tokenId Identifier of NFT holding the ERC20 token
    ///@param _erc20Contract Contract address of ERC20 token to transfer out
    ///@param _recipient Address of the receiver
    ///@param _transferAmount Amount of ERC20 tokens to transfer out
    function transferEscrow(
        uint256 _tokenId,
        address _erc20Contract,
        address _recipient,
        uint256 _transferAmount
    ) external onlyAavegotchiOwner(_tokenId) onlyUnlocked(_tokenId) {
        address escrow = s.aavegotchis[_tokenId].escrow;
        address collateralType = s.aavegotchis[_tokenId].collateralType;
        require(escrow != address(0), "EscrowFacet: Does not have an escrow");
        require(collateralType != _erc20Contract, "EscrowFacet: Transferring ERC20 token CANNOT be same as collateral ERC20 token");

        uint256 balance = IERC20(_erc20Contract).balanceOf(escrow);
        require(balance >= _transferAmount, "EscrowFacet: Cannot transfer more than current ERC20 escrow balance");

        emit TransferEscrow(_tokenId, _erc20Contract, escrow, _recipient, _transferAmount);

        if (IERC20(_erc20Contract).allowance(escrow, address(this)) < _transferAmount) {
            CollateralEscrow(escrow).approveAavegotchiDiamond(_erc20Contract);
        }
        LibERC20.transferFrom(_erc20Contract, escrow, _recipient, _transferAmount);
    }
}
