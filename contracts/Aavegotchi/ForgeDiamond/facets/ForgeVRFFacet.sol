// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "../libraries/LibAppStorage.sol";

import {LibMeta} from "../../../shared/libraries/LibMeta.sol";
import {ILink} from "../../interfaces/ILink.sol";
import {ForgeFacet} from "./ForgeFacet.sol";
import {ForgeTokenFacet} from "./ForgeTokenFacet.sol";

contract ForgeVRFFacet is Modifiers {
    event VrfResponse(address user, uint256 randomNumber, bytes32 requestId, uint256 blockNumber);
    event GeodeWin(address user, uint256 itemId, uint256 geodeTokenId, bytes32 requestId, uint256 blockNumber);
    event GeodeEmpty(address user, uint256 geodeTokenId, bytes32 requestId, uint256 blockNumber);
    event GeodeRefunded(address user, uint256 geodeTokenId, bytes32 requestId, uint256 blockNumber);

    function forgeTokenFacet() internal view returns (ForgeTokenFacet facet) {
        facet = ForgeTokenFacet(address(this));
    }

    function forgeFacet() internal view returns (ForgeFacet facet) {
        facet = ForgeFacet(address(this));
    }

    function linkBalance() external view returns (uint256 linkBalance_) {
        linkBalance_ = s.link.balanceOf(address(this));
    }

    function vrfCoordinator() external view returns (address) {
        return s.vrfCoordinator;
    }

    function link() external view returns (address) {
        return address(s.link);
    }

    function keyHash() external view returns (bytes32) {
        return s.keyHash;
    }

    function getMaxVrf() public pure returns (uint256) {
        return 15;
    }

    function areGeodePrizesAvailable() public view returns (bool) {
        for (uint256 i; i < s.geodePrizeTokenIds.length; i++) {
            uint256 tokenId = s.geodePrizeTokenIds[i];

            if (tokenId != 0 && s.geodePrizeQuantities[tokenId] > 0 && s.ownerItemBalances[address(this)][tokenId] > 0) {
                return true;
            }
        }
        return false;
    }

    function numTotalPrizesLeft() public view returns (uint256 total) {
        for (uint256 i; i < s.geodePrizeTokenIds.length; i++) {
            total += s.geodePrizeQuantities[s.geodePrizeTokenIds[i]];
        }
    }

    // @notice returns array of prizes left indexed by rarity (common = 0, uncommon = 1, rare = 2, etc)
    function numTotalPrizesLeftByRarity() public view returns (uint256[6] memory total) {
        for (uint256 i; i < s.geodePrizeTokenIds.length; i++) {
            uint8 idx = forgeFacet().getRsmIndex(s.geodePrizeRarities[s.geodePrizeTokenIds[i]]);
            total[idx] += s.geodePrizeQuantities[s.geodePrizeTokenIds[i]];
        }
    }

    function openGeodes(uint256[] calldata _geodeTokenIds, uint256[] calldata _amountPerToken) external whenNotPaused {
        require(_geodeTokenIds.length > 0, "ForgeVRFFacet: Cannot open 0 geodes");
        require(areGeodePrizesAvailable(), "ForgeVRFFacet: No prizes currently available");
        require(_geodeTokenIds.length == _amountPerToken.length, "ForgeVRFFacet: mismatched arrays");

        address sender = LibMeta.msgSender();
        uint256 total;
        for (uint256 i; i < _amountPerToken.length; i++) {
            total += _amountPerToken[i];

            require(_geodeTokenIds[i] >= GEODE_COMMON && _geodeTokenIds[i] <= GEODE_GODLIKE, "ForgeVRFFacet: Invalid geode token ID");
            require(forgeTokenFacet().balanceOf(sender, _geodeTokenIds[i]) >= _amountPerToken[i], "ForgeVRFFacet: not enough geodes owned");
            require(total <= getMaxVrf(), "ForgeVRFFacet: Exceeds max total geodes per call");
        }

        // spend geodes
        forgeTokenFacet().safeBatchTransferFrom(sender, address(this), _geodeTokenIds, _amountPerToken, "");
        drawRandomNumber(_geodeTokenIds, _amountPerToken);
    }

    function drawRandomNumber(uint256[] calldata _geodeTokenIds, uint256[] calldata _amountPerToken) internal {
        address sender = LibMeta.msgSender();

        require(!s.userVrfPending[sender], "ForgeVRFFacet: Already waiting for VRF response or to claim previous call.");
        s.userVrfPending[sender] = true;

        uint256 fee = s.vrfFee;
        require(s.link.balanceOf(address(this)) >= fee, "ForgeVRFFacet: Not enough LINK");
        bytes32 l_keyHash = s.keyHash;
        require(s.link.transferAndCall(s.vrfCoordinator, fee, abi.encode(l_keyHash, 0)), "ForgeVRFFacet: link transfer failed");
        uint256 vrfSeed = uint256(keccak256(abi.encode(l_keyHash, 0, address(this), s.vrfNonces[l_keyHash])));
        s.vrfNonces[l_keyHash]++;
        bytes32 requestId = keccak256(abi.encodePacked(l_keyHash, vrfSeed));

        VrfRequestInfo memory reqInfo = VrfRequestInfo({
            user: sender,
            requestId: requestId,
            status: VrfStatus.PENDING,
            randomNumber: 0,
            geodeTokenIds: _geodeTokenIds,
            amountPerToken: _amountPerToken
        });

        s.vrfRequestIdToVrfRequestInfo[requestId] = reqInfo;
        s.vrfUserToRequestIds[sender].push(requestId);

        // for testing
        //        tempFulfillRandomness(requestId, uint256(keccak256(abi.encodePacked(block.number, _geodeTokenIds[0]))));
    }

    // for testing purpose only
    // function tempFulfillRandomness(bytes32 _requestId, uint256 _randomNumber) internal {
    //     VrfRequestInfo storage info = s.vrfRequestIdToVrfRequestInfo[_requestId];

    //     require(s.userVrfPending[info.user], "ForgeVRFFacet: VRF is not pending for user");
    //     require(info.status == VrfStatus.PENDING, "ForgeVRFFacet: VRF request is not pending");

    //     info.randomNumber = _randomNumber;
    //     info.status = VrfStatus.READY_TO_CLAIM;

    //     emit VrfResponse(info.user, _randomNumber, _requestId, block.number);
    // }

    /**
         * @notice fulfillRandomness handles the VRF response. Your contract must
         * @notice implement it.
         *
         * @dev The VRFCoordinator expects a calling contract to have a method with
         * @dev this signature, and will trigger it once it has verified the proof
         * @dev associated with the randomness (It is triggered via a call to
         * @dev rawFulfillRandomness, below.)
         *
         * @param _requestId The Id initially returned by requestRandomness
         * @param _randomNumber the VRF output
    //     */
    function rawFulfillRandomness(bytes32 _requestId, uint256 _randomNumber) external {
        require(LibMeta.msgSender() == s.vrfCoordinator, "Only VRFCoordinator can fulfill");

        VrfRequestInfo storage info = s.vrfRequestIdToVrfRequestInfo[_requestId];

        require(s.userVrfPending[info.user], "ForgeVRFFacet: VRF is not pending for user");
        require(info.status == VrfStatus.PENDING, "ForgeVRFFacet: VRF request is not pending");

        info.randomNumber = _randomNumber;
        info.status = VrfStatus.READY_TO_CLAIM;

        emit VrfResponse(info.user, _randomNumber, _requestId, block.number);
    }

    function getRequestInfo(address user) external view returns (VrfRequestInfo memory) {
        //        require(s.vrfUserToRequestIds[user].length > 0, "ForgeVRFFacet: No VRF requests");
        bytes32 requestId = s.vrfUserToRequestIds[user][s.vrfUserToRequestIds[user].length - 1];
        VrfRequestInfo storage info = s.vrfRequestIdToVrfRequestInfo[requestId];

        return info;
    }

    function getRequestInfoByRequestId(bytes32 requestId) external view returns (VrfRequestInfo memory) {
        return s.vrfRequestIdToVrfRequestInfo[requestId];
    }

    /**
         * @notice get the current prize probabilities based on available prizes
    */
    function getCurrentPrizeProbabilityForGeode(uint8 geodeRsm) public view returns (uint256[6] memory) {
        uint8[6] memory rarities = [uint8(COMMON_RSM), UNCOMMON_RSM, RARE_RSM, LEGENDARY_RSM, MYTHICAL_RSM, GODLIKE_RSM];
        uint256[6] memory probability;

        // get base probabilities
        for(uint8 i; i < rarities.length; i++){
            probability[i] = s.geodeWinChanceMultiTierBips[geodeRsm][rarities[i]];
        }
        uint256[6] memory prizesLeft = numTotalPrizesLeftByRarity();

        // modify baseProbabilities based on available items
        // looping rarity idx backwards from 5 but stop at 1, because logic handles setting common probability (idx 0).
        for (uint256 i = rarities.length - 1; i >= 1; i--){
            if (prizesLeft[i] == 0){
                probability[i - 1] += probability[i];
                probability[i] = 0;
            }
        }
        // handle common case (index 0)
        if (prizesLeft[0] == 0){
            probability[0] = 0;
        }

        return probability;
    }

    function getAvailablePrizesForRarity(uint8 rsm) public view returns (uint256[] memory) {
        uint256[] memory temp = new uint256[](s.geodePrizeTokenIds.length);
        uint256 amt = 0;
        uint256 count = 0;

        for (uint256 i; i < s.geodePrizeTokenIds.length; i++){
            if (s.geodePrizeRarities[s.geodePrizeTokenIds[i]] == rsm){
                temp[i] = s.geodePrizeTokenIds[i];
                amt += 1;
            }
        }
        // strip 0s
        uint256[] memory prizes = new uint256[](amt);
        for (uint256 i; i < temp.length; i++){
            if (temp[i] != 0){
                prizes[count] = temp[i];
                count++;
            }

        }
        return prizes;
    }

    function getWinRanges(uint256[6] memory winChanceByRarity) public pure returns (uint256[] memory probabilityRanges){
        probabilityRanges = new uint256[](winChanceByRarity.length);
        probabilityRanges[0] = winChanceByRarity[0];

        uint256 lastNonZero;
        if (probabilityRanges[0] != 0){
            lastNonZero = probabilityRanges[0];
        }

        for (uint256 i = 1; i < winChanceByRarity.length; i++){
            if (winChanceByRarity[i] == 0) {
                probabilityRanges[i] = 0;
            } else {
                probabilityRanges[i] = winChanceByRarity[i] + lastNonZero;
                lastNonZero = winChanceByRarity[i] + lastNonZero;
            }
        }
    }

    function getRarityWon(uint256[] memory probabilityRanges, uint256 geodeRandNum) internal pure returns (int) {
        int rarityWonIndex = -1;

        uint256 lastNonZero;
        if (probabilityRanges[0] != 0){
            lastNonZero = probabilityRanges[0];
        }

        if (geodeRandNum <= probabilityRanges[0] && geodeRandNum > 0){
            rarityWonIndex = 0;
        } else {
            for (uint256 i = 1; i < probabilityRanges.length; i++){
                if (probabilityRanges[i] == 0) {
                    continue;
                } else {
                    if (geodeRandNum <= probabilityRanges[i] && geodeRandNum > lastNonZero ){
                        rarityWonIndex = int(i);
                        break;
                    } else {
                        lastNonZero = probabilityRanges[i];
                    }
                }
            }
        }
        return rarityWonIndex;
    }

    struct PrizeCalculationData {
        uint256 prizesLeft;
        uint256 numWins;
        uint256 modNum;
        uint256 divNum;
        uint256 geodeRandNum;
        int rarityWonIndex;
        uint256 itemIdWon;
        uint256[] probabilityRanges;
        uint256[] prizes;
        uint8 rsm;
        uint256[6] winChanceByRarity;
    }


    function claimWinnings() external whenNotPaused {
        address sender = LibMeta.msgSender();

        require(s.vrfUserToRequestIds[sender].length > 0, "ForgeVRFFacet: No VRF requests");
        bytes32 requestId = s.vrfUserToRequestIds[sender][s.vrfUserToRequestIds[sender].length - 1];

        VrfRequestInfo storage info = s.vrfRequestIdToVrfRequestInfo[requestId];

        require(info.status == VrfStatus.READY_TO_CLAIM, "ForgeVRFFacet: not ready to claim");
        require(info.randomNumber != 0, "ForgeVRFFacet: invalid random number");

        uint8[6] memory rarities = [uint8(COMMON_RSM), UNCOMMON_RSM, RARE_RSM, LEGENDARY_RSM, MYTHICAL_RSM, GODLIKE_RSM];

        PrizeCalculationData memory data = PrizeCalculationData({
            prizesLeft: numTotalPrizesLeft(),
            numWins: 0,
            modNum: 10000,
            divNum: 1,
            geodeRandNum: 0,
            rarityWonIndex: 0,
            itemIdWon: 0,
            probabilityRanges: new uint256[](0),
            prizes: new uint256[](0),
            rsm: 0,
            winChanceByRarity: [uint256(0), 0, 0, 0, 0, 0]
        });

        for (uint256 i; i < info.geodeTokenIds.length; i++) {
            data.rsm = forgeFacet().geodeRsmFromTokenId(info.geodeTokenIds[i]);
            data.winChanceByRarity = getCurrentPrizeProbabilityForGeode(data.rsm);

            for (uint256 j; j < info.amountPerToken[i]; j++) {
                if (data.numWins < data.prizesLeft) {
                    // geodeRandNum is a 4 digit (0-9999) subsection of the random number
                    data.geodeRandNum = (info.randomNumber % data.modNum) / data.divNum;

                    // First create a list of win ranges.
                    data.probabilityRanges = getWinRanges(data.winChanceByRarity);

                    // choose rarity won if any
                    data.rarityWonIndex = getRarityWon(data.probabilityRanges, data.geodeRandNum);

                    if (data.rarityWonIndex >= 0){
                        data.prizes = getAvailablePrizesForRarity(rarities[uint(data.rarityWonIndex)]);
                        uint256 idx = data.geodeRandNum % data.prizes.length;
                        data.itemIdWon = data.prizes[idx];

                        // if last quantity of item won, rearrange array.
                        if (s.geodePrizeQuantities[data.itemIdWon] == 1) {
                            s.geodePrizeTokenIds[idx] = s.geodePrizeTokenIds[s.geodePrizeTokenIds.length - 1];
                            s.geodePrizeTokenIds.pop();
                        }
                        s.geodePrizeQuantities[data.itemIdWon] -= 1;
                        data.numWins++;

                        forgeTokenFacet().safeTransferFrom(address(this), sender, data.itemIdWon, 1, "");
                        forgeFacet().burn(address(this), info.geodeTokenIds[i], 1);

                        emit GeodeWin(sender, data.itemIdWon, info.geodeTokenIds[i], requestId, block.number);
                    } else {
                        forgeFacet().burn(address(this), info.geodeTokenIds[i], 1);
                        emit GeodeEmpty(sender, info.geodeTokenIds[i], requestId, block.number);
                    }

                } else {
                    forgeTokenFacet().safeTransferFrom(address(this), sender, info.geodeTokenIds[i], 1, "");
                    emit GeodeRefunded(sender, info.geodeTokenIds[i], requestId, block.number);
                }

                data.divNum = data.modNum;
                data.modNum *= 10000;
            }
        }
        info.status = VrfStatus.CLAIMED;
        s.userVrfPending[info.user] = false;
    }

    ///@notice Allow the diamond owner or DAO to change the vrf details
    //@param _newFee New VRF fee (in LINK)
    //@param _keyHash New keyhash
    //@param _vrfCoordinator The new vrf coordinator address
    //@param _link New LINK token contract address
    function changeVrf(uint256 _newFee, bytes32 _keyHash, address _vrfCoordinator, address _link) external onlyDaoOrOwner {
        if (_newFee != 0) {
            s.vrfFee = uint96(_newFee);
        }
        if (_keyHash != 0) {
            s.keyHash = _keyHash;
        }
        if (_vrfCoordinator != address(0)) {
            s.vrfCoordinator = _vrfCoordinator;
        }
        if (_link != address(0)) {
            s.link = ILink(_link);
        }
    }

    // Remove the LINK tokens from this contract that are used to pay for VRF random number fees
    function removeLinkTokens(address _to, uint256 _value) external onlyDaoOrOwner {
        s.link.transfer(_to, _value);
    }
}
