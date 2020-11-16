// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "../libraries/LibAppStorage.sol";
import "../../shared/libraries/LibDiamond.sol";

// import "hardhat/console.sol";

contract CollateralFacet {
    AppStorage internal s;

    struct AavegotchiCollateralTypeIO {
        address collateralType;
        AavegotchiCollateralTypeInfo collateralTypeInfo;
    }

    modifier onlyDao {
        require(msg.sender == s.dao, "Only DAO can call this function");
        _;
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

    function updateCollateralModifiers(address _collateralType, int8[6] memory _modifiers) external onlyDao {
        LibDiamond.enforceIsContractOwner();
        s.collateralTypeInfo[_collateralType].modifiers = _modifiers;
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
}
