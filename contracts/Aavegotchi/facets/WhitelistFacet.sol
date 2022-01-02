// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {Modifiers} from "../libraries/LibAppStorage.sol";

contract WhitelistFacet is Modifiers {
    event WhitelistCreated(uint256 indexed whitelistId, address indexed owner, address[] addresses);

    event WhitelistUpdated(uint256 indexed whitelistId, address indexed owner, address[] addresses);

    function createWhitelist(address[] calldata _whitelistAddresses) external {
        uint256 whitelistLength = _whitelistAddresses.length;
        require(whitelistLength > 0, "WhitelistFacet: Whitelist length should be larger than zero");

        address sender = LibMeta.msgSender();
        s.nextWhitelistId++;
        uint256 whitelistId = s.nextWhitelistId;

        _addAddressesToWhitelist(whitelistId, _whitelistAddresses);

        s.whitelistOwners[whitelistId] = sender;
        s.ownerWhitelistIds[sender].push(whitelistId);

        emit WhitelistCreated(whitelistId, sender, s.whitelists[whitelistId]);
    }

    function updateWhitelist(uint256 _whitelistId, address[] calldata _whitelistAddresses) external {
        address sender = LibMeta.msgSender();
        uint256 currentWhitelistLength = s.whitelists[_whitelistId].length;
        require(currentWhitelistLength != 0, "WhitelistFacet: whitelist not found");
        require(s.whitelistOwners[_whitelistId] == sender, "WhitelistFacet: not whitelist owner");

        uint256 whitelistLength = _whitelistAddresses.length;
        require(whitelistLength > 0, "WhitelistFacet: Whitelist length should be larger than zero");

        _addAddressesToWhitelist(_whitelistId, _whitelistAddresses);

        emit WhitelistUpdated(_whitelistId, sender, _whitelistAddresses);
    }

    function _addAddressesToWhitelist(uint256 _whitelistId, address[] calldata _whitelistAddresses) internal {
        for (uint256 i; i < _whitelistAddresses.length; i++) {
            if (!s.isWhitelisted[_whitelistId][_whitelistAddresses[i]]) {
                s.whitelists[_whitelistId].push(_whitelistAddresses[i]);
                s.isWhitelisted[_whitelistId][_whitelistAddresses[i]] = true;
            }
        }
    }
}
