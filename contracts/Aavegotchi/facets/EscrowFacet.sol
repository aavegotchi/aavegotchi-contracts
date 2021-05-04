// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {Modifiers} from "../libraries/LibAppStorage.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
import {CollateralEscrow} from "../CollateralEscrow.sol";

contract EscrowFacet is Modifiers {
    event Erc20Deposited(uint256 indexed _tokenId, address indexed _erc20Contract, uint256 _depositAmount, address _from, address indexed _to);
    event TransferEscrow(uint256 indexed _tokenId, address indexed _erc20Contract, uint256 _transferAmount, address indexed _from, address _to);

    function depositERC20(
        uint256 _tokenId,
        address _erc20Contract,
        uint256 _value
    ) public {
        address escrow = s.aavegotchis[_tokenId].escrow;
        address collateralType = s.aavegotchis[_tokenId].collateralType;
        require(escrow != address(0), "EscrowFacet: Does not have an escrow");
        require(collateralType != _erc20Contract, "EscrowFacet: Depositing ERC20 token CANNOT be same as collateral ERC20 token");

        emit Erc20Deposited(_tokenId, _erc20Contract, _value, LibMeta.msgSender(), escrow);

        LibERC20.transferFrom(_erc20Contract, LibMeta.msgSender(), escrow, _value);
    }

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

    function escrowBalance(uint256 _tokenId, address _erc20Contract) external view returns (uint256) {
        address escrow = s.aavegotchis[_tokenId].escrow;
        require(escrow != address(0), "EscrowFacet: Does not have an escrow");

        uint256 balance = IERC20(_erc20Contract).balanceOf(escrow);

        return balance;
    }

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

        emit TransferEscrow(_tokenId, _erc20Contract, _transferAmount, escrow, _recipient);

        if (IERC20(_erc20Contract).allowance(escrow, address(this)) < _transferAmount) {
            CollateralEscrow(escrow).approveAavegotchiDiamond(_erc20Contract);
        }
        LibERC20.transferFrom(_erc20Contract, escrow, _recipient, _transferAmount);
    }
}
