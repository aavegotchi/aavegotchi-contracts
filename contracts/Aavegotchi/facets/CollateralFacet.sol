// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {Modifiers} from "../libraries/LibAppStorage.sol";
import {LibAavegotchi, AavegotchiCollateralTypeIO} from "../libraries/LibAavegotchi.sol";
import {LibItems} from "../libraries/LibItems.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibERC721} from "../../shared/libraries/LibERC721.sol";

// import "hardhat/console.sol";

contract CollateralFacet is Modifiers {
    event IncreaseStake(uint256 indexed _tokenId, uint256 _stakeAmount);
    event DecreaseStake(uint256 indexed _tokenId, uint256 _reduceAmount);
    event ExperienceTransfer(uint256 indexed _fromTokenId, uint256 indexed _toTokenId, uint256 experience);

    /***********************************|
   |             Read Functions         |
   |__________________________________*/

    //H2 Todo: Use the hauntID=>collateralType mapping
    function collaterals(uint256 _hauntId) external view returns (address[] memory collateralTypes_) {
        collateralTypes_ = s.hauntCollateralTypes[_hauntId];
    }

    //H2 Todo: Use the hauntID=>collateralType mapping
    function collateralInfo(uint256 _hauntId, uint256 _collateralId) external view returns (AavegotchiCollateralTypeIO memory collateralInfo_) {
        address collateral = s.hauntCollateralTypes[_hauntId][_collateralId];
        collateralInfo_ = AavegotchiCollateralTypeIO(collateral, s.collateralTypeInfo[collateral]);
        return collateralInfo_;
    }

    //H2 Todo: Use the hauntID=>collateralType mapping
    function getCollateralInfo(uint256 _hauntId) external view returns (AavegotchiCollateralTypeIO[] memory collateralInfo_) {
        address[] memory collateralTypes = s.hauntCollateralTypes[_hauntId];

        collateralInfo_ = new AavegotchiCollateralTypeIO[](s.hauntCollateralTypes[_hauntId].length);

        for (uint256 i; i < collateralTypes.length; i++) {
            address collateral = collateralTypes[i];
            collateralInfo_[i].collateralType = collateral;
            collateralInfo_[i].collateralTypeInfo = s.collateralTypeInfo[collateral];
        }
    }

    function collateralBalance(uint256 _tokenId)
        external
        view
        returns (
            address collateralType_,
            address escrow_,
            uint256 balance_
        )
    {
        escrow_ = s.aavegotchis[_tokenId].escrow;
        require(escrow_ != address(0), "CollateralFacet: Does not have an escrow");
        collateralType_ = s.aavegotchis[_tokenId].collateralType;
        balance_ = IERC20(collateralType_).balanceOf(escrow_);
    }

    /***********************************|
   |             Write Functions        |
   |__________________________________*/

    function increaseStake(uint256 _tokenId, uint256 _stakeAmount) external onlyAavegotchiOwner(_tokenId) {
        address escrow = s.aavegotchis[_tokenId].escrow;
        require(escrow != address(0), "CollateralFacet: Does not have an escrow");
        address collateralType = s.aavegotchis[_tokenId].collateralType;
        emit IncreaseStake(_tokenId, _stakeAmount);
        LibERC20.transferFrom(collateralType, LibMeta.msgSender(), escrow, _stakeAmount);
    }

    function decreaseStake(uint256 _tokenId, uint256 _reduceAmount) external onlyUnlocked(_tokenId) onlyAavegotchiOwner(_tokenId) {
        address escrow = s.aavegotchis[_tokenId].escrow;
        require(escrow != address(0), "CollateralFacet: Does not have an escrow");

        address collateralType = s.aavegotchis[_tokenId].collateralType;
        uint256 currentStake = IERC20(collateralType).balanceOf(escrow);
        uint256 minimumStake = s.aavegotchis[_tokenId].minimumStake;

        require(currentStake - _reduceAmount >= minimumStake, "CollateralFacet: Cannot reduce below minimum stake");
        emit DecreaseStake(_tokenId, _reduceAmount);
        LibERC20.transferFrom(collateralType, escrow, LibMeta.msgSender(), _reduceAmount);
    }

    function decreaseAndDestroy(uint256 _tokenId, uint256 _toId) external onlyUnlocked(_tokenId) onlyAavegotchiOwner(_tokenId) {
        address escrow = s.aavegotchis[_tokenId].escrow;
        require(escrow != address(0), "CollateralFacet: Does not have an escrow");

        // require(s.nftItems[address(this)][_tokenId].length == 0, "CollateralFacet: Can't burn aavegotchi with items");

        //If the toId is different from the tokenId, then perform an experience transfer
        if (_tokenId != _toId) {
            uint256 experience = s.aavegotchis[_tokenId].experience;
            emit ExperienceTransfer(_tokenId, _toId, experience);
            s.aavegotchis[_toId].experience += experience;
        }

        // remove
        s.aavegotchis[_tokenId].owner = address(0);
        address owner = LibMeta.msgSender();
        uint256 index = s.ownerTokenIdIndexes[owner][_tokenId];
        uint256 lastIndex = s.ownerTokenIds[owner].length - 1;
        if (index != lastIndex) {
            uint32 lastTokenId = s.ownerTokenIds[owner][lastIndex];
            s.ownerTokenIds[owner][index] = lastTokenId;
            s.ownerTokenIdIndexes[owner][lastTokenId] = index;
        }
        s.ownerTokenIds[owner].pop();
        delete s.ownerTokenIdIndexes[owner][_tokenId];

        // delete token approval if any
        if (s.approved[_tokenId] != address(0)) {
            delete s.approved[_tokenId];
            emit LibERC721.Approval(owner, address(0), _tokenId);
        }

        emit LibERC721.Transfer(owner, address(0), _tokenId);

        // transfer all collateral to LibMeta.msgSender()
        address collateralType = s.aavegotchis[_tokenId].collateralType;
        uint256 reduceAmount = IERC20(collateralType).balanceOf(escrow);
        emit DecreaseStake(_tokenId, reduceAmount);
        LibERC20.transferFrom(collateralType, escrow, owner, reduceAmount);

        // delete aavegotchi info
        string memory name = s.aavegotchis[_tokenId].name;
        if (bytes(name).length > 0) {
            delete s.aavegotchiNamesUsed[LibAavegotchi.validateAndLowerName(name)];
        }
        delete s.aavegotchis[_tokenId];
    }

    function setCollateralEyeShapeSvgId(address _collateralToken, uint8 _svgId) external onlyDaoOrOwner {
        s.collateralTypeInfo[_collateralToken].eyeShapeSvgId = _svgId;
    }
}
