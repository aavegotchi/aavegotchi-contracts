// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {Modifiers, Whitelist} from "../libraries/LibAppStorage.sol";
import {LibWhitelist} from "../libraries/LibWhitelist.sol";

contract WhitelistFacet is Modifiers {
    event WhitelistCreated(uint32 indexed whitelistId);
    event WhitelistUpdated(uint32 indexed whitelistId);
    event WhitelistOwnershipTransferred(uint32 indexed whitelistId, address indexed newOwner);

    function createWhitelist(string calldata _name, address[] calldata _whitelistAddresses) external {
        require(_whitelistAddresses.length > 0, "WhitelistFacet: Whitelist length should be larger than zero");

        uint32 whitelistId = LibWhitelist.getNewWhitelistId();
        address[] memory addresses;
        Whitelist memory whitelist = Whitelist({owner: LibMeta.msgSender(), name: _name, addresses: addresses});

        s.whitelists.push(whitelist);

        LibWhitelist._addAddressesToWhitelist(whitelistId, _whitelistAddresses);

        emit WhitelistCreated(whitelistId);
    }

    function updateWhitelist(uint32 _whitelistId, address[] calldata _whitelistAddresses) external {
        require(_whitelistAddresses.length > 0, "WhitelistFacet: Whitelist length should be larger than zero");
        require(LibWhitelist._whitelistExists(_whitelistId), "WhitelistFacet: Whitelist not found");
        require(LibWhitelist.checkWhitelistOwner(_whitelistId), "WhitelistFacet: Not whitelist owner");

        LibWhitelist._addAddressesToWhitelist(_whitelistId, _whitelistAddresses);

        emit WhitelistUpdated(_whitelistId);
    }

    function removeAddressesFromWhitelist(uint32 _whitelistId, address[] calldata _whitelistAddresses) external {
        require(_whitelistAddresses.length > 0, "WhitelistFacet: Whitelist length should be larger than zero");
        require(LibWhitelist._whitelistExists(_whitelistId), "WhitelistFacet: Whitelist not found");
        require(LibWhitelist.checkWhitelistOwner(_whitelistId), "WhitelistFacet: Not whitelist owner");

        LibWhitelist._removeAddressesFromWhitelist(_whitelistId, _whitelistAddresses);

        emit WhitelistUpdated(_whitelistId);
    }

    function transferOwnershipOfWhitelist(uint32 _whitelistId, address _whitelistOwner) external {
        require(LibWhitelist._whitelistExists(_whitelistId), "WhitelistFacet: Whitelist not found");
        require(LibWhitelist.checkWhitelistOwner(_whitelistId), "WhitelistFacet: Not whitelist owner");

        Whitelist storage whitelist = LibWhitelist.getWhitelistFromWhitelistId(_whitelistId);

        whitelist.owner = _whitelistOwner;

        emit WhitelistOwnershipTransferred(_whitelistId, _whitelistOwner);
    }

    function getWhitelists() external view returns (Whitelist[] memory) {
        return s.whitelists;
    }

    function whitelistExists(uint32 whitelistId) external view returns (bool exists) {
        exists = LibWhitelist._whitelistExists(whitelistId);
    }

    function isWhitelisted(uint32 _whitelistId, address _whitelistAddress) external view returns (uint256) {
        return s.isWhitelisted[_whitelistId][_whitelistAddress];
    }

    function getWhitelistsLength() external view returns (uint256) {
        return s.whitelists.length;
    }

    function getWhitelist(uint32 _whitelistId) external view returns (Whitelist memory) {
        require(LibWhitelist._whitelistExists(_whitelistId), "WhitelistFacet: Whitelist not found");
        return LibWhitelist.getWhitelistFromWhitelistId(_whitelistId);
    }

    function whitelistOwner(uint32 _whitelistId) external view returns (address) {
        require(LibWhitelist._whitelistExists(_whitelistId), "WhitelistFacet: Whitelist not found");
        return LibWhitelist.getWhitelistFromWhitelistId(_whitelistId).owner;
    }
}
