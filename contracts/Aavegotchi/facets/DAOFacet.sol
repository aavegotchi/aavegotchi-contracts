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
    event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 _id, uint256 _value);

    struct AavegotchiCollateralTypeIO {
        address collateralType;
        AavegotchiCollateralTypeInfo collateralTypeInfo;
    }

    /***********************************|
   |             Modifiers              |
   |__________________________________*/

    modifier onlyDao {
        require(msg.sender == s.dao, "Only DAO can call this function");
        _;
    }

    modifier onlyDaoOrOwner {
        require(msg.sender == s.dao || msg.sender == LibDiamond.contractOwner(), "AavegotchiFacet: Do not have access");
        _;
    }

    /***********************************|
   |             Events                  |
   |__________________________________*/

    /***********************************|
   |             View Functions         |
   |__________________________________*/

    function gameManager() external view returns (address) {
        return s.gameManager;
    }

    /***********************************|
   |             Set Functions          |
   |__________________________________*/

    function setDao(address _newDao) external onlyDaoOrOwner {
        emit DaoTransferred(s.dao, _newDao);
        s.dao = _newDao;
    }

    function addCollateralTypes(AavegotchiCollateralTypeIO[] calldata _collateralTypes) external onlyDaoOrOwner {
        for (uint256 i; i < _collateralTypes.length; i++) {
            address collateralType = _collateralTypes[i].collateralType;
            s.collateralTypes.push(collateralType);
            s.collateralTypeIndexes[collateralType] = s.collateralTypes.length;
            s.collateralTypeInfo[collateralType] = _collateralTypes[i].collateralTypeInfo;
        }
    }

    function updateCollateralModifiers(address _collateralType, uint256 _modifiers) external onlyDaoOrOwner {
        s.collateralTypeInfo[_collateralType].modifiers = _modifiers;
    }

    function createHaunt(
        uint24 _hauntMaxSize,
        uint96 _portalPrice,
        bytes3 _bodyColor
    ) external onlyDaoOrOwner returns (uint256 hauntId_) {
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

    function mintItems(
        address _to,
        uint256[] calldata _itemIds,
        uint256[] calldata _quantities
    ) external {
        require(msg.sender == LibDiamond.contractOwner() || msg.sender == s.dao, "DAOFacet: Does not have permission");
        require(_itemIds.length == _quantities.length, "DAOFacet: Ids and quantities length must match");

        uint256 itemTypesLength = s.itemTypes.length;
        for (uint256 i = 0; i < _itemIds.length; i++) {
            uint256 itemId = _itemIds[i];

            require(itemTypesLength > itemId, "DAOFacet: Item type does not exist");

            uint256 quantity = _quantities[i];
            uint256 totalQuantity = s.itemTypes[itemId].totalQuantity + quantity;
            require(totalQuantity <= s.itemTypes[itemId].maxQuantity, "DAOFacet: Total item type quantity exceeds max quantity");

            s.items[_to][itemId] += quantity;
            s.itemTypes[itemId].totalQuantity = uint32(totalQuantity);
        }
        LibERC1155.onERC1155BatchReceived(msg.sender, _to, _itemIds, _quantities, "");
    }

    function grantExperience(uint256[] calldata _tokenIds, uint32[] calldata _xpValues) external onlyDaoOrOwner {
        require(_tokenIds.length == _xpValues.length, "DAOFacet: IDs must match XP array length");
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            uint32 xp = _xpValues[i];
            require(xp <= 1000, "DAOFacet: Cannot grant more than 1000 XP at a time");

            //To test (Dan): Deal with overflow here? - Handling it just in case
            uint32 experience = s.aavegotchis[tokenId].experience;
            uint32 increasedExperience = experience + xp;
            require(increasedExperience >= experience, "DAOFacet: Experience overflow");
            s.aavegotchis[tokenId].experience = increasedExperience;
        }
    }

    function addItemTypes(ItemType[] memory _itemTypes) external onlyDaoOrOwner() {
        // LibDiamond.enforceIsContractOwner();
        // item ids start at 1.  0 means no item
        uint256 itemTypesLength = s.itemTypes.length;
        for (uint256 i; i < _itemTypes.length; i++) {
            uint256 itemId = itemTypesLength++;
            s.itemTypes.push(_itemTypes[i]);
            emit TransferSingle(msg.sender, address(0), address(0), itemId, 0);
        }
    }

    function addWearableSets(WearableSet[] memory _wearableSets) external onlyDaoOrOwner() {
        for (uint256 i; i < _wearableSets.length; i++) {
            s.wearableSets.push(_wearableSets[i]);
        }
    }

    function setGameManager(address _gameManager) external {
        require(msg.sender == LibDiamond.contractOwner(), "DAOFacet: Only contract owner can set game manager");
        s.gameManager = _gameManager;
    }
}
