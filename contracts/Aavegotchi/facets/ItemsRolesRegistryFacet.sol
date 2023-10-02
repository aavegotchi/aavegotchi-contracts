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
            isRoleApprovedForAll(_tokenAddress, _account, sender),
            "ItemsRolesRegistryFacet: sender must be token owner or approved"
        );
        _;
    }

    modifier validExpirationDate(uint64 _expirationDate) {
        require(_expirationDate > block.timestamp, "ItemsRolesRegistryFacet: expiration date must be in the future");
        _;
    }

    /** External Functions **/

    function grantRoleFrom(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _value,
        address _grantor,
        address _grantee,
        uint64 _expirationDate,
        bool _revocable,
        bytes calldata _data
    )
        external
        override
        returns (uint256 roleId_)
    {
        GrantedRole memory grantRoleData = GrantedRole(
            _role,
            _tokenAddress,
            _tokenId,
            _value,
            _grantor,
            _grantee,
            _expirationDate,
            _revocable,
            _data
        );
        roleId_ = _grantRole(grantRoleData);
    }

    function revokeRoleFrom(
        uint256 _roleId
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

    /** View Functions **/

    function hasRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee
    ) external view override returns (bool) {
        return s.itemsRoleAssignments[_grantor][_grantee][_tokenAddress][_tokenId][_role].expirationDate > block.timestamp;
    }

    function hasUniqueRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee
    ) external view override returns (bool) {
        return
            s.itemsLatestGrantees[_grantor][_tokenAddress][_tokenId][_role] == _grantee &&
            s.itemsRoleAssignments[_grantor][_grantee][_tokenAddress][_tokenId][_role].expirationDate > block.timestamp;
    }

    function roleData(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee
    ) external view override returns (bytes memory data_) {
        RoleData memory _roleData = s.itemsRoleAssignments[_grantor][_grantee][_tokenAddress][_tokenId][_role];
        return (_roleData.data);
    }

    function roleExpirationDate(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee
    ) external view override returns (uint64 expirationDate_) {
        RoleData memory _roleData = s.itemsRoleAssignments[_grantor][_grantee][_tokenAddress][_tokenId][_role];
        return (_roleData.expirationDate);
    }

    function isRoleApprovedForAll(
        address _tokenAddress,
        address _grantor,
        address _operator
    ) public view override returns (bool) {
        return s.itemsTokenApprovals[_grantor][_tokenAddress][_operator];
    }

    /** Internal Functions **/

    function _grantRole(GrantedRole memory _grantRoleData) internal
        validExpirationDate(_grantRoleData.expirationDate)
        onlyWearables(_grantRoleData.tokenAddress, _grantRoleData.tokenId)
        onlyTokenOwner(_grantRoleData.tokenAddress, _grantRoleData.tokenId, _grantRoleData.grantor)
        onlyOwnerOrApproved(_grantRoleData.tokenAddress, _grantRoleData.tokenId, _grantRoleData.grantor)
        returns (uint256 roleId_)
    {
        _depositWearable(_grantRoleData.tokenAddress, _grantRoleData.tokenId, _grantRoleData.grantor);
        roleId_ = _storeRole(_grantRoleData);
    }

    function _storeRole(
        GrantedRole memory _grantRoleData
    ) internal returns (uint256 roleId_) {
//        address _lastGrantee = s.itemsLatestGrantees[_grantor][_tokenAddress][_tokenId][_role];
//        RoleData memory _roleData = s.itemsRoleAssignments[_grantor][_lastGrantee][_tokenAddress][_tokenId][_role];
//        bool _hasActiveAssignment = _roleData.expirationDate > block.timestamp;
//        if (_hasActiveAssignment) {
//            // only unique roles can be revocable
//            require(_roleData.revocable, "RolesRegistry: role is not revocable");
//        }

        // need to index both by the parameters and the roleId
        // roleId => RoleData
        roleId_ = s.itemsRoleIds++;
        s.grantedRoles[roleId_] = _grantRoleData;

//        s.itemsRoleAssignments[_grantor][_grantee][_tokenAddress][_tokenId][_role] = RoleData(_expirationDate, _revocable, _data);
//        s.itemsLatestGrantees[_grantor][_tokenAddress][_tokenId][_role] = _grantee;
//        emit RoleGranted(_role, _tokenAddress, _tokenId, _grantor, _grantee, _expirationDate, _revocable, _data);
    }

    function _depositWearable(address _tokenAddress, uint256 _tokenId, address _grantor) internal {
        LibItems.removeFromOwner(_grantor, _tokenId, 1);
        LibItems.addToOwner(address(this), _tokenId, 1);
        s.userWithdrawableBalances[_grantor][_tokenAddress][_tokenId] += 1;
        IEventHandlerFacet(_tokenAddress).emitTransferSingleEvent(LibMeta.msgSender(), _grantor, address(this), _tokenId, 1);
        LibERC1155Marketplace.updateERC1155Listing(address(this), _tokenId, _grantor);
    }

}
