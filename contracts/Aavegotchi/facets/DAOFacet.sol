// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {Modifiers, ItemType, WearableSet, NUMERIC_TRAITS_NUM, EQUIPPED_WEARABLE_SLOTS} from "../libraries/LibAppStorage.sol";
import {AavegotchiCollateralTypeIO} from "../libraries/LibAavegotchi.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";
import {LibItems} from "../libraries/LibItems.sol";
import {LibSvg} from "../libraries/LibSvg.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {GameManager} from "../libraries/LibAppStorage.sol";

contract DAOFacet is Modifiers {
    event DaoTransferred(address indexed previousDao, address indexed newDao);
    event DaoTreasuryTransferred(address indexed previousDaoTreasury, address indexed newDaoTreasury);
    event UpdateCollateralModifiers(int16[NUMERIC_TRAITS_NUM] _oldModifiers, int16[NUMERIC_TRAITS_NUM] _newModifiers);
    event AddCollateralType(AavegotchiCollateralTypeIO _collateralType);
    event AddItemType(ItemType _itemType);
    event CreateHaunt(uint256 indexed _hauntId, uint256 _hauntMaxSize, uint256 _portalPrice, bytes32 _bodyColor);
    event GrantExperience(uint256[] _tokenIds, uint256[] _xpValues);
    event AddWearableSet(WearableSet _wearableSet);
    event UpdateWearableSet(uint256 _setId, WearableSet _wearableSet);
    event ItemTypeMaxQuantity(uint256[] _itemIds, uint256[] _maxQuanities);
    event GameManagerAdded(address indexed gameManager_);
    event GameManagerRemoved(address indexed gameManager_);
    event ItemManagerAdded(address indexed newItemManager_);
    event ItemManagerRemoved(address indexed ItemManager_);

    /***********************************|
   |             Read Functions         |
   |__________________________________*/

    function isGameManager(address _manager) external view returns (bool) {
        return s.gameManagers[_manager].limit != 0;
    }

    function getGameManagerBalance(address _manager) external view returns (uint256) {
        return s.gameManagers[_manager].balance;
    }

    /***********************************|
   |             Write Functions        |
   |__________________________________*/

    function setDao(address _newDao, address _newDaoTreasury) external onlyDaoOrOwner {
        emit DaoTransferred(s.dao, _newDao);
        emit DaoTreasuryTransferred(s.daoTreasury, _newDaoTreasury);
        s.dao = _newDao;
        s.daoTreasury = _newDaoTreasury;
    }

    function addCollateralTypes(AavegotchiCollateralTypeIO[] calldata _collateralTypes) external onlyDaoOrOwner {
        for (uint256 i; i < _collateralTypes.length; i++) {
            address collateralType = _collateralTypes[i].collateralType;

            //Prevent the same collateral from being added multiple times
            require(s.collateralTypeInfo[collateralType].cheekColor == 0, "DAOFacet: Collateral already added");

            s.collateralTypeIndexes[collateralType] = s.collateralTypes.length;
            s.collateralTypes.push(collateralType);
            s.collateralTypeInfo[collateralType] = _collateralTypes[i].collateralTypeInfo;
            emit AddCollateralType(_collateralTypes[i]);
        }
    }

    function addItemManagers(address[] calldata _newItemManagers) external onlyDaoOrOwner {
        for (uint256 index = 0; index < _newItemManagers.length; index++) {
            address newItemManager = _newItemManagers[index];
            s.itemManagers[newItemManager] = true;
            emit ItemManagerAdded(newItemManager);
        }
    }

    function removeItemManagers(address[] calldata _itemManagers) external onlyDaoOrOwner {
        for (uint256 index = 0; index < _itemManagers.length; index++) {
            address itemManager = _itemManagers[index];
            require(s.itemManagers[itemManager] == true, "DAOFacet: itemManager does not exist or already removed");
            s.itemManagers[itemManager] = false;
            emit ItemManagerRemoved(itemManager);
        }
    }

    function updateCollateralModifiers(address _collateralType, int16[NUMERIC_TRAITS_NUM] calldata _modifiers) external onlyDaoOrOwner {
        emit UpdateCollateralModifiers(s.collateralTypeInfo[_collateralType].modifiers, _modifiers);
        s.collateralTypeInfo[_collateralType].modifiers = _modifiers;
    }

    function updateItemTypeMaxQuantity(uint256[] calldata _itemIds, uint256[] calldata _maxQuantities) external onlyItemManager {
        require(_itemIds.length == _maxQuantities.length, "DAOFacet: _itemIds length not the same as _newQuantities length");
        for (uint256 i; i < _itemIds.length; i++) {
            uint256 itemId = _itemIds[i];
            uint256 maxQuantity = _maxQuantities[i];
            require(maxQuantity >= s.itemTypes[itemId].totalQuantity, "DAOFacet: maxQuantity is greater than existing quantity");
            s.itemTypes[itemId].maxQuantity = maxQuantity;
        }
        emit ItemTypeMaxQuantity(_itemIds, _maxQuantities);
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
        emit CreateHaunt(hauntId_, _hauntMaxSize, _portalPrice, _bodyColor);
    }

    function mintItems(
        address _to,
        uint256[] calldata _itemIds,
        uint256[] calldata _quantities
    ) external onlyItemManager {
        require(_itemIds.length == _quantities.length, "DAOFacet: Ids and quantities length must match");
        address sender = LibMeta.msgSender();
        uint256 itemTypesLength = s.itemTypes.length;
        for (uint256 i; i < _itemIds.length; i++) {
            uint256 itemId = _itemIds[i];

            require(itemTypesLength > itemId, "DAOFacet: Item type does not exist");

            uint256 quantity = _quantities[i];
            uint256 totalQuantity = s.itemTypes[itemId].totalQuantity + quantity;
            require(totalQuantity <= s.itemTypes[itemId].maxQuantity, "DAOFacet: Total item type quantity exceeds max quantity");

            LibItems.addToOwner(_to, itemId, quantity);
            s.itemTypes[itemId].totalQuantity = totalQuantity;
        }
        emit LibERC1155.TransferBatch(sender, address(0), _to, _itemIds, _quantities);
        LibERC1155.onERC1155BatchReceived(sender, address(0), _to, _itemIds, _quantities, "");
    }

    function grantExperience(uint256[] calldata _tokenIds, uint256[] calldata _xpValues) external onlyOwnerOrDaoOrGameManager {
        require(_tokenIds.length == _xpValues.length, "DAOFacet: IDs must match XP array length");
        GameManager storage gameManager = s.gameManagers[LibMeta.msgSender()];

        /*GameManager: If the refresh time has been reached, reset the gameManager's balance to the individual limit, and set the refreshTime to 1 day after the block timestamp.*/
        if (gameManager.refreshTime < block.timestamp) {
            gameManager.balance = gameManager.limit;
            gameManager.refreshTime = uint32(block.timestamp + 1 days);
        }

        for (uint256 i; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            uint256 xp = _xpValues[i];
            require(xp <= 1000, "DAOFacet: Cannot grant more than 1000 XP at a time");
            require(gameManager.balance >= xp, "DAOFacet: Game Manager's xp grant limit is reached");

            s.aavegotchis[tokenId].experience += xp;
            gameManager.balance -= xp;
        }
        emit GrantExperience(_tokenIds, _xpValues);
    }

    function addItemTypes(ItemType[] memory _itemTypes) external onlyItemManager {
        insertItemTypes(_itemTypes);
    }

    function addItemTypesAndSvgs(
        ItemType[] memory _itemTypes,
        string calldata _svg,
        LibSvg.SvgTypeAndSizes[] calldata _typesAndSizes
    ) external onlyItemManager {
        insertItemTypes(_itemTypes);
        LibSvg.storeSvg(_svg, _typesAndSizes);
    }

    function insertItemTypes(ItemType[] memory _itemTypes) internal {
        uint256 itemTypesLength = s.itemTypes.length;
        for (uint256 i; i < _itemTypes.length; i++) {
            uint256 itemId = itemTypesLength++;
            s.erc1155Categories[address(this)][itemId] = _itemTypes[i].category;
            s.itemTypes.push(_itemTypes[i]);
            emit AddItemType(_itemTypes[i]);
            emit LibERC1155.TransferSingle(LibMeta.msgSender(), address(0), address(0), itemId, 0);
        }
    }

    function addWearableSets(WearableSet[] memory _wearableSets) external onlyItemManager {
        for (uint256 i; i < _wearableSets.length; i++) {
            s.wearableSets.push(_wearableSets[i]);
            emit AddWearableSet(_wearableSets[i]);
        }
    }

    function updateWearableSets(uint256[] calldata _setIds, WearableSet[] calldata _wearableSets) external onlyItemManager {
        require(_setIds.length == _wearableSets.length, "_setIds not same length as _wearableSets");
        for (uint256 i; i < _setIds.length; i++) {
            s.wearableSets[_setIds[i]] = _wearableSets[i];
            emit UpdateWearableSet(_setIds[i], _wearableSets[i]);
        }
    }

    function addGameManagers(address[] calldata _newGameManagers, uint256[] calldata _limits) external onlyDaoOrOwner {
        require(_newGameManagers.length == _limits.length, "DAOFacet: New Game Managers and Limits should have same length");
        for (uint256 index = 0; index < _newGameManagers.length; index++) {
            GameManager storage gameManager = s.gameManagers[_newGameManagers[index]];
            gameManager.limit = _limits[index];
            gameManager.balance = _limits[index];
            gameManager.refreshTime = uint256(block.timestamp + 1 days);
            emit GameManagerAdded(_newGameManagers[index]);
        }
    }

    function removeGameManagers(address[] calldata _gameManagers) external onlyDaoOrOwner {
        for (uint256 index = 0; index < _gameManagers.length; index++) {
            GameManager storage gameManager = s.gameManagers[_gameManagers[index]];
            require(gameManager.limit != 0, "DAOFacet: GameManager does not exist or already removed");
            gameManager.limit = 0;
            emit GameManagerRemoved(_gameManagers[index]);
        }
    }
}
