// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "../libraries/LibAppStorage.sol";
import "../../shared/libraries/LibDiamond.sol";
import "../../shared/libraries/LibERC20.sol";
import "../../shared/interfaces/IERC20.sol";

// import "hardhat/console.sol";

contract CollateralFacet {
    AppStorage internal s;

    event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);
    event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);

    struct AavegotchiCollateralTypeIO {
        address collateralType;
        AavegotchiCollateralTypeInfo collateralTypeInfo;
    }

    function addCollateralTypes(AavegotchiCollateralTypeIO[] calldata _collateralTypes) external {
        LibDiamond.enforceIsContractOwner();
        for (uint256 i; i < _collateralTypes.length; i++) {
            address collateralType = _collateralTypes[i].collateralType;
            s.collateralTypes.push(collateralType);
            s.collateralTypeIndexes[collateralType] = s.collateralTypes.length;
            s.collateralTypeInfo[collateralType] = _collateralTypes[i].collateralTypeInfo;
        }
    }

    function collaterals() external view returns (address[] memory collateralTypes_) {
        collateralTypes_ = s.collateralTypes;
    }

    function getCollateralInfo() external view returns (AavegotchiCollateralTypeInfo[] memory collateralInfo) {
        address[] memory collateralTypes_ = s.collateralTypes;

        collateralInfo = new AavegotchiCollateralTypeInfo[](collateralTypes_.length);

        for (uint256 i; i < collateralTypes_.length; i++) {
            address collateral = collateralTypes_[i];
            collateralInfo[i] = s.collateralTypeInfo[collateral];
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

    function increaseStake(uint256 _tokenId, uint256 _stakeAmount) external {
        require(msg.sender == s.aavegotchis[_tokenId].owner, "AavegotchiFacet: Only aavegotchi owner can increase stake");
        address escrow = s.aavegotchis[_tokenId].escrow;
        require(escrow != address(0), "CollateralFacet: Does not have an escrow");
        address collateralType = s.aavegotchis[_tokenId].collateralType;
        LibERC20.transferFrom(collateralType, msg.sender, escrow, _stakeAmount);
    }

    function decreaseStake(uint256 _tokenId, uint96 _reduceAmount) external {
        require(msg.sender == s.aavegotchis[_tokenId].owner, "AavegotchiFacet: Only aavegotchi owner can decrease stake");
        address escrow = s.aavegotchis[_tokenId].escrow;
        require(escrow != address(0), "CollateralFacet: Does not have an escrow");

        address collateralType = s.aavegotchis[_tokenId].collateralType;
        uint256 currentStake = IERC20(collateralType).balanceOf(escrow);
        uint256 minimumStake = s.aavegotchis[_tokenId].minimumStake;

        require(currentStake - _reduceAmount >= minimumStake, "CollateralFacet: Cannot reduce below minimum stake");
        LibERC20.transferFrom(collateralType, escrow, msg.sender, _reduceAmount);
    }

    function decreaseAndDestroy(uint256 _tokenId) external {
        require(msg.sender == s.aavegotchis[_tokenId].owner, "AavegotchiFacet: Only aavegotchi owner can decrease stake");
        address escrow = s.aavegotchis[_tokenId].escrow;
        require(escrow != address(0), "CollateralFacet: Does not have an escrow");

        // check that all wearables have been removed from inventory before burning
        uint256 wearableTypesLength = s.wearableTypes.length;
        for (uint256 wearableTypeId; wearableTypeId < wearableTypesLength; wearableTypeId++) {
            require(s.nftBalances[address(this)][_tokenId][wearableTypeId] == 0, "CollateralFacet: Can't burn aavegotchi with wearables");
        }

        s.aavegotchiBalance[msg.sender]--;
        // delete token approval if any
        if (s.approved[_tokenId] != address(0)) {
            delete s.approved[_tokenId];
            emit Approval(msg.sender, address(0), _tokenId);
        }

        // transfer all collateral to msg.sender
        address collateralType = s.aavegotchis[_tokenId].collateralType;
        LibERC20.transferFrom(collateralType, escrow, msg.sender, IERC20(collateralType).balanceOf(escrow));

        // delete aavegotchi info
        delete s.aavegotchiNamesUsed[s.aavegotchis[_tokenId].name];
        delete s.aavegotchis[_tokenId];

        emit Transfer(msg.sender, address(0), _tokenId);
    }
}
