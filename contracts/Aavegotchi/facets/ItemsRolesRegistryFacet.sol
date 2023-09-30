// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {IERC7432} from "../interfaces/IERC7432.sol";
import {IERC1155} from "../../shared/interfaces/IERC1155.sol";

import {LibItems} from "../libraries/LibItems.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibERC1155Marketplace} from "../libraries/LibERC1155Marketplace.sol";

import {Modifiers, ItemType} from "../libraries/LibAppStorage.sol";

import "../WearableDiamond/interfaces/IEventHandlerFacet.sol";

// TODO missing ERC-165 supportsInterface for ERC-7432
contract ItemsRolesRegistryFacet is Modifiers, IERC7432 {

    /** Modifiers **/

    modifier onlyWearables(address _tokenAddress, uint256 _tokenId) {
        require(_tokenAddress == s.wearableDiamond, "ItemsRolesRegistryFacet: Only Item NFTs are supported");
        require(s.itemTypes[_tokenId].category == LibItems.ITEM_CATEGORY_WEARABLE, "ItemsRolesRegistryFacet: Only Items of type Wearable are supported");
        _;
    }

    modifier onlyTokenOwner(address _tokenAddress, uint256 _tokenId, address _account) {
        require(IERC1155(_tokenAddress).balanceOf(_account, _tokenId) > 0, "RolesRegistry: account must be token owner");
        _;
    }

    modifier onlyOwnerOrApproved(address _tokenAddress, uint256 _tokenId, address _account) {
        address sender = LibMeta.msgSender();
        require(
             IERC1155(_tokenAddress).balanceOf(sender, _tokenId) > 0 ||
            _isRoleApproved(_tokenAddress, _tokenId, _account, sender),
            "ItemsRolesRegistryFacet: sender must be token owner or approved"
        );
        _;
    }

    modifier validExpirationDate(uint64 _expirationDate) {
        require(_expirationDate > block.timestamp, "ItemsRolesRegistryFacet: expiration date must be in the future");
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
        address sender = LibMeta.msgSender();
        _grantRole(_role, _tokenAddress, _tokenId, sender, _grantee, _expirationDate, _revocable, _data);
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
        onlyOwnerOrApproved(_tokenAddress, _tokenId, _grantor)
    {
        _grantRole(_role, _tokenAddress, _tokenId, _grantor, _grantee, _expirationDate, _revocable, _data);
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

    function _grantRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee,
        uint64 _expirationDate,
        bool _revocable,
        bytes calldata _data
    )
        internal
        validExpirationDate(_expirationDate)
        onlyWearables(_tokenAddress, _tokenId)
        onlyTokenOwner(_tokenAddress, _tokenId, _grantor)
    {
        _depositWearable(_tokenAddress, _tokenId, _grantor);
        _storeRole(_role, _tokenAddress, _tokenId, _grantor, _grantee, _expirationDate, _revocable, _data);
    }

    function _storeRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee,
        uint64 _expirationDate,
        bool _revocable,
        bytes calldata _data
    ) internal {
        address _lastGrantee = s.itemsLatestGrantees[_tokenAddress][_tokenId][_role];
        RoleData memory _roleData = s.itemsRoleAssignments[_lastGrantee][_tokenAddress][_tokenId][_role];
        bool _hasActiveAssignment = _roleData.expirationDate > block.timestamp;
        if (_hasActiveAssignment) {
            // only unique roles can be revocable
            require(_roleData.revocable, "RolesRegistry: role is not revocable");
        }

        s.itemsRoleAssignments[_grantee][_tokenAddress][_tokenId][_role] = RoleData(_expirationDate, _revocable, _data);
        s.itemsLatestGrantees[_tokenAddress][_tokenId][_role] = _grantee;
        emit RoleGranted(_role, _tokenAddress, _tokenId, _grantor, _grantee, _expirationDate, _revocable, _data);
    }

    function _depositWearable(address _tokenAddress, uint256 _tokenId, address _grantor) internal {
        LibItems.removeFromOwner(_grantor, _tokenId, 1);
        LibItems.addToOwner(address(this), _tokenId, 1);
        s.userWithdrawableBalances[_grantor][_tokenAddress][_tokenId] += 1;
        IEventHandlerFacet(_tokenAddress).emitTransferSingleEvent(LibMeta.msgSender(), _grantor, address(this), _tokenId, 1);
        LibERC1155Marketplace.updateERC1155Listing(address(this), _tokenId, _grantor);
    }

}
