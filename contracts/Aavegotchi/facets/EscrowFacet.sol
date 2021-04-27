// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {Modifiers} from "../libraries/LibAppStorage.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
import {CollateralEscrow} from "../CollateralEscrow.sol";


contract EscrowFacet is Modifiers {

  event Erc20Deposited(uint256 indexed _tokenId,  address indexed _erc20Contract, uint256 _depositAmount);
  event TransferEscrow(uint256 indexed _tokenId,  address indexed _erc20Contract, uint256 _transferAmount);


  function depositERC20(uint256 _tokenId,  address _erc20Contract, uint256 _value) external {
    address escrow = s.aavegotchis[_tokenId].escrow;
    address collateralType = s.aavegotchis[_tokenId].collateralType;
    require(escrow != address(0), "EscrowFacet: Does not have an escrow");
    require(collateralType != _erc20Contract, "EscrowFacet: Depositing ERC20 token CANNOT be same as collateral ERC20 token");

    emit Erc20Deposited(_tokenId, _erc20Contract, _value);

    LibERC20.transferFrom(_erc20Contract, LibMeta.msgSender(), escrow, _value);
    /* IERC20(_erc20Contract).approve(LibMeta.msgSender(), _value); */
  }

  function escrowBalance(uint256 _tokenId, address _erc20Contract) external view returns(uint256){
    address escrow = s.aavegotchis[_tokenId].escrow;
    require(escrow != address(0), "EscrowFacet: Does not have an escrow");

    uint256 balance = IERC20(_erc20Contract).balanceOf(escrow);

    return balance;
  }

  function transferEscrow(uint256 _tokenId, address _erc20Contract, address _recipient, uint256 _transferAmount) external onlyAavegotchiOwner(_tokenId) {
    address escrow = s.aavegotchis[_tokenId].escrow;
    address collateralType = s.aavegotchis[_tokenId].collateralType;
    require(escrow != address(0), "EscrowFacet: Does not have an escrow");
    require(collateralType != _erc20Contract, "EscrowFacet: Transferring ERC20 token CANNOT be same as collateral ERC20 token");

    uint256 balance = IERC20(_erc20Contract).balanceOf(escrow);
    require(balance - _transferAmount >= 0, "EscrowFacet: Cannot transfer more than current ERC20 escrow balance");

    emit TransferEscrow(_tokenId, _erc20Contract, _transferAmount);

    if(IERC20(_erc20Contract).allowance(escrow, LibMeta.msgSender()) > 0){
      LibERC20.transferFrom(_erc20Contract, escrow, _recipient, _transferAmount);
    }else{
      CollateralEscrow(escrow).approveAavegotchiDiamond(_erc20Contract);
      LibERC20.transferFrom(_erc20Contract, escrow, _recipient, _transferAmount);
    }
  }
}
