// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibAppStorage, AppStorage, Whitelist} from "../libraries/LibAppStorage.sol";

library LibWhitelist {
    function getNewWhitelistId() internal view returns (uint32 whitelistId) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        whitelistId = uint32(s.whitelists.length + 1); //whitelistId 0 is reserved for "none" in GotchiLending struct
    }

    function whitelistExists(uint32 whitelistId) internal view returns (bool exists) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        exists = (s.whitelists.length >= whitelistId) && (whitelistId > 0);
    }

    function getWhitelistFromWhitelistId(uint32 whitelistId) internal view returns (Whitelist storage whitelist) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        require(whitelistExists(whitelistId), "WhitelistFacet: Whitelist not found");
        whitelist = s.whitelists[whitelistId - 1];
    }

    function checkWhitelistOwner(uint32 whitelistId) internal view returns (bool isOwner) {
        Whitelist storage whitelist = getWhitelistFromWhitelistId(whitelistId);
        isOwner = whitelist.owner == LibMeta.msgSender();
    }
}
