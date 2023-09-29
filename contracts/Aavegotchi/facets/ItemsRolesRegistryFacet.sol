// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {IERC7432} from "../interfaces/IERC7432.sol";
import {IERC721} from "../../shared/interfaces/IERC721.sol";

import {LibItems} from "../libraries/LibItems.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibERC1155Marketplace} from "../libraries/LibERC1155Marketplace.sol";

import {Modifiers, ItemType} from "../libraries/LibAppStorage.sol";

import "../WearableDiamond/interfaces/IEventHandlerFacet.sol";

// TODO missing ERC-165 supportsInterface for ERC-7432
contract ItemsRolesRegistryFacet is Modifiers, IERC7432 {

    /** Modifiers **/

    modifier validExpirationDate(uint64 _expirationDate) {
        require(_expirationDate > block.timestamp, "ItemsRolesRegistryFacet: expiration date must be in the future");
        _;
    }

    modifier onlyOwnerOrApproved(
        address _tokenAddress,
        uint256 _tokenId,
        address _account
    ) {
        require(
            msg.sender == IERC721(_tokenAddress).ownerOf(_tokenId) ||
            _isRoleApproved(_tokenAddress, _tokenId, _account, msg.sender),
            "ItemsRolesRegistryFacet: sender must be token owner or approved"
        );
        _;
    }

    /** External Functions **/

    function grantRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantee,
        uint64 _expirationDate,
        bool _revocable,
        bytes calldata _data
    ) external override {
        // TODO
        revert("Not implemented");
    }

    function revokeRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantee
    ) external override {
        // TODO
        revert("Not implemented");
    }

    function grantRoleFrom(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee,
        uint64 _expirationDate,
        bool _revocable,
        bytes calldata _data
    )
        external
        override
        // onlyOwnerOrApproved(_tokenAddress, _tokenId, _grantor)
    {
        // TODO checks for ownership and approval
        require(_tokenAddress == s.wearableDiamond, "ItemsRolesRegistryFacet: Only Wearables are supported in this registry");
        ItemType storage itemType = s.itemTypes[_tokenId];
        require(itemType.category == LibItems.ITEM_CATEGORY_WEARABLE, "ItemsRolesRegistryFacet: Only Wearables are supported");

        address sender = LibMeta.msgSender();
        uint256 balToTransfer = 1;
        LibItems.removeFromOwner(_grantor, _tokenId, balToTransfer);
        LibItems.addToOwner(address(this), _tokenId, balToTransfer);
        IEventHandlerFacet(_tokenAddress).emitTransferSingleEvent(sender, _grantor, address(this), _tokenId, balToTransfer);
        LibERC1155Marketplace.updateERC1155Listing(address(this), _tokenId, _grantor);
    }

    function revokeRoleFrom(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _revoker,
        address _grantee
    ) external override {
        // TODO
        revert("Not implemented");
    }

    function setRoleApprovalForAll(
        address _tokenAddress,
        address _operator,
        bool _approved
    ) external override {
        s.itemsTokenApprovals[msg.sender][_tokenAddress][_operator] = _approved;
        emit IERC7432.RoleApprovalForAll(_tokenAddress, _operator, _approved);
    }

    function approveRole(
        address _tokenAddress,
        uint256 _tokenId,
        address _operator,
        bool _approved
    ) external override {
        s.itemsTokenIdApprovals[msg.sender][_tokenAddress][_tokenId][_operator] = _approved;
        emit IERC7432.RoleApproval(_tokenAddress, _tokenId, _operator, _approved);
    }

    /** View Functions **/

    function hasRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor, // not used, but needed for compatibility with ERC7432
        address _grantee
    ) external view override returns (bool) {
        return s.itemsRoleAssignments[_grantee][_tokenAddress][_tokenId][_role].expirationDate > block.timestamp;
    }

    function hasUniqueRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor, // not used, but needed for compatibility with ERC7432
        address _grantee
    ) external view override returns (bool) {
        return
            s.itemsLatestGrantees[_tokenAddress][_tokenId][_role] == _grantee &&
            s.itemsRoleAssignments[_grantee][_tokenAddress][_tokenId][_role].expirationDate > block.timestamp;
    }

    function roleData(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor, // not used, but needed for compatibility with ERC7432
        address _grantee
    ) external view override returns (bytes memory data_) {
        RoleData memory _roleData = s.itemsRoleAssignments[_grantee][_tokenAddress][_tokenId][_role];
        return (_roleData.data);
    }

    function roleExpirationDate(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor, // not used, but needed for compatibility with ERC7432
        address _grantee
    ) external view override returns (uint64 expirationDate_) {
        RoleData memory _roleData = s.itemsRoleAssignments[_grantee][_tokenAddress][_tokenId][_role];
        return (_roleData.expirationDate);
    }

    function isRoleApprovedForAll(
        address _tokenAddress,
        address _grantor,
        address _operator
    ) public view override returns (bool) {
        return s.itemsTokenApprovals[_grantor][_tokenAddress][_operator];
    }

    function getApprovedRole(
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _operator
    ) public view override returns (bool) {
        return s.itemsTokenIdApprovals[_grantor][_tokenAddress][_tokenId][_operator];
    }

    /** Internal Functions **/

    function _isRoleApproved(
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _operator
    ) internal view returns (bool) {
        return
            isRoleApprovedForAll(_tokenAddress, _grantor, _operator) ||
            getApprovedRole(_tokenAddress, _tokenId, _grantor, _operator);
    }

}
