// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "../libraries/LibAppStorage.sol";
import "../../shared/libraries/LibDiamond.sol";
import "../../shared/libraries/LibERC20.sol";
import "../../shared/interfaces/IERC20.sol";
import "../libraries/LibERC1155.sol";

// import "hardhat/console.sol";

contract DAOFacet {
    AppStorage internal s;

    event DaoTransferred(address indexed previousDao, address indexed newDao);

    struct AavegotchiCollateralTypeIO {
        address collateralType;
        AavegotchiCollateralTypeInfo collateralTypeInfo;
    }

    modifier onlyDao {
        require(msg.sender == s.dao, "Only DAO can call this function");
        _;
    }

    function setDao(address _newDao) external {
        //Maybe we should make a DAO Facet?
        require(msg.sender == s.dao || msg.sender == LibDiamond.contractOwner(), "AavegotchiFacet: Do not have access");
        emit DaoTransferred(s.dao, _newDao);
        s.dao = _newDao;
    }

    function updateCollateralModifiers(address _collateralType, uint256 _modifiers) external onlyDao {
        LibDiamond.enforceIsContractOwner();
        s.collateralTypeInfo[_collateralType].modifiers = _modifiers;
    }

    function createHaunt(
        uint24 _hauntMaxSize,
        uint96 _portalPrice,
        bytes3 _bodyColor
    ) external returns (uint256 hauntId_) {
        require(msg.sender == s.dao || msg.sender == LibDiamond.contractOwner(), "AavegotchiFacet: Do not have access to create haunt");
        uint256 currentHauntId = s.currentHauntId;
        require(
            s.haunts[currentHauntId].totalCount == s.haunts[currentHauntId].hauntMaxSize,
            "AavegotchiFacet: Haunt must be full before creating new"
        );
        hauntId_ = currentHauntId + 1;
        s.currentHauntId = uint16(hauntId_);
        s.haunts[hauntId_].hauntMaxSize = _hauntMaxSize;
        s.haunts[hauntId_].portalPrice = _portalPrice;
        s.haunts[hauntId_].bodyColor = _bodyColor;
    }

    function mintWearables(
        address _to,
        uint256[] calldata _wearableIds,
        uint256[] calldata _quantities
    ) external {
        require(msg.sender == LibDiamond.contractOwner() || msg.sender == s.dao, "WearablesFacet: Does not have permission");
        require(_wearableIds.length == _quantities.length, "WearablesFacet: Ids and quantities length must match");

        uint256 wearableTypesLength = s.wearableTypes.length;
        for (uint256 i = 0; i < _wearableIds.length; i++) {
            uint256 wearableId = _wearableIds[i];

            require(wearableTypesLength > wearableId, "WearablesFacet: Wearable does not exist");

            uint256 quantity = _quantities[i];
            uint256 totalQuantity = s.wearableTypes[wearableId].totalQuantity + quantity;
            require(totalQuantity <= s.wearableTypes[wearableId].maxQuantity, "WearablesFacet: Total wearable type quantity exceeds max quantity");

            s.wearables[_to][wearableId] += quantity;
            s.wearableTypes[wearableId].totalQuantity = uint32(totalQuantity);
        }
        LibERC1155.onERC1155BatchReceived(msg.sender, _to, _wearableIds, _quantities, "");
    }
}
