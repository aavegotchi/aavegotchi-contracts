// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import { ERC1155 } from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC1155URIStorage } from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import { ERC1155Supply } from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import { Counters } from "@openzeppelin/contracts/utils/Counters.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";
//import { ERC1155Holder } from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import { ERC1155Receiver } from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Receiver.sol";

//import {LibItems} from "../../libraries/LibItems.sol";
//import { Modifiers } from "../libraries/LibAppStorage.sol";
import "../libraries/LibAppStorage.sol";
import {WearablesFacet} from "../../WearableDiamond/facets/WearablesFacet.sol";
import {ForgeLibDiamond} from "../libraries/ForgeLibDiamond.sol";
import {ForgeDiamond} from "../ForgeDiamond.sol";

// Аavegotchi
import {LibMeta} from "../../../shared/libraries/LibMeta.sol";
import {ItemsFacet} from "../../facets/ItemsFacet.sol";
import {ItemType} from "../../libraries/LibAppStorage.sol";
import {AavegotchiFacet} from "../../facets/AavegotchiFacet.sol";
import {AavegotchiGameFacet} from "../../facets/AavegotchiGameFacet.sol";



contract ForgeFacet is Modifiers, ERC1155URIStorage, ERC1155Supply, Pausable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    Counters.Counter private _forgeQueueId;

    event ItemSmelted(uint256 itemId, uint256 gotchiId);
    event ItemForged(uint256 itemId, uint256 gotchiId);
    event ForgeQueueClaimed(uint256 itemId, uint256 gotchiId);

    event ForgeTimeReduced(uint256 indexed queueId, uint256 indexed gotchiId, uint256 indexed itemId, uint40 _blocksReduced);
    event AddedToQueue(address indexed owner, uint256 indexed itemId, uint256 indexed gotchiId, uint40 readyBlock, uint256 queueId);

    WearablesFacet wearablesFacet = WearablesFacet(ForgeLibDiamond.WEARABLE_DIAMOND);
    ItemsFacet itemsFacet = ItemsFacet(ForgeLibDiamond.AAVEGOTCHI_DIAMOND);
    AavegotchiFacet aavegotchiFacet = AavegotchiFacet(ForgeLibDiamond.AAVEGOTCHI_DIAMOND);
    AavegotchiGameFacet aavegotchiGameFacet = AavegotchiGameFacet(ForgeLibDiamond.AAVEGOTCHI_DIAMOND);
    IERC20 gltrContract = IERC20(s.GLTR);

    constructor() ERC1155("") { }


    modifier onlyAavegotchiUnlocked(uint256 gotchiId) {
        require(!aavegotchiGameFacet.aavegotchiLocked(gotchiId), "Aavegotchi not unlocked");
        _;
    }
    modifier onlyAavegotchiOwner(uint256 gotchiId) {
        require(LibMeta.msgSender() == aavegotchiFacet.ownerOf(gotchiId), "ForgeFacet: Not Aavegotchi owner");
        _;
    }


    // @notice Get an Aavegotchi's current smithing skill level
    // @dev due to complex formula (approx P = 8 * 1.4^L for each next level), thresholds hardcoded here.
    function getAavegotchiSmithingLevel(uint256 gotchiId) public view returns (uint256) {
        uint256[30] memory sequence =
        [uint256(0), 16, 38, 69, 113, 174, 259, 378, 544, 776, 1100, 1554, 2189, 3078, 4323,
        6066, 8506, 11922, 16704, 23398, 32769, 45889, 64256, 89970, 125970, 176369, 246928,
        345710, 484004, 677616];

        uint256 points = s.gotchiSmithingSkillPoints[gotchiId];

        if (points > sequence[sequence.length - 1]){
            return sequence.length;
        }

        uint256 level = 0;
        for (uint256 i = 0; i < sequence.length; i++) {
            // minimum level is 1 (hence >=), i.e. 1.00x forge time multiplier.
            if (points >= sequence[i]) {
                level++;
            } else {
                break;
            }
        }
        return level;
    }

    // @notice Return the forge time multiplier gained from smithing level, represented in bips.
    function getSmithingLevelMultiplierBips(uint256 gotchiId) public returns (uint256) {
        uint256[30] memory percentTimeSaved = [
            uint256(1000), 970, 953, 935, 916, 896, 875, 854, 833, 811,
             789, 768, 746, 725, 704, 684, 664, 644, 625, 607,
             589, 571, 554, 538, 522, 506, 491, 476, 462, 448
        ];
        uint256 level = getAavegotchiSmithingLevel(gotchiId);
        return percentTimeSaved[level - 1] * 10;
    }


    // @notice Get the specific Core token ID given an Aavegotchi rarity score modifier.
    function coreTokenIdFromRsm(uint8 rarityScoreModifier) public pure returns (uint256 tokenId){
        if (rarityScoreModifier == COMMON_RSM){
            tokenId = CORE_COMMON;
        } else if (rarityScoreModifier == UNCOMMON_RSM){
            tokenId = CORE_UNCOMMON;
        } else if (rarityScoreModifier == RARE_RSM){
            tokenId = CORE_RARE;
        } else if (rarityScoreModifier == LEGENDARY_RSM){
            tokenId = CORE_LEGENDARY;
        } else if (rarityScoreModifier == MYTHICAL_RSM){
            tokenId = CORE_MYTHICAL;
        } else if (rarityScoreModifier == GODLIKE_RSM){
            tokenId = CORE_GODLIKE;
        } else {
            revert("Invalid rarity score modifier");
        }
    }

    function smeltAlloyMintAmount (uint8 rarityScoreModifier) public view returns (uint256 alloy){
        alloy = s.forgeAlloyCost[rarityScoreModifier] * (1 - ((s.alloyBurnFeeInBips + s.alloyDaoFeeInBips) / 10000));
    }

    function _smelt(uint256 itemId, uint256 gotchiId)
    internal
    onlyAavegotchiUnlocked(gotchiId)
    onlyAavegotchiOwner(gotchiId)
    {
        address sender = LibMeta.msgSender();

        require(wearablesFacet.balanceOf(sender, itemId) > 0, "ForgeFacet: smelt item not owned");

        // get smeltedItem metadata
        ItemType memory itemType = itemsFacet.getItemType(itemId);

        // remove smelted item
        // TODO: needs approval
        wearablesFacet.safeTransferFrom(sender, s.FORGE_DIAMOND, itemId, 1, "");

        uint256 totalAlloy = s.forgeAlloyCost[itemType.rarityScoreModifier];
        uint256 daoAlloyAmt = totalAlloy * (s.alloyDaoFeeInBips / 10000);
        uint256 burnAlloyAmt = totalAlloy * (s.alloyBurnFeeInBips / 10000); // "burn" by not minting this amount
        uint256 userAlloyAmt = totalAlloy - daoAlloyAmt - burnAlloyAmt;

        // mint alloy
        _mintItem(sender, ALLOY, userAlloyAmt);
        _mintItem(s.AAVEGOTCHI_DAO, ALLOY, daoAlloyAmt);

        //mint schematic. ID is identical to the wearable ID.
        _mintItem(sender, itemId, 1);

        //mint core
        _mintItem(sender, coreTokenIdFromRsm(itemType.rarityScoreModifier), 1);

        // add smithing skill
        s.gotchiSmithingSkillPoints[gotchiId] +=
            (s.skillPointsEarnedFromForge[itemType.rarityScoreModifier] * (s.smeltingSkillPointReductionFactorBips / 10000));

        emit ItemSmelted(itemId, gotchiId);

        // TODO: chainlink
    }

    function smeltWearables(uint256[] calldata _itemIds, uint256[] calldata _gotchiIds)
    external
    whenNotPaused
    {
        require(_itemIds.length == _gotchiIds.length, "ForgeFacet: mismatched array lengths");

        for(uint256 i; i < _itemIds.length; i++){
            _smelt(_itemIds[i], _gotchiIds[i]);
        }
    }


    function _forge(uint256 itemId, uint256 gotchiId, uint40 _gltr)
    internal
    onlyAavegotchiUnlocked(gotchiId)
    onlyAavegotchiOwner(gotchiId)
    {
        require(!s.gotchiForging[gotchiId].isForging, "ForgeFacet: Aavegotchi already forging");

        address sender = LibMeta.msgSender();
        // get item metadata
        ItemType memory itemType = itemsFacet.getItemType(itemId);
        uint8 rsm = itemType.rarityScoreModifier;

        require(availableToForge(itemId), "ForgeFacet: forge item not in stock");
        require(balanceOf(sender, ALLOY) >= s.forgeAlloyCost[rsm], "ForgeFacet: not enough Alloy.");
        require(balanceOf(sender, coreTokenIdFromRsm(rsm)) >= 1, "ForgeFacet: missing required Core.");

        // Schematic (item ids identical to Wearable ids)
        require(balanceOf(sender, itemId) >= 1, "ForgeFacet: missing required Schematic.");

        // Essence required if forging a pet or godlike item.
        if (itemType.slotPositions[PET_SLOT_INDEX] || rsm == GODLIKE_RSM){
            require(balanceOf(sender, ESSENCE) >= s.forgeEssenceCost[rsm], "ForgeFacet: not enough Essence.");

            _burnItem(sender, ESSENCE, s.forgeEssenceCost[rsm]);
        }

        // burn forge materials
        _burnItem(sender, ALLOY, s.forgeAlloyCost[rsm]);
        _burnItem(sender, coreTokenIdFromRsm(rsm), 1);
        _burnItem(sender, itemId, 1);

        uint256 forgeTime = s.forgeTimeCostInBlocks[rsm] * (getSmithingLevelMultiplierBips(gotchiId) / 10000);

        require(_gltr <= forgeTime, "ForgeFacet: too much GLTR");

        require(
            gltrContract.transferFrom(sender, 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF, (uint256(_gltr) * 1e18)),
            "ForgeFacet: Failed GLTR transfer"
        );

        if (forgeTime - _gltr == 0){
            // Immediately forge the item.
            wearablesFacet.safeTransferFrom(s.FORGE_DIAMOND, sender, itemId, 1, "");
            emit ForgeTimeReduced(0, gotchiId, itemId, _gltr);
        } else {

                // increment first to start at one.
//            s.forgeQueueId += 1;

            uint40 readyBlock = uint40(block.number) + uint40(s.forgeTimeCostInBlocks[rsm]) - _gltr;
            ForgeQueueItem memory newQueueItem = ForgeQueueItem(itemId, gotchiId, false, readyBlock, s.forgeQueueId);
            s.forgeQueue.push(newQueueItem);

            GotchiForging memory gf = GotchiForging(true, s.forgeQueueId);
            s.gotchiForging[gotchiId] = gf;

            // keep track of which items are in queue.
            s.itemForging[itemId] += 1;

            emit AddedToQueue(sender, itemId, gotchiId, readyBlock, s.forgeQueueId);
        }
    }


    function claimForgeQueueItems(uint256[] calldata gotchiIds) external whenNotPaused {
        address sender = LibMeta.msgSender();

        for (uint256 i; i < gotchiIds.length; i++){
            require(!aavegotchiGameFacet.aavegotchiLocked(gotchiIds[i]), "Aavegotchi not unlocked");

            ForgeQueueItem storage queueItem = _getQueueItem(gotchiIds[i]);
            require(!queueItem.claimed, "ForgeFacet: already claimed");
            require(sender == aavegotchiFacet.ownerOf(queueItem.gotchiId), "ForgeFacet: Not Aavegotchi owner");
            require(block.number >= queueItem.readyBlock, "ForgeFacet: Forge item not ready");

            // ready to be claimed, transfer.
            wearablesFacet.safeTransferFrom(s.FORGE_DIAMOND, sender, queueItem.itemId, 1, "");
            s.forgeQueue[queueItem.id].claimed = true;
            s.itemForging[queueItem.itemId] -= 1;
            delete s.gotchiForging[gotchiIds[i]];

            emit ForgeQueueClaimed(queueItem.itemId, gotchiIds[i]);
        }
    }

    function getAavegotchiQueueItem(uint256 gotchiId) external view returns (ForgeQueueItem memory) {
        return _getQueueItem(gotchiId);
    }

    function _getQueueItem(uint256 gotchiId) internal view returns (ForgeQueueItem storage output) {
        require(s.gotchiForging[gotchiId].isForging, "ForgeFacet: Aavegotchi not currently forging.");
        output = s.forgeQueue[s.gotchiForging[gotchiId].forgeQueueId];
    }


    // @notice Get items in the forge queue that can be claimed by _owner.
    // @dev Note that filtering is done only on the _owner current owned gotchis.
    //      Forge item cannot be claimed without owning the gotchi.
    // TODO: check if gas issue with large owners
    function getForgeQueueOfOwner(address _owner) external view returns (ForgeQueueItem[] memory output) {
        uint32[] memory tokenIds = aavegotchiFacet.tokenIdsOfOwner(_owner);
        output = new ForgeQueueItem[](tokenIds.length);
        uint256 counter;

        for (uint256 i; i < tokenIds.length; i++){
            ForgeQueueItem memory queueItem = _getQueueItem(uint256(tokenIds[i]));
            output[counter] = queueItem;
            counter++;
        }
        // add final length to output.
        assembly {
            mstore(output, counter)
        }
    }

    function forgeWearables(uint256[] calldata _itemIds, uint256[] calldata _gotchiIds, uint40[] calldata _gltr)
    external
    whenNotPaused
    {
        require(_itemIds.length == _gotchiIds.length && _gotchiIds.length == _gltr.length, "ForgeFacet: mismatched array lengths");

        for(uint256 i; i < _itemIds.length; i++){
            _forge(_itemIds[i], _gotchiIds[i], _gltr[i]);
        }
    }

    function availableToForge(uint256 itemId) public view returns(bool available) {
        require(itemId < WEARABLE_GAP_OFFSET, "ForgeFacet: only valid for schematics");
        available = wearablesFacet.balanceOf(s.FORGE_DIAMOND, itemId) - s.itemForging[itemId] > 0;
    }


    // @notice Allow Aavegotchi diamond to mint essence.
    // @dev Only called from CollateralFacet's decreaseAndDestroy function. Not including a whenNotPaused modifier
    //      here to avoid impacts to aavegotchi sacrifice functionality.
    function mintEssence(address owner, uint256 gotchiId) external {
        require(LibMeta.msgSender() == ForgeLibDiamond.AAVEGOTCHI_DIAMOND, "ForgeFacet: Can only be called by Aavegotchi Diamond");
//        require(aavegotchiFacet.ownerOf(gotchiId) == address(0), "ForgeFacet: Aavegotchi not sacrificed");

        _mintItem(owner, ESSENCE, 1000);
    }

    function _mintItem(address account, uint256 id, uint256 amount) internal {
        // mint doesnt exceed max supply
        require(totalSupply(id) + amount <= s.maxSupplyByToken[id], "ForgeFacet: mint would exceed max supply");
        _mint(account, id, amount, "");
    }

    function adminMint(address account, uint256 id, uint256 amount) external onlyDaoOrOwner {
        // mint doesnt exceed max supply
        require(totalSupply(id) + amount <= s.maxSupplyByToken[id], "ForgeFacet: mint would exceed max supply");
        _mint(account, id, amount, "");
    }
//    function _mintBatchItems(address to, uint256[] memory ids, uint256[] memory amounts) internal {
//        _mintBatch(to, ids, amounts, "");
//    }
    function _burnItem(address account, uint256 id, uint256 amount) internal {
        _burn(account, id, amount);
    }

    function pause() public onlyDaoOrOwner {
        _pause();
    }
    function unpause() public onlyDaoOrOwner {
        _unpause();
    }

    function name() external pure returns (string memory) {
        return "Aavegotchi Forge";
    }

    function symbol() external pure returns (string memory) {
        return "FORGE";
    }

    function uri(uint256 tokenId) public view virtual override(ERC1155, ERC1155URIStorage) returns (string memory) {
        return ERC1155URIStorage.uri(tokenId);
    }
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data) internal virtual override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) external returns (bytes4) {
        return this.onERC1155Received.selector;
    }
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) external returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

}
