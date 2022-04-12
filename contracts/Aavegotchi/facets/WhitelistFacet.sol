// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {Modifiers, Whitelist} from "../libraries/LibAppStorage.sol";

contract WhitelistFacet is Modifiers {
    event WhitelistCreated(uint32 indexed whitelistId);
    event WhitelistUpdated(uint32 indexed whitelistId);
    event WhitelistOwnershipTransferred(uint32 indexed whitelistId, address indexed newOwner);

    function createWhitelist(string calldata _name, address[] calldata _whitelistAddresses) external {
        uint256 whitelistLength = _whitelistAddresses.length;
        require(whitelistLength > 0, "WhitelistFacet: Whitelist length should be larger than zero");

        address sender = LibMeta.msgSender();
        uint32 whitelistId = uint32(s.whitelists.length + 1); //whitelistId 0 is reserved for "none" in GotchiLending struct
        address[] memory addresses;
        Whitelist memory whitelist = Whitelist({owner: sender, name: _name, addresses: addresses});
        s.whitelists.push(whitelist);
        _addAddressesToWhitelist(whitelistId, _whitelistAddresses);

        emit WhitelistCreated(whitelistId);
    }

    function updateWhitelist(uint32 _whitelistId, address[] calldata _whitelistAddresses) external {
        address sender = LibMeta.msgSender();

        require((s.whitelists.length >= _whitelistId) && (_whitelistId > 0), "WhitelistFacet: Whitelist not found");
        require(wl(_whitelistId).owner == sender, "WhitelistFacet: Not whitelist owner");

        uint32 whitelistLength = uint32(_whitelistAddresses.length);
        require(whitelistLength > 0, "WhitelistFacet: Whitelist length should be larger than zero");

        _addAddressesToWhitelist(_whitelistId, _whitelistAddresses);

        emit WhitelistUpdated(_whitelistId);
    }

    function removeAddressesFromWhitelist(uint32 _whitelistId, address[] calldata _whitelistAddresses) external {
        address sender = LibMeta.msgSender();

        require((s.whitelists.length >= _whitelistId) && (_whitelistId > 0), "WhitelistFacet: Whitelist not found");
        require(wl(_whitelistId).owner == sender, "WhitelistFacet: Not whitelist owner");

        uint32 whitelistLength = uint32(_whitelistAddresses.length);
        require(whitelistLength > 0, "WhitelistFacet: Whitelist length should be larger than zero");

        _removeAddressesFromWhitelist(_whitelistId, _whitelistAddresses);

        emit WhitelistUpdated(_whitelistId);
    }

    function transferOwnershipOfWhitelist(uint32 _whitelistId, address _whitelistOwner) external {
        address sender = LibMeta.msgSender();

        require((s.whitelists.length >= _whitelistId) && (_whitelistId > 0), "WhitelistFacet: Whitelist not found");
        require(wl(_whitelistId).owner == sender, "WhitelistFacet: Not whitelist owner");

        wl(_whitelistId).owner = _whitelistOwner;

        emit WhitelistOwnershipTransferred(_whitelistId, _whitelistOwner);
    }

    function whitelistOwner(uint32 _whitelistId) external view returns (address) {
        require((s.whitelists.length >= _whitelistId) && (_whitelistId > 0), "WhitelistFacet: Whitelist not found");

        return wl(_whitelistId).owner;
    }

    function isWhitelisted(uint32 _whitelistId, address _whitelistAddress) external view returns (uint256) {
        return s.isWhitelisted[_whitelistId][_whitelistAddress];
    }

    function getWhitelist(uint32 _whitelistId) external view returns (Whitelist memory) {
        require((uint32(s.whitelists.length) >= _whitelistId) && (_whitelistId > 0), "WhitelistFacet: Whitelist not found");
        return wl(_whitelistId);
    }

    function getWhitelists() external view returns (Whitelist[] memory) {
        return s.whitelists;
    }

    function getWhitelistsLength() external view returns (uint256) {
        return s.whitelists.length;
    }

    function _addAddressesToWhitelist(uint32 _whitelistId, address[] calldata _whitelistAddresses) internal {
        for (uint256 i; i < _whitelistAddresses.length; i++) {
            _addAddressToWhitelist(_whitelistId, _whitelistAddresses[i]);
        }
    }

    function _addAddressToWhitelist(uint32 _whitelistId, address _whitelistAddress) internal {
        if (s.isWhitelisted[_whitelistId][_whitelistAddress] == 0) {
            wl(_whitelistId).addresses.push(_whitelistAddress);
            s.isWhitelisted[_whitelistId][_whitelistAddress] = wl(_whitelistId).addresses.length; // Index of the whitelist entry + 1
        }
    }

    function _removeAddressesFromWhitelist(uint32 _whitelistId, address[] calldata _whitelistAddresses) internal {
        for (uint256 i; i < _whitelistAddresses.length; i++) {
            _removeAddressFromWhitelist(_whitelistId, _whitelistAddresses[i]);
        }
    }

    function _removeAddressFromWhitelist(uint32 _whitelistId, address _whitelistAddress) internal {
        if (s.isWhitelisted[_whitelistId][_whitelistAddress] > 0) {
            uint256 index = s.isWhitelisted[_whitelistId][_whitelistAddress] - 1;
            uint256 lastIndex = wl(_whitelistId).addresses.length - 1;
            // Replaces the element to be removed with the last element
            wl(_whitelistId).addresses[index] = wl(_whitelistId).addresses[lastIndex];
            // Store the last element in memory
            address lastElement = wl(_whitelistId).addresses[lastIndex];
            // Remove the last element from storage
            wl(_whitelistId).addresses.pop();
            // Update the index of the last element that was swapped. If this is the only element, updates to zero on the next line
            s.isWhitelisted[_whitelistId][lastElement] = index + 1;
            // Update the index of the removed element
            s.isWhitelisted[_whitelistId][_whitelistAddress] = 0;
        }
    }

    function wl(uint32 _whitelistId) internal view returns (Whitelist storage) {
        return s.whitelists[_whitelistId - 1];
    }
}
