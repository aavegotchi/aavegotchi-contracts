// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;


import "../libraries/LibAppStorage.sol";
import {WearablesFacet} from "../../WearableDiamond/facets/WearablesFacet.sol";
import {ForgeLibDiamond} from "../libraries/ForgeLibDiamond.sol";
import {ForgeDiamond} from "../ForgeDiamond.sol";
import {ForgeTokenFacet} from "./ForgeTokenFacet.sol";

// Аavegotchi
import {IERC20} from "../../../shared/interfaces/IERC20.sol";
import {LibMeta} from "../../../shared/libraries/LibMeta.sol";
import {ItemsFacet} from "../../facets/ItemsFacet.sol";
import {ItemType} from "../../libraries/LibAppStorage.sol";
import {AavegotchiFacet} from "../../facets/AavegotchiFacet.sol";
import {AavegotchiGameFacet} from "../../facets/AavegotchiGameFacet.sol";
import {LendingGetterAndSetterFacet} from "../../facets/LendingGetterAndSetterFacet.sol";




contract ForgeFacet is Modifiers {
    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
    event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values);

    event ItemSmelted(uint256 itemId, uint256 gotchiId);
    event ItemForged(uint256 itemId, uint256 gotchiId);
    event ForgeQueueClaimed(uint256 itemId, uint256 gotchiId);

    event ForgeTimeReduced(uint256 indexed queueId, uint256 indexed gotchiId, uint256 indexed itemId, uint40 _blocksReduced);
    event AddedToQueue(address indexed owner, uint256 indexed itemId, uint256 indexed gotchiId, uint40 readyBlock, uint256 queueId);
    event QueueTimeReduced(uint256 indexed gotchiId, uint40 reducedBlocks);



    modifier onlyAavegotchiUnlocked(uint256 gotchiId) {
        require(!aavegotchiGameFacet().isAavegotchiLocked(gotchiId), "ForgeFacet: Aavegotchi is locked");
        _;
    }
    // @notice Will revert if aavegotchi is in active rental as well.
    modifier onlyAavegotchiOwner(uint256 gotchiId) {
        require(!lendingGetterAndSetterFacet().isAavegotchiLent(uint32(gotchiId)), "ForgeFacet: Aavegotchi is lent out");
        require(LibMeta.msgSender() == aavegotchiFacet().ownerOf(gotchiId), "ForgeFacet: Not Aavegotchi owner");
        _;
    }

    function forgeTokenFacet() internal view returns (ForgeTokenFacet facet){
        facet = ForgeTokenFacet(address(this));
    }
    // External contracts
    function aavegotchiGameFacet() internal pure returns (AavegotchiGameFacet facet){
        facet = AavegotchiGameFacet(ForgeLibDiamond.AAVEGOTCHI_DIAMOND);
    }

    function aavegotchiFacet() internal pure returns (AavegotchiFacet facet){
        facet = AavegotchiFacet(ForgeLibDiamond.AAVEGOTCHI_DIAMOND);
    }

    function itemsFacet() internal pure returns (ItemsFacet facet){
        facet = ItemsFacet(ForgeLibDiamond.AAVEGOTCHI_DIAMOND);
    }

    function wearablesFacet() internal pure returns (WearablesFacet facet){
        facet = WearablesFacet(ForgeLibDiamond.WEARABLE_DIAMOND);
    }

    function lendingGetterAndSetterFacet() internal pure returns (LendingGetterAndSetterFacet facet){
        facet = LendingGetterAndSetterFacet(ForgeLibDiamond.AAVEGOTCHI_DIAMOND);
    }

    function gltrContract() internal returns (IERC20 token){
        token = IERC20(s.GLTR);
    }
    ////////


    // @notice Get an Aavegotchi's current smithing skill level
    // @dev due to complex formula (approx P = 8 * 1.4^L for each next level), thresholds hardcoded here.
    function getAavegotchiSmithingLevel(uint256 gotchiId) public view returns (uint256) {
        uint256[30] memory sequence =
        [uint256(0), 16, 38, 69, 113, 174, 259, 378, 544, 776, 1100, 1554, 2189, 3078, 4323,
        6066, 8506, 11922, 16704, 23398, 32769, 45889, 64256, 89970, 125970, 176369, 246928,
        345710, 484004, 677616];

        uint256 points = s.gotchiSmithingSkillPoints[gotchiId];

        if (points > sequence[sequence.length - 1]) {
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

    function getAavegotchiSmithingSkillPts(uint256 gotchiId) public view returns (uint256) {
        return s.gotchiSmithingSkillPoints[gotchiId];
    }


    // @notice Return the forge time multiplier gained from smithing level, represented in bips
    //         approximating M=0.97^(L-1).
    function getSmithingLevelMultiplierBips(uint256 gotchiId) public view returns (uint256) {
        uint256[30] memory percentTimeDiscountBips = [
            uint256(1000), 970, 941, 913, 885, 859, 833, 808, 784, 760,
            737, 715, 694, 673, 653, 633, 614, 596, 578, 561, 544, 527,
            512, 496, 481, 467, 453, 439, 426, 413
        ];
        uint256 level = getAavegotchiSmithingLevel(gotchiId);

        return percentTimeDiscountBips[level - 1] * 10;
    }


    // @notice Get the specific Core token ID given an item rarity score modifier and slot positions.
    function getCoreTokenId(uint8 rarityScoreModifier, bool[16] memory slotPositions) public pure returns (uint256 tokenId){
        if (rarityScoreModifier == COMMON_RSM) {
            if (slotPositions[0]) {tokenId = CORE_BODY_COMMON;}
            if (slotPositions[1]) {tokenId = CORE_FACE_COMMON;}
            if (slotPositions[2]) {tokenId = CORE_EYES_COMMON;}
            if (slotPositions[3]) {tokenId = CORE_HEAD_COMMON;}
            if (slotPositions[4] || slotPositions[5]) {tokenId = CORE_HANDS_COMMON;}
            if (slotPositions[6]) {tokenId = CORE_PET_COMMON;}
        } else if (rarityScoreModifier == UNCOMMON_RSM) {
            if (slotPositions[0]) {tokenId = CORE_BODY_UNCOMMON;}
            if (slotPositions[1]) {tokenId = CORE_FACE_UNCOMMON;}
            if (slotPositions[2]) {tokenId = CORE_EYES_UNCOMMON;}
            if (slotPositions[3]) {tokenId = CORE_HEAD_UNCOMMON;}
            if (slotPositions[4] || slotPositions[5]) {tokenId = CORE_HANDS_UNCOMMON;}
            if (slotPositions[6]) {tokenId = CORE_PET_UNCOMMON;}
        } else if (rarityScoreModifier == RARE_RSM) {
            if (slotPositions[0]) {tokenId = CORE_BODY_RARE;}
            if (slotPositions[1]) {tokenId = CORE_FACE_RARE;}
            if (slotPositions[2]) {tokenId = CORE_EYES_RARE;}
            if (slotPositions[3]) {tokenId = CORE_HEAD_RARE;}
            if (slotPositions[4] || slotPositions[5]) {tokenId = CORE_HANDS_RARE;}
            if (slotPositions[6]) {tokenId = CORE_PET_RARE;}
        } else if (rarityScoreModifier == LEGENDARY_RSM) {
            if (slotPositions[0]) {tokenId = CORE_BODY_LEGENDARY;}
            if (slotPositions[1]) {tokenId = CORE_FACE_LEGENDARY;}
            if (slotPositions[2]) {tokenId = CORE_EYES_LEGENDARY;}
            if (slotPositions[3]) {tokenId = CORE_HEAD_LEGENDARY;}
            if (slotPositions[4] || slotPositions[5]) {tokenId = CORE_HANDS_LEGENDARY;}
            if (slotPositions[6]) {tokenId = CORE_PET_LEGENDARY;}
        } else if (rarityScoreModifier == MYTHICAL_RSM) {
            if (slotPositions[0]) {tokenId = CORE_BODY_MYTHICAL;}
            if (slotPositions[1]) {tokenId = CORE_FACE_MYTHICAL;}
            if (slotPositions[2]) {tokenId = CORE_EYES_MYTHICAL;}
            if (slotPositions[3]) {tokenId = CORE_HEAD_MYTHICAL;}
            if (slotPositions[4] || slotPositions[5]) {tokenId = CORE_HANDS_MYTHICAL;}
            if (slotPositions[6]) {tokenId = CORE_PET_MYTHICAL;}
        } else if (rarityScoreModifier == GODLIKE_RSM) {
            if (slotPositions[0]) {tokenId = CORE_BODY_GODLIKE;}
            if (slotPositions[1]) {tokenId = CORE_FACE_GODLIKE;}
            if (slotPositions[2]) {tokenId = CORE_EYES_GODLIKE;}
            if (slotPositions[3]) {tokenId = CORE_HEAD_GODLIKE;}
            if (slotPositions[4] || slotPositions[5]) {tokenId = CORE_HANDS_GODLIKE;}
            if (slotPositions[6]) {tokenId = CORE_PET_GODLIKE;}
        } else {
            revert("Invalid rarity score modifier");
        }
    }

    // @notice Get the specific Geode token ID given an Aavegotchi rarity score modifier.
    function geodeTokenIdFromRsm(uint8 rarityScoreModifier) public pure returns (uint256 tokenId){
        if (rarityScoreModifier == COMMON_RSM) {
            tokenId = GEODE_COMMON;
        } else if (rarityScoreModifier == UNCOMMON_RSM) {
            tokenId = GEODE_UNCOMMON;
        } else if (rarityScoreModifier == RARE_RSM) {
            tokenId = GEODE_RARE;
        } else if (rarityScoreModifier == LEGENDARY_RSM) {
            tokenId = GEODE_LEGENDARY;
        } else if (rarityScoreModifier == MYTHICAL_RSM) {
            tokenId = GEODE_MYTHICAL;
        } else if (rarityScoreModifier == GODLIKE_RSM) {
            tokenId = GEODE_GODLIKE;
        } else {
            revert("Invalid rarity score modifier");
        }
    }


    function _smelt(uint256 itemId, uint256 gotchiId)
    internal
    onlyAavegotchiOwner(gotchiId)
    onlyAavegotchiUnlocked(gotchiId)
    {
        address sender = LibMeta.msgSender();
        require(wearablesFacet().balanceOf(sender, itemId) > 0, "ForgeFacet: smelt item not owned");

        // get smelted item metadata
        ItemType memory itemType = itemsFacet().getItemType(itemId);

        require(itemType.category == 0, "ForgeFacet: Only wearables can be smelted");

        // remove smelted item
        wearablesFacet().safeTransferFrom(sender, address(this), itemId, 1, "");

        uint256 totalAlloy = s.forgeAlloyCost[itemType.rarityScoreModifier];
        uint256 daoAlloyAmt = totalAlloy * s.alloyDaoFeeInBips / 10000;
        uint256 burnAlloyAmt = totalAlloy * s.alloyBurnFeeInBips / 10000; // "burn" by not minting this amount
        uint256 userAlloyAmt = totalAlloy - daoAlloyAmt - burnAlloyAmt;

        // mint alloy
        _mintItem(sender, ALLOY, userAlloyAmt);
        _mintItem(s.AAVEGOTCHI_DAO, ALLOY, daoAlloyAmt);

        //mint schematic. ID is identical to the wearable ID.
        _mintItem(sender, itemId, 1);

        //mint core
        _mintItem(sender, getCoreTokenId(itemType.rarityScoreModifier, itemType.slotPositions), 1);

        //mint geode
        _mintItem(sender, geodeTokenIdFromRsm(itemType.rarityScoreModifier), 1);

        // add smithing skill
        s.gotchiSmithingSkillPoints[gotchiId] +=
            (s.skillPointsEarnedFromForge[itemType.rarityScoreModifier] * s.smeltingSkillPointReductionFactorBips / 10000);

        emit ItemSmelted(itemId, gotchiId);
    }

    function smeltWearables(uint256[] calldata _itemIds, uint256[] calldata _gotchiIds)
    external
    whenNotPaused
    {
        require(_itemIds.length == _gotchiIds.length, "ForgeFacet: mismatched array lengths");

        for (uint256 i; i < _itemIds.length; i++) {
            _smelt(_itemIds[i], _gotchiIds[i]);
        }
    }


    function _forge(uint256 itemId, uint256 gotchiId, uint40 _gltr)
    internal
    onlyAavegotchiOwner(gotchiId)
    onlyAavegotchiUnlocked(gotchiId)
    {
        require(!s.gotchiForging[gotchiId].isForging, "ForgeFacet: Aavegotchi already forging");

        address sender = LibMeta.msgSender();
        // get item metadata
        ItemType memory itemType = itemsFacet().getItemType(itemId);
        uint8 rsm = itemType.rarityScoreModifier;
        bool[16] memory slots = itemType.slotPositions;

        require(forgeTokenFacet().balanceOf(sender, ALLOY) >= s.forgeAlloyCost[rsm], "ForgeFacet: not enough Alloy");
        require(forgeTokenFacet().balanceOf(sender, getCoreTokenId(rsm, slots)) >= 1, "ForgeFacet: missing required Core");
        require(isForgeable(itemId), "ForgeFacet: forge item not in stock");

        // Schematic (item ids identical to Wearable ids)
        require(forgeTokenFacet().balanceOf(sender, itemId) >= 1, "ForgeFacet: missing required Schematic.");

        // Essence required if forging a pet or godlike item.
        if (itemType.slotPositions[PET_SLOT_INDEX] || rsm == GODLIKE_RSM) {
            require(forgeTokenFacet().balanceOf(sender, ESSENCE) >= s.forgeEssenceCost[rsm], "ForgeFacet: not enough Essence");

            _burnItem(sender, ESSENCE, s.forgeEssenceCost[rsm]);
        }

        // burn forge materials
        _burnItem(sender, ALLOY, s.forgeAlloyCost[rsm]);
        _burnItem(sender, getCoreTokenId(rsm, slots), 1);
        _burnItem(sender, itemId, 1);

        uint256 forgeTime = forgeTime(gotchiId, rsm);

        require(_gltr <= forgeTime, "ForgeFacet: too much GLTR");

        require(
            gltrContract().transferFrom(sender, 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF, (uint256(_gltr) * 1e18)),
            "ForgeFacet: Failed GLTR transfer"
        );

        if (forgeTime - _gltr == 0) {
            // Immediately forge the item.
            wearablesFacet().safeTransferFrom(address(this), sender, itemId, 1, "");
            emit ForgeTimeReduced(0, gotchiId, itemId, _gltr);
        } else {
            uint40 readyBlock = uint40(block.number) + uint40(s.forgeTimeCostInBlocks[rsm]) - _gltr;
            ForgeQueueItem memory newQueueItem = ForgeQueueItem(itemId, gotchiId, s.forgeQueueId, readyBlock, false);
            s.forgeQueue.push(newQueueItem);

            GotchiForging memory gf = GotchiForging(s.forgeQueueId, true);
            s.gotchiForging[gotchiId] = gf;

            s.forgeQueueId += 1;

            // keep track of which items are in queue.
            s.itemForging[itemId] += 1;

            emit AddedToQueue(sender, itemId, gotchiId, readyBlock, newQueueItem.id);
        }

        // add smithing skill
        s.gotchiSmithingSkillPoints[gotchiId] += s.skillPointsEarnedFromForge[itemType.rarityScoreModifier];
    }

    // @dev returns the time (in blocks) cost for forging for an aavegotchi
    // @param gotchId
    // @param rsm Rarity score modifier of an item (1, 2, 5, 10, 20, 50).
    function forgeTime(uint256 gotchiId, uint8 rsm) public view returns (uint256 forgeTime) {
        forgeTime = s.forgeTimeCostInBlocks[rsm] * getSmithingLevelMultiplierBips(gotchiId) / 10000;
    }


    function claimForgeQueueItems(uint256[] calldata gotchiIds) external whenNotPaused {
        for (uint256 i; i < gotchiIds.length; i++) {
            _claimQueueItem(gotchiIds[i]);
        }
    }

    function _claimQueueItem(uint256 gotchiId)
    internal
    onlyAavegotchiOwner(gotchiId)
    onlyAavegotchiUnlocked(gotchiId) {
        address sender = LibMeta.msgSender();
        ForgeQueueItem storage queueItem = _getForgeQueueItem(gotchiId);

        require(!queueItem.claimed, "ForgeFacet: already claimed");
        require(block.number >= queueItem.readyBlock, "ForgeFacet: Forge item not ready");

        // ready to be claimed, transfer.
        s.forgeQueue[queueItem.id].claimed = true;
        s.itemForging[queueItem.itemId] -= 1;
        delete s.gotchiForging[gotchiId];
        wearablesFacet().safeTransferFrom(address(this), sender, queueItem.itemId, 1, "");

        emit ForgeQueueClaimed(queueItem.itemId, gotchiId);
    }


    /// @notice Allow a user to speed up multiple queues(installation craft time) by paying the correct amount of $GLTR tokens
    /// @dev Will throw if the caller is not the queue owner
    /// @dev $GLTR tokens are burnt upon usage
    /// @dev amount expressed in block numbers
    /// @param _gotchiIds An array containing the gotchi ID queues to speed up
    /// @param _amounts An array containing the corresponding amounts of $GLTR tokens to pay for each queue speedup
    function reduceQueueTime(uint256[] calldata _gotchiIds, uint40[] calldata _amounts) external {
        require(_gotchiIds.length == _amounts.length, "InstallationFacet: Mismatched arrays");
        for (uint256 i; i < _gotchiIds.length; i++) {
            uint256 gotchiId = _gotchiIds[i];
            ForgeQueueItem storage queueItem = _getForgeQueueItem(gotchiId);

            require(msg.sender == aavegotchiFacet().ownerOf(gotchiId), "ForgeFacet: Not gotchi owner");

            require(block.number <= queueItem.readyBlock, "InstallationFacet: installation already done");

            IERC20 gltr = IERC20(s.GLTR);

            uint40 blockLeft = queueItem.readyBlock - uint40(block.number);
            uint40 removeBlocks = _amounts[i] <= blockLeft ? _amounts[i] : blockLeft;
            uint256 burnAmount = uint256(removeBlocks) * 10 ** 18;

            require(
                gltrContract().transferFrom(msg.sender, 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF, burnAmount),
                "ForgeFacet: Failed GLTR transfer"
            );

            queueItem.readyBlock -= removeBlocks;
            emit QueueTimeReduced(gotchiId, removeBlocks);
        }
    }


    function getForgeQueueItem(uint256 gotchiId) external view returns (ForgeQueueItem memory) {
        return _getForgeQueueItem(gotchiId);
    }

    function _getForgeQueueItem(uint256 gotchiId) internal view returns (ForgeQueueItem storage output) {
        require(s.gotchiForging[gotchiId].isForging, "ForgeFacet: Aavegotchi not currently forging.");
        output = s.forgeQueue[s.gotchiForging[gotchiId].forgeQueueId];
    }

    function getForgeQueue() external view returns (ForgeQueueItem[] memory queue){
        queue = s.forgeQueue;
    }


    // @notice Get items in the forge queue that can be claimed by _owner.
    // @dev Note that filtering is done only on the _owner current owned gotchis.
    //      Forge item cannot be claimed without owning the gotchi.
    function getForgeQueueItemsByOwner(address _owner) external view returns (ForgeQueueItem[] memory output) {
        uint32[] memory tokenIds = aavegotchiFacet().tokenIdsOfOwner(_owner);
        output = new ForgeQueueItem[](tokenIds.length);
        uint256 counter;

        for (uint256 i; i < tokenIds.length; i++) {
            if (s.gotchiForging[tokenIds[i]].isForging) {
                ForgeQueueItem memory queueItem;
                queueItem = _getForgeQueueItem(uint256(tokenIds[i]));

                output[counter] = queueItem;
                counter++;
            }
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

        for (uint256 i; i < _itemIds.length; i++) {
            _forge(_itemIds[i], _gotchiIds[i], _gltr[i]);
        }
    }


    function isForgeable(uint256 itemId) public view returns (bool available) {
        require(itemId < WEARABLE_GAP_OFFSET, "ForgeFacet: only valid for schematics");
        available = wearablesFacet().balanceOf(address(this), itemId) - s.itemForging[itemId] > 0;
    }

    function isGotchiForging(uint256 gotchiId) public view returns(bool) {
        return s.gotchiForging[gotchiId].isForging;
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
//        require(totalSupply(id) + amount <= s.maxSupplyByToken[id], "ForgeFacet: mint would exceed max supply");
        _mint(account, id, amount, "");
    }

    function adminMint(address account, uint256 id, uint256 amount) external onlyDaoOrOwner {
        // mint doesnt exceed max supply
//        require(totalSupply(id) + amount <= s.maxSupplyByToken[id], "ForgeFacet: mint would exceed max supply");
        _mint(account, id, amount, "");
    }
    function adminMintBatch(address to, uint256[] memory ids, uint256[] memory amounts) external onlyDaoOrOwner {
        // mint doesnt exceed max supply
//        require(totalSupply(id) + amount <= s.maxSupplyByToken[id], "ForgeFacet: mint would exceed max supply");
        _mintBatch(to, ids, amounts, "");
    }
//    function _mintBatchItems(address to, uint256[] memory ids, uint256[] memory amounts) internal {
//        _mintBatch(to, ids, amounts, "");
//    }
    function _burnItem(address account, uint256 id, uint256 amount) internal {
        _burn(account, id, amount);
    }


    function _mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal {
        require(to != address(0), "ForgeFacet: mint to the zero address");

        s._balances[id][to] += amount;
        s._totalSupply[id] += amount;
        emit TransferSingle(msg.sender, address(0), to, id, amount);
    }

    function _mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal {
        require(to != address(0), "ForgeTokenFacet: mint to the zero address");
        require(ids.length == amounts.length, "ForgeTokenFacet: ids and amounts length mismatch");

        for (uint256 i = 0; i < ids.length; i++) {
            s._balances[ids[i]][to] += amounts[i];
            s._totalSupply[ids[i]] += amounts[i];
        }
        emit TransferBatch(msg.sender, address(0), to, ids, amounts);
    }

    function _burn(
        address from,
        uint256 id,
        uint256 amount
    ) internal virtual {
        require(from != address(0), "ForgeTokenFacet: burn from the zero address");

        uint256 fromBalance = s._balances[id][from];
        require(fromBalance >= amount, "ForgeTokenFacet: burn amount exceeds balance");
        unchecked {
            s._balances[id][from] = fromBalance - amount;
            s._totalSupply[id] += amount;
        }
        emit TransferSingle(msg.sender, from, address(0), id, amount);
    }
    function _burnBatch(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) internal virtual {
        require(from != address(0), "ForgeTokenFacet: burn from the zero address");
        require(ids.length == amounts.length, "ForgeTokenFacet: ids and amounts length mismatch");

        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];

            uint256 fromBalance = s._balances[id][from];
            require(fromBalance >= amount, "ForgeTokenFacet: burn amount exceeds balance");
            unchecked {
                s._balances[id][from] = fromBalance - amount;
                s._totalSupply[id] += amount;
            }
        }
        emit TransferBatch(msg.sender, from, address(0), ids, amounts);
    }

}
