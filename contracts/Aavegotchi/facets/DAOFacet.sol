// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {Modifiers, ItemType, WearableSet, NUMERIC_TRAITS_NUM, EQUIPPED_WEARABLE_SLOTS, AavegotchiCollateralTypeInfo} from "../libraries/LibAppStorage.sol";
import {AavegotchiCollateralTypeIO} from "../libraries/LibAavegotchi.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";
import {LibItems} from "../libraries/LibItems.sol";
import {LibSvg} from "../libraries/LibSvg.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibXPAllocation} from "../libraries/LibXPAllocation.sol";
import {GameManager} from "../libraries/LibAppStorage.sol";
import "../WearableDiamond/interfaces/IEventHandlerFacet.sol";

contract DAOFacet is Modifiers {
    event DaoTransferred(address indexed previousDao, address indexed newDao);
    event DaoTreasuryTransferred(address indexed previousDaoTreasury, address indexed newDaoTreasury);
    event ForgeTransferred(address indexed previousForge, address indexed newForge);
    event UpdateCollateralModifiers(int16[NUMERIC_TRAITS_NUM] _oldModifiers, int16[NUMERIC_TRAITS_NUM] _newModifiers);
    event AddCollateralType(AavegotchiCollateralTypeIO _collateralType);
    event AddItemType(ItemType _itemType);
    event UpdateItemType(uint256 indexed _itemId, ItemType _itemType);
    event CreateHaunt(uint256 indexed _hauntId, uint256 _hauntMaxSize, uint256 _portalPrice, bytes32 _bodyColor);
    event AddWearableSet(WearableSet _wearableSet);
    event UpdateWearableSet(uint256 _setId, WearableSet _wearableSet);
    event ItemTypeMaxQuantity(uint256[] _itemIds, uint256[] _maxQuanities);
    event GameManagerAdded(address indexed gameManager_, uint256 indexed limit_, uint256 refreshTime_);
    event GameManagerRemoved(address indexed gameManager_);
    event ItemManagerAdded(address indexed newItemManager_);
    event ItemManagerRemoved(address indexed itemManager_);
    event WearableSlotPositionsSet(uint256 _wearableId, bool[EQUIPPED_WEARABLE_SLOTS] _slotPositions);
    event ItemModifiersSet(uint256 _wearableId, int8[6] _traitModifiers, uint8 _rarityScoreModifier);
    event RemoveExperience(uint256[] _tokenIds, uint256[] _xpValues);
    event UpdateItemPrice(uint256 _itemId, uint256 _priceInWei);

    /***********************************|
   |             Read Functions         |
   |__________________________________*/

    ///@notice Query if an address is a game manager
    ///@param _manager Address to query
    ///@return True if `_manager` is a game manager,False otherwise
    function isGameManager(address _manager) external view returns (bool) {
        return s.gameManagers[_manager].limit != 0;
    }

    ///@notice Query the balance of a game manager
    ///@param _manager Address to query
    ///@return Balance of game manager `_manager`
    function gameManagerBalance(address _manager) external view returns (uint256) {
        return s.gameManagers[_manager].balance;
    }

    ///@notice Query the refresh time of a game manager
    ///@param _manager Address to query
    ///@return Refresh time of game manager `_manager`
    function gameManagerRefreshTime(address _manager) external view returns (uint256) {
        return s.gameManagers[_manager].refreshTime;
    }

    /***********************************|
   |             Write Functions        |
   |__________________________________*/

    ///@notice Allow the Diamond owner or DAO to set a new Dao address and Treasury address
    ///@param _newDao New DAO address
    ///@param _newDaoTreasury New treasury address
    function setDao(address _newDao, address _newDaoTreasury) external onlyDaoOrOwner {
        emit DaoTransferred(s.dao, _newDao);
        emit DaoTreasuryTransferred(s.daoTreasury, _newDaoTreasury);
        s.dao = _newDao;
        s.daoTreasury = _newDaoTreasury;
    }

    ///@notice Allow the Diamond owner or DAO to set a new Forge address
    ///@param _newForge New DAO address
    function setForge(address _newForge) external onlyDaoOrOwner {
        emit ForgeTransferred(s.forgeDiamond, _newForge);
        s.forgeDiamond = _newForge;
    }

    ///@notice Allow an item manager to add new collateral types to a haunt
    ///@dev If a certain collateral exists already, it will be overwritten
    ///@param _hauntId Identifier for haunt to add the collaterals to
    ///@param _collateralTypes An array of structs where each struct contains details about a particular collateral
    function addCollateralTypes(uint256 _hauntId, AavegotchiCollateralTypeIO[] calldata _collateralTypes) public onlyItemManager {
        for (uint256 i; i < _collateralTypes.length; i++) {
            address newCollateralType = _collateralTypes[i].collateralType;

            //Overwrite the collateralTypeInfo if it already exists
            s.collateralTypeInfo[newCollateralType] = _collateralTypes[i].collateralTypeInfo;

            //First handle global collateralTypes array
            uint256 index = s.collateralTypeIndexes[newCollateralType];
            bool collateralExists = index > 0 || s.collateralTypes[0] == newCollateralType;

            if (!collateralExists) {
                s.collateralTypes.push(newCollateralType);
                s.collateralTypeIndexes[newCollateralType] = s.collateralTypes.length;
            }

            //Then handle hauntCollateralTypes array
            bool hauntCollateralExists = false;
            for (uint256 hauntIndex = 0; hauntIndex < s.hauntCollateralTypes[_hauntId].length; hauntIndex++) {
                address existingHauntCollateral = s.hauntCollateralTypes[_hauntId][hauntIndex];

                if (existingHauntCollateral == newCollateralType) {
                    hauntCollateralExists = true;
                    break;
                }
            }

            if (!hauntCollateralExists) {
                s.hauntCollateralTypes[_hauntId].push(newCollateralType);
                emit AddCollateralType(_collateralTypes[i]);
            }
        }
    }

    ///@notice Allow the Diamond owner or DAO to add item managers
    ///@param _newItemManagers An array containing the addresses that need to be added as item managers
    function addItemManagers(address[] calldata _newItemManagers) external onlyDaoOrOwner {
        for (uint256 index = 0; index < _newItemManagers.length; index++) {
            address newItemManager = _newItemManagers[index];
            s.itemManagers[newItemManager] = true;
            emit ItemManagerAdded(newItemManager);
        }
    }

    ///@notice Allow the Diamond owner or DAO to remove item managers
    ///@dev Will throw if one of the addresses in `_itemManagers` is not an item manager
    ///@param _itemManagers An array containing the addresses that need to be removed from existing item managers
    function removeItemManagers(address[] calldata _itemManagers) external onlyDaoOrOwner {
        for (uint256 index = 0; index < _itemManagers.length; index++) {
            address itemManager = _itemManagers[index];
            require(s.itemManagers[itemManager] == true, "DAOFacet: itemManager does not exist or already removed");
            s.itemManagers[itemManager] = false;
            emit ItemManagerRemoved(itemManager);
        }
    }

    ///@notice Allow the Diamond owner or DAO to update the collateral modifiers of an existing collateral
    ///@param _collateralType The address of the existing collateral to update
    ///@param _modifiers An array containing the new numeric traits modifiers which will be applied to collateral `_collateralType`
    function updateCollateralModifiers(address _collateralType, int16[NUMERIC_TRAITS_NUM] calldata _modifiers) external onlyDaoOrOwner {
        emit UpdateCollateralModifiers(s.collateralTypeInfo[_collateralType].modifiers, _modifiers);
        s.collateralTypeInfo[_collateralType].modifiers = _modifiers;
    }

    ///@notice Allow an item manager to increase the max quantity of an item
    ///@dev Will throw if the new maxquantity is less than the existing quantity
    ///@param _itemIds An array containing the identifiers of items whose quantites are to be increased
    ///@param _maxQuantities An array containing the new max quantity of each item
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

    ///@notice Allow the Diamond owner or DAO to create a new Haunt
    ///@dev Will throw if the previous haunt is not full yet
    ///@param _hauntMaxSize The maximum number of portals in the new haunt
    ///@param _portalPrice The base price of portals in the new haunt(in $GHST)
    ///@param _bodyColor The universal body color applied to NFTs in the new haunt
    function createHaunt(uint24 _hauntMaxSize, uint96 _portalPrice, bytes3 _bodyColor) external onlyDaoOrOwner returns (uint256 hauntId_) {
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

    struct CreateHauntPayload {
        uint24 _hauntMaxSize;
        uint96 _portalPrice;
        bytes3 _bodyColor;
        AavegotchiCollateralTypeIO[] _collateralTypes;
        string _collateralSvg;
        LibSvg.SvgTypeAndSizes[] _collateralTypesAndSizes;
        string _eyeShapeSvg;
        LibSvg.SvgTypeAndSizes[] _eyeShapeTypesAndSizes;
    }

    //May overload the block gas limit but worth trying
    ///@notice allow an item manager to create a new Haunt, also uploagding the collateral types,collateral svgs,eyeshape types and eyeshape svgs all in one transaction
    ///@param _payload A struct containing all details needed to be uploaded for a new Haunt
    function createHauntWithPayload(CreateHauntPayload calldata _payload) external onlyItemManager returns (uint256 hauntId_) {
        uint256 currentHauntId = s.currentHauntId;
        require(
            s.haunts[currentHauntId].totalCount == s.haunts[currentHauntId].hauntMaxSize,
            "AavegotchiFacet: Haunt must be full before creating new"
        );

        hauntId_ = currentHauntId + 1;

        //Upload collateralTypes
        addCollateralTypes(hauntId_, _payload._collateralTypes);

        //Upload collateralSvgs
        LibSvg.storeSvg(_payload._collateralSvg, _payload._collateralTypesAndSizes);

        //Upload eyeShapes
        LibSvg.storeSvg(_payload._eyeShapeSvg, _payload._eyeShapeTypesAndSizes);

        s.currentHauntId = uint16(hauntId_);
        s.haunts[hauntId_].hauntMaxSize = _payload._hauntMaxSize;
        s.haunts[hauntId_].portalPrice = _payload._portalPrice;
        s.haunts[hauntId_].bodyColor = _payload._bodyColor;
        emit CreateHaunt(hauntId_, _payload._hauntMaxSize, _payload._portalPrice, _payload._bodyColor);
    }

    ///@notice Allow an item manager to mint new ERC1155 items
    ///@dev Will throw if a particular item current supply has reached its maximum supply
    ///@param _to The address to mint the items to
    ///@param _itemIds An array containing the identifiers of the items to mint
    ///@param _quantities An array containing the number of items to mint
    function mintItems(address _to, uint256[] calldata _itemIds, uint256[] calldata _quantities) external onlyItemManager {
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
        IEventHandlerFacet(s.wearableDiamond).emitTransferBatchEvent(sender, address(0), _to, _itemIds, _quantities);
        LibERC1155.onERC1155BatchReceived(sender, address(0), _to, _itemIds, _quantities, "");
    }

    ///@notice Allow the DAO, a game manager or the aavegotchi diamond owner to grant XP(experience points) to multiple aavegotchis
    ///@dev recipients must be claimed aavegotchis
    ///@param _tokenIds The identifiers of the aavegotchis to grant XP to
    ///@param _xpValues The amount XP to grant each aavegotchi
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
        emit LibXPAllocation.GrantExperience(_tokenIds, _xpValues);
    }

    ///@notice Allow the DAO, a game manager or the aavegotchi diamond owner to remove XP(experience points) from multiple aavegotchis
    ///@dev recipients must be claimed aavegotchis
    ///@param _tokenIds The identifiers of the aavegotchis to grant XP to
    ///@param _xpValues The amount XP to grant each aavegotchi
    function removeExperience(uint256[] calldata _tokenIds, uint256[] calldata _xpValues) external onlyOwnerOrDaoOrGameManager {
        require(_tokenIds.length == _xpValues.length, "DAOFacet: IDs must match XP array length");

        //todo: Create new permission to only allow certain gameManagers to access this

        for (uint256 i; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            uint256 removeXp = _xpValues[i];

            require(s.aavegotchis[tokenId].experience >= removeXp, "DAOFacet: Remove XP would underflow");

            s.aavegotchis[tokenId].experience -= removeXp;
        }
        emit RemoveExperience(_tokenIds, _xpValues);
    }

    ///@notice Allow an item manager to add item types
    ///@param _itemTypes An array of structs where each struct contains details about each item to be added
    function addItemTypes(ItemType[] memory _itemTypes) external onlyItemManager {
        insertItemTypes(_itemTypes);
    }

    ///@notice Allow an item manager to add item types and their svgs
    ///@param _itemTypes An array of structs where each struct contains details about each item to be added
    ///@param _svg The svg to be added
    ///@param _typesAndSizes An array of structs, each struct containing details about the item types and sizes
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
            IEventHandlerFacet(s.wearableDiamond).emitTransferSingleEvent(LibMeta.msgSender(), address(0), address(0), itemId, 0);
        }
    }

    ///@notice Allow an item manager to update item types
    ///@param _indices An array of item id to be updated
    ///@param _itemTypes An array of structs where each struct contains details about each item to be updated
    function updateItemTypes(uint256[] memory _indices, ItemType[] memory _itemTypes) external onlyItemManager {
        require(_indices.length == _itemTypes.length, "DAOFacet: Incorrect lengths");

        for (uint256 i; i < _indices.length; i++) {
            s.itemTypes[_indices[i]] = _itemTypes[i];
            emit UpdateItemType(_indices[i], _itemTypes[i]);
        }
    }

    ///@notice Allow an item manager to add a wearable set
    ///@param _wearableSets An array of structs, each struct containing the details about each wearableset to be added

    function addWearableSets(WearableSet[] memory _wearableSets) external onlyItemManager {
        for (uint256 i; i < _wearableSets.length; i++) {
            s.wearableSets.push(_wearableSets[i]);
            emit AddWearableSet(_wearableSets[i]);
        }
    }

    ///@notice Allow an item manager to update existing wearablesets
    ///@param _setIds An array containing the identifiers of the wearablesets to be updated
    ///@param _wearableSets An array oof structs,each struct representing the updated wearableset details
    function updateWearableSets(uint256[] calldata _setIds, WearableSet[] calldata _wearableSets) external onlyItemManager {
        require(_setIds.length == _wearableSets.length, "_setIds not same length as _wearableSets");
        for (uint256 i; i < _setIds.length; i++) {
            s.wearableSets[_setIds[i]] = _wearableSets[i];
            emit UpdateWearableSet(_setIds[i], _wearableSets[i]);
        }
    }

    ///@notice Allow the DAO or the aavegotchi diamond owner to add new game managers and  their corresponding limits
    ///@param _newGameManagers An array containing the addresses to be added as game managers
    ///@param _limits An array containing the corresponding limits applied to ech address in `_newGameManagers`
    function addGameManagers(address[] calldata _newGameManagers, uint256[] calldata _limits) external onlyDaoOrOwner {
        require(_newGameManagers.length == _limits.length, "DAOFacet: New Game Managers and Limits should have same length");
        for (uint256 index = 0; index < _newGameManagers.length; index++) {
            GameManager storage gameManager = s.gameManagers[_newGameManagers[index]];
            gameManager.limit = _limits[index];
            gameManager.balance = _limits[index];
            gameManager.refreshTime = uint256(block.timestamp + 1 days);
            emit GameManagerAdded(_newGameManagers[index], _limits[index], uint256(block.timestamp + 1 days));
        }
    }

    ///@notice Allow the DAO or the aavegotchi diamond owner to remove existing  game managers
    ///@dev It also resets the limit of each removed game manager to 0
    ///@param _gameManagers An array containing the addresses to be removed from existing game managers
    function removeGameManagers(address[] calldata _gameManagers) external onlyDaoOrOwner {
        for (uint256 index = 0; index < _gameManagers.length; index++) {
            GameManager storage gameManager = s.gameManagers[_gameManagers[index]];
            require(gameManager.limit != 0, "DAOFacet: GameManager does not exist or already removed");
            gameManager.limit = 0;
            emit GameManagerRemoved(_gameManagers[index]);
        }
    }

    ///@notice Allow the DAO or the aavegotchi diamond owner to set the wearable slot position for a particular wearable
    ///@param _wearableId The identifier of the wearable to change its slot position
    ///@param _slotPositions An array of booleans pointing out where `_wearableId` is now assigned to. True if assigned to a slot, False if otherwise
    function setWearableSlotPositions(uint256 _wearableId, bool[EQUIPPED_WEARABLE_SLOTS] calldata _slotPositions) external onlyItemManager {
        require(_wearableId < s.itemTypes.length, "Error");
        s.itemTypes[_wearableId].slotPositions = _slotPositions;
        emit WearableSlotPositionsSet(_wearableId, _slotPositions);
    }

    ///@notice Allow an item manager to set the trait and rarity modifiers of an item/wearable
    ///@dev Only valid for existing wearables
    ///@param _wearableId The identifier of the wearable to set
    ///@param _traitModifiers An array containing the new trait modifiers to be applied to a wearable with identifier `_wearableId`
    ///@param _rarityScoreModifier The new rarityScore modifier of a wearable with identifier `_wearableId`
    function setItemTraitModifiersAndRarityModifier(
        uint256 _wearableId,
        int8[6] calldata _traitModifiers,
        uint8 _rarityScoreModifier
    ) external onlyItemManager {
        require(_wearableId < s.itemTypes.length, "Error");
        s.itemTypes[_wearableId].traitModifiers = _traitModifiers;
        s.itemTypes[_wearableId].rarityScoreModifier = _rarityScoreModifier;
        emit ItemModifiersSet(_wearableId, _traitModifiers, _rarityScoreModifier);
    }

    ///@notice Allow an item manager to set the price of multiple items in GHST
    ///@dev Only valid for existing items that can be purchased with GHST
    ///@param _itemIds The items whose price is to be changed
    ///@param _newPrices The new prices of the items
    function batchUpdateItemsPrice(uint256[] calldata _itemIds, uint256[] calldata _newPrices) public onlyItemManager {
        require(_itemIds.length == _newPrices.length, "DAOFacet: Items must be the same length as prices");
        for (uint256 i; i < _itemIds.length; i++) {
            uint256 itemId = _itemIds[i];
            ItemType storage item = s.itemTypes[itemId];
            item.ghstPrice = _newPrices[i];
            emit UpdateItemPrice(itemId, _newPrices[i]);
        }
    }
}
