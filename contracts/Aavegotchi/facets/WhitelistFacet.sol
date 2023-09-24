// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {Modifiers, Whitelist} from "../libraries/LibAppStorage.sol";
import {LibWhitelist} from "../libraries/LibWhitelist.sol";

contract WhitelistFacet is Modifiers {
    event WhitelistCreated(uint32 indexed whitelistId);
    event WhitelistUpdated(uint32 indexed whitelistId);
    event WhitelistOwnershipTransferred(uint32 indexed whitelistId, address indexed newOwner);

    ///@notice Allow a user to create a new whitelist
    ///@dev Will fail if no addresses are passed in
    ///@dev Will fail if the name is blank
    ///@param _name The name of the whitelist
    ///@param _whitelistAddresses An array of addresses to add to the whitelist
    function createWhitelist(string calldata _name, address[] calldata _whitelistAddresses) external {
        require(_whitelistAddresses.length > 0, "WhitelistFacet: Whitelist length should be larger than zero");
        require(bytes(_name).length > 0, "WhitelistFacet: Whitelist name cannot be blank");

        uint32 whitelistId = LibWhitelist.getNewWhitelistId();
        address[] memory addresses;
        Whitelist memory whitelist = Whitelist({owner: LibMeta.msgSender(), name: _name, addresses: addresses});

        s.whitelists.push(whitelist);

        LibWhitelist._addAddressesToWhitelist(whitelistId, _whitelistAddresses);

        emit WhitelistCreated(whitelistId);
    }

    ///@notice Allow a user to update an existing whitelist
    ///@dev Will fail if whitelist is non-existent
    ///@dev Will fail if caller is not the owner of the whitelist
    ///@dev Will fail if no addresses are passed in
    ///@param _whitelistId The id of the whitelist to update
    ///@param _whitelistAddresses An array of addresses to add to the whitelist
    function updateWhitelist(uint32 _whitelistId, address[] calldata _whitelistAddresses) external {
        require(_whitelistAddresses.length > 0, "WhitelistFacet: Whitelist length should be larger than zero");
        require(LibWhitelist._whitelistExists(_whitelistId), "WhitelistFacet: Whitelist not found");
        require(LibWhitelist.checkWhitelistOwner(_whitelistId), "WhitelistFacet: Not whitelist owner");

        LibWhitelist._addAddressesToWhitelist(_whitelistId, _whitelistAddresses);

        emit WhitelistUpdated(_whitelistId);
    }

    ///@notice Allow a user to remove an address from an existing whitelist
    ///@dev Will fail if caller is not the owner of the whitelist
    ///@dev Will fail if whitelist is non-existent
    ///@dev Will fail if no addresses are passed in
    ///@param _whitelistId The id of the whitelist to update
    ///@param _whitelistAddresses An array of addresses to remove from the whitelist
    function removeAddressesFromWhitelist(uint32 _whitelistId, address[] calldata _whitelistAddresses) external {
        require(_whitelistAddresses.length > 0, "WhitelistFacet: Whitelist length should be larger than zero");
        require(LibWhitelist._whitelistExists(_whitelistId), "WhitelistFacet: Whitelist not found");
        require(LibWhitelist.checkWhitelistOwner(_whitelistId), "WhitelistFacet: Not whitelist owner");

        LibWhitelist._removeAddressesFromWhitelist(_whitelistId, _whitelistAddresses);

        emit WhitelistUpdated(_whitelistId);
    }

    ///@notice Allow the owner of an existing whitelist to transfer the ownership to another address
    ///@dev Will fail if caller is not the owner of the whitelist
    ///@dev Will fail if whitelist is non-existent
    ///@param _whitelistId The id of the whitelist whose ownership is being transferred
    ///@param _whitelistOwner The address to transfer ownership to
    function transferOwnershipOfWhitelist(uint32 _whitelistId, address _whitelistOwner) external {
        require(LibWhitelist._whitelistExists(_whitelistId), "WhitelistFacet: Whitelist not found");
        require(LibWhitelist.checkWhitelistOwner(_whitelistId), "WhitelistFacet: Not whitelist owner");

        Whitelist storage whitelist = LibWhitelist.getWhitelistFromWhitelistId(_whitelistId);

        whitelist.owner = _whitelistOwner;

        emit WhitelistOwnershipTransferred(_whitelistId, _whitelistOwner);
    }

    ///@notice Allow the owner of an existing whitelist to set the access rights and action rights for an existing whitelist
    ///@dev Will fail if caller is not the owner of the whitelist
    ///@dev Will fail if whitelist is non-existent
    ///@param _whitelistId The id of the whitelist whose access and actions rights are being set
    ///@param _actionRight The action right to set
    ///@param _accessRight The access right to set
    function setWhitelistAccessRight(uint32 _whitelistId, uint256 _actionRight, uint256 _accessRight) external {
        require(LibWhitelist._whitelistExists(_whitelistId), "WhitelistFacet: Whitelist not found");
        require(LibWhitelist.checkWhitelistOwner(_whitelistId), "WhitelistFacet: Not whitelist owner");

        LibWhitelist.setWhitelistAccessRight(_whitelistId, _actionRight, _accessRight);
    }

    ///@notice Query the access rights and action rights for an existing whitelist given the action right
    ///@param _whitelistId The id of the whitelist whose access rights are being queried
    ///@param _actionRight The action, whose access right is being queried
    ///@return The access right for the action rights
    function getWhitelistAccessRight(uint32 _whitelistId, uint256 _actionRight) external view returns (uint256) {
        return s.whitelistAccessRights[_whitelistId][_actionRight];
    }

    ///@notice Query the borrow limit for an existing whitelist
    ///@param _whitelistId The id of the whitelist whose borrow limit is being queried
    ///@return The borrow limit for the whitelist
    function getBorrowLimit(uint32 _whitelistId) external view returns (uint256) {
        return s.whitelistAccessRights[_whitelistId][0];
    }

    ///@notice Allow the owner of an existing whitelist to set the borrow limit for an existing whitelist
    ///@dev Will fail if caller is not the owner of the whitelist
    ///@dev Will fail if whitelist is non-existent
    ///@param _whitelistId The id of the whitelist whose borrow limit is being set
    ///@param _borrowlimit The borrow limit to set
    function setBorrowLimit(uint32 _whitelistId, uint256 _borrowlimit) external {
        require(LibWhitelist._whitelistExists(_whitelistId), "WhitelistFacet: Whitelist not found");
        require(LibWhitelist.checkWhitelistOwner(_whitelistId), "WhitelistFacet: Not whitelist owner");

        LibWhitelist.setWhitelistAccessRight(_whitelistId, 0, _borrowlimit);
    }

    /// @notice Check if a whitelist exists
    /// @param whitelistId The id of the whitelist to check
    /// @return exists True if whitelist exists, false if not
    function whitelistExists(uint32 whitelistId) external view returns (bool exists) {
        exists = LibWhitelist._whitelistExists(whitelistId);
    }

    /// @notice Check if an address is whitelisted for an action by a whitelist
    /// @param _whitelistId The id of the whitelist
    /// @param _whitelistAddress The address to check
    /// @return True if the address is whitelisted for the action
    function isWhitelisted(uint32 _whitelistId, address _whitelistAddress) external view returns (uint256) {
        return s.isWhitelisted[_whitelistId][_whitelistAddress];
    }

    ///@notice Query the total number of whitelists created
    ///@return The total number of whitelists created
    function getWhitelistsLength() external view returns (uint256) {
        return s.whitelists.length;
    }

    ///@notice Query the details about a whitelist given the whitelist id
    ///@dev Will throw if whitelist is non-existent
    ///@param _whitelistId The id of the whitelist to query
    ///@return The details of the whitelist
    function getWhitelist(uint32 _whitelistId) external view returns (Whitelist memory) {
        require(LibWhitelist._whitelistExists(_whitelistId), "WhitelistFacet: Whitelist not found");
        return LibWhitelist.getWhitelistFromWhitelistId(_whitelistId);
    }

    ///@notice Query the owner of a whitelist given the whitelist id
    ///@dev Will throw if whitelist is non-existent
    ///@param _whitelistId The id of the whitelist to query
    ///@return The owner of the whitelist
    function whitelistOwner(uint32 _whitelistId) external view returns (address) {
        require(LibWhitelist._whitelistExists(_whitelistId), "WhitelistFacet: Whitelist not found");
        return LibWhitelist.getWhitelistFromWhitelistId(_whitelistId).owner;
    }
}
