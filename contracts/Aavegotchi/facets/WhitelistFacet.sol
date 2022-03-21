// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {Modifiers, Whitelist} from "../libraries/LibAppStorage.sol";

contract WhitelistFacet is Modifiers {
    event WhitelistCreated(uint256 indexed whitelistId);
    event WhitelistUpdated(uint256 indexed whitelistId);

    function createWhitelist(string calldata _name, address[] calldata _whitelistAddresses) external {
        uint256 whitelistLength = _whitelistAddresses.length;
        require(whitelistLength > 0, "WhitelistFacet: Whitelist length should be larger than zero");

        address sender = LibMeta.msgSender();
        uint256 whitelistId = s.whitelists.length + 1;
        address[] memory addresses;
        Whitelist memory whitelist = Whitelist({owner: sender, name: _name, addresses: addresses});
        s.whitelists.push(whitelist);
        _addAddressesToWhitelist(whitelistId, _whitelistAddresses);

        emit WhitelistCreated(whitelistId);
    }

    function updateWhitelist(uint256 _whitelistId, address[] calldata _whitelistAddresses) external {
        address sender = LibMeta.msgSender();

        require((s.whitelists.length >= _whitelistId) && (_whitelistId > 0), "WhitelistFacet: Whitelist not found");
        require(s.whitelists[_whitelistId - 1].owner == sender, "WhitelistFacet: Not whitelist owner");

        uint256 whitelistLength = _whitelistAddresses.length;
        require(whitelistLength > 0, "WhitelistFacet: Whitelist length should be larger than zero");

        _addAddressesToWhitelist(_whitelistId, _whitelistAddresses);

        emit WhitelistUpdated(_whitelistId);
    }

    function getWhitelist(uint256 _whitelistId) external view returns (Whitelist memory) {
        require((s.whitelists.length >= _whitelistId) && (_whitelistId > 0), "WhitelistFacet: Whitelist not found");
        return s.whitelists[_whitelistId - 1];
    }

    function getWhitelists() external view returns (Whitelist[] memory) {
        return s.whitelists;
    }

    function _addAddressesToWhitelist(uint256 _whitelistId, address[] calldata _whitelistAddresses) internal {
        for (uint256 i; i < _whitelistAddresses.length; i++) {
            if (!s.isWhitelisted[_whitelistId][_whitelistAddresses[i]]) {
                s.whitelists[_whitelistId - 1].addresses.push(_whitelistAddresses[i]);
                s.isWhitelisted[_whitelistId][_whitelistAddresses[i]] = true;
            }
        }
    }
}
