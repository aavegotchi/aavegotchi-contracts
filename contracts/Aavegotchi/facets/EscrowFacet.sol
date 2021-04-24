// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {Modifiers} from "../libraries/LibAppStorage.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
import {CollateralEscrow} from "../CollateralEscrow.sol";


contract EscrowFacet is Modifiers {

  event TransferEscrow(uint256 indexed _tokenId, uint256 _transferAmount, address _erc20Contract);
  event Erc20Deposited(uint256 indexed _tokenId, uint256 _depositAmount, address _erc20Contract);


  function depositERC20(uint256 _tokenId,  address _erc20Contract, uint256 _value) external {
    address escrow = s.aavegotchis[_tokenId].escrow;
    require(escrow != address(0), "CollateralFacet: Does not have an escrow");

    emit Erc20Deposited(_tokenId, _value, _erc20Contract);

    LibERC20.transferFrom(_erc20Contract, LibMeta.msgSender(), escrow, _value);
  }

  function escrowBalance(uint256 _tokenId, address _erc20Contract) external view returns(uint256){
    address escrow = s.aavegotchis[_tokenId].escrow;
    require(escrow != address(0), "CollateralFacet: Does not have an escrow");

    uint256 balance = IERC20(_erc20Contract).balanceOf(escrow);

    return balance;
  }

  function transferEscrow(uint256 _tokenId, address _erc20Contract, address _recipient, uint256 _transferAmount) external onlyAavegotchiOwner(_tokenId) {
    address escrow = s.aavegotchis[_tokenId].escrow;
    require(escrow != address(0), "CollateralFacet: Does not have an escrow");

    uint256 balance = IERC20(_erc20Contract).balanceOf(escrow);
    require(balance - _transferAmount >= 0, "CollateralFacet: Cannot transfer more than current ERC20 escrow balance");

    emit TransferEscrow(_tokenId, _transferAmount, _erc20Contract);

    CollateralEscrow(escrow).approveAavegotchiDiamond(_erc20Contract);
    LibERC20.transferFrom(_erc20Contract, escrow, _recipient, _transferAmount);
  }
}
