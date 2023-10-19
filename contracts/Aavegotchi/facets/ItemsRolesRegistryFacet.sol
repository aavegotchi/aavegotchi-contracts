// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {IERC7432} from "../../shared/interfaces/IERC7432.sol";
import {IERC1155} from "../../shared/interfaces/IERC1155.sol";

import {LibItems} from "../libraries/LibItems.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibERC1155Marketplace} from "../libraries/LibERC1155Marketplace.sol";

import {Modifiers, ItemType, AssignmentRecord} from "../libraries/LibAppStorage.sol";

import "../WearableDiamond/interfaces/IEventHandlerFacet.sol";

contract ItemsRolesRegistryFacet is Modifiers, IERC7432 {
    /** Modifiers **/

    modifier onlyWearables(address _tokenAddress, uint256 _tokenId) {
        require(_tokenAddress == s.wearableDiamond, "ItemsRolesRegistryFacet: Only Item NFTs are supported");
        require(
            s.itemTypes[_tokenId].category == LibItems.ITEM_CATEGORY_WEARABLE,
            "ItemsRolesRegistryFacet: Only Items of type Wearable are supported"
        );
        _;
    }

    modifier onlyTokenOwner(
        address _tokenAddress,
        uint256 _tokenId,
        address _account
    ) {
        require(IERC1155(_tokenAddress).balanceOf(_account, _tokenId) > 0, "RolesRegistry: account must be token owner");
        _;
    }

    modifier onlyOwnerOrApproved(
        address _tokenAddress,
        uint256 _tokenId,
        address _account
    ) {
        address sender = LibMeta.msgSender();
        require(
            IERC1155(_tokenAddress).balanceOf(sender, _tokenId) > 0 || isRoleApprovedForAll(_tokenAddress, _account, sender),
            "ItemsRolesRegistryFacet: sender must be token owner or approved"
        );
        _;
    }

    modifier validExpirationDate(uint64 _expirationDate) {
        require(_expirationDate > block.timestamp, "ItemsRolesRegistryFacet: expiration date must be in the future");
        _;
    }

    /** External Functions **/

    function grantRevocableRoleFrom(
        RoleAssignment calldata _roleAssignment
    ) external override onlyOwnerOrApproved(_roleAssignment.tokenAddress, _roleAssignment.tokenId, _roleAssignment.grantor) {
        _grantRole(_roleAssignment, true);
    }

    function grantRoleFrom(
        RoleAssignment calldata _roleAssignment
    ) external override onlyOwnerOrApproved(_roleAssignment.tokenAddress, _roleAssignment.tokenId, _roleAssignment.grantor) {
        _grantRole(_roleAssignment, false);
    }

    function revokeRoleFrom(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _revoker,
        address _grantee
    ) external override onlyTokenOwner(_tokenAddress, _tokenId, _revoker) {
        address _caller = msg.sender == _revoker || msg.sender == _grantee ? msg.sender : _getApprovedCaller(_tokenAddress, _revoker, _grantee);
        _revokeRole(_role, _tokenAddress, _tokenId, _revoker, _grantee, _caller);
    }

    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _approved) external override {
        s.itemsTokenApprovals[msg.sender][_tokenAddress][_operator] = _approved;
        emit IERC7432.RoleApprovalForAll(_tokenAddress, _operator, _approved);
    }

    /** View Functions **/

    function hasNonUniqueRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee
    ) external view override returns (bool) {
        return s.itemsRoleAssignments[_grantor][_grantee][_tokenAddress][_tokenId][_role].expirationDate > block.timestamp;
    }

    function hasRole(
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
    ) external view override returns (RoleData memory) {
        return s.itemsRoleAssignments[_grantor][_grantee][_tokenAddress][_tokenId][_role];
    }

    function roleExpirationDate(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee
    ) external view override returns (uint64 expirationDate_) {
        return s.itemsRoleAssignments[_grantor][_grantee][_tokenAddress][_tokenId][_role].expirationDate;
    }

    function isRoleApprovedForAll(address _tokenAddress, address _grantor, address _operator) public view override returns (bool) {
        return s.itemsTokenApprovals[_grantor][_tokenAddress][_operator];
    }

    function lastGrantee(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor // not used, but needed for compatibility with ERC7432
    ) public view override returns (address) {
        return s.itemsLatestGrantees[_grantor][_tokenAddress][_tokenId][_role];
    }

    function supportsInterface(bytes4 interfaceId) external view virtual override returns (bool) {
        return interfaceId == type(IERC7432).interfaceId;
    }

    function withdrawableBalanceOf(address _account, uint256 _tokenId) public view returns (uint256 _balance) {
        uint256[] memory recordIds = s.userRecordIds[_tokenId][_account];
        _balance = s.userWithdrawableBalances[_account][s.wearableDiamond][_tokenId];
        for (uint256 i = 0; i < recordIds.length; i++) {
            if (block.timestamp <= s.assignmentRecords[recordIds[i]].expirationDate) {
                _balance -= s.assignmentRecords[recordIds[i]].amount;
            }
        }
    }

    function withdrawWearable(uint256 _tokenId, uint256 _amount) public {
        require(withdrawableBalanceOf(msg.sender, _tokenId) >= _amount, "ItemsRolesRegistryFacet: no withdrawable balance");
        _deductBalanceAndRemoveAssignmentRecords(_tokenId, msg.sender, _amount);
        LibItems.removeFromOwner(address(this), _tokenId, _amount);
        LibItems.addToOwner(msg.sender, _tokenId, _amount);
        IEventHandlerFacet(s.wearableDiamond).emitTransferSingleEvent(address(this), msg.sender, msg.sender, _tokenId, _amount);
        LibERC1155Marketplace.updateERC1155Listing(address(this), _tokenId, msg.sender);
    }

    function _deductBalanceAndRemoveAssignmentRecords(uint256 _tokenId, address _account, uint256 _amount) internal {
        uint256[] memory recordIds = s.userRecordIds[_tokenId][_account];
        uint256 _withdrew = 0;

        for (uint256 i; i < recordIds.length; i++) {
            // Failsafe: Should never happen since all role record has amount 1
            require(_withdrew <= _amount, "ItemsRolesRegistryFacet: withdrew more than requested");

            if (_withdrew == _amount) {
                break;
            }

            if (block.timestamp <= s.assignmentRecords[recordIds[i]].expirationDate) {
                _withdrew += s.assignmentRecords[recordIds[i]].amount;
                _removeAssignmentRecord(recordIds[i]);
            }
        }
        // Update withdrawable balance
        s.userWithdrawableBalances[_account][s.wearableDiamond][_tokenId] -= _amount;
    }

    /** Internal Functions **/

    function _revokeRole(bytes32 _role, address _tokenAddress, uint256 _tokenId, address _revoker, address _grantee, address _caller) internal {
        require(
            _caller == _grantee || s.itemsRoleAssignments[_revoker][_grantee][_tokenAddress][_tokenId][_role].revocable,
            "ItemsRolesRegistryFacet: Role is not revocable or caller is not the grantee"
        );
        delete s.itemsRoleAssignments[_revoker][_grantee][_tokenAddress][_tokenId][_role];
        delete s.itemsLatestGrantees[_revoker][_tokenAddress][_tokenId][_role];
        emit RoleRevoked(_role, _tokenAddress, _tokenId, _revoker, _grantee);
    }

    function _getApprovedCaller(address _tokenAddress, address _revoker, address _grantee) internal view returns (address) {
        if (isRoleApprovedForAll(_tokenAddress, _grantee, msg.sender)) {
            return _grantee;
        } else if (isRoleApprovedForAll(_tokenAddress, _revoker, msg.sender)) {
            return _revoker;
        } else {
            revert("ItemsRolesRegistryFacet: sender must be approved");
        }
    }

    function _grantRole(
        RoleAssignment calldata _roleAssignment,
        bool _revocable
    )
        internal
        validExpirationDate(_roleAssignment.expirationDate)
        onlyWearables(_roleAssignment.tokenAddress, _roleAssignment.tokenId)
        onlyTokenOwner(_roleAssignment.tokenAddress, _roleAssignment.tokenId, _roleAssignment.grantor)
        onlyOwnerOrApproved(_roleAssignment.tokenAddress, _roleAssignment.tokenId, _roleAssignment.grantor)
    {
        _depositWearable(_roleAssignment.tokenAddress, _roleAssignment.tokenId, _roleAssignment.grantor);
        _storeRole(_roleAssignment, _revocable);
    }

    function _storeRole(RoleAssignment memory _roleAssignment, bool _revocable) internal {
        address _lastGrantee = s.itemsLatestGrantees[_roleAssignment.grantor][_roleAssignment.tokenAddress][_roleAssignment.tokenId][
            _roleAssignment.role
        ];
        RoleData memory _roleData = s.itemsRoleAssignments[_roleAssignment.grantor][_lastGrantee][_roleAssignment.tokenAddress][
            _roleAssignment.tokenId
        ][_roleAssignment.role];

        bool _hasActiveAssignment = _roleData.expirationDate > block.timestamp;
        if (_hasActiveAssignment) {
            // only unique roles can be revocable
            require(_roleData.revocable, "ItemsRolesRegistryFacet: role is not revocable");
        }

        s.itemsRoleAssignments[_roleAssignment.grantor][_roleAssignment.grantee][_roleAssignment.tokenAddress][_roleAssignment.tokenId][
            _roleAssignment.role
        ] = RoleData(_roleAssignment.expirationDate, _revocable, _roleAssignment.data);
        s.itemsLatestGrantees[_roleAssignment.grantor][_roleAssignment.tokenAddress][_roleAssignment.tokenId][_roleAssignment.role] = _roleAssignment
            .grantee;

        _addAssignmentRecord(_roleAssignment);

        emit RoleGranted(
            _roleAssignment.role,
            _roleAssignment.tokenAddress,
            _roleAssignment.tokenId,
            _roleAssignment.grantor,
            _roleAssignment.grantee,
            _roleAssignment.expirationDate,
            _revocable,
            _roleAssignment.data
        );
    }

    function _addAssignmentRecord(RoleAssignment memory _roleAssignment) internal {
        s.currentRecordId += 1;
        s.assignmentRecords[s.currentRecordId] = AssignmentRecord(
            _roleAssignment.tokenId,
            _roleAssignment.grantor,
            1,
            _roleAssignment.grantee,
            _roleAssignment.expirationDate
        );
        s.userRecordIds[_roleAssignment.tokenId][_roleAssignment.grantor].push(s.currentRecordId);
    }

    function _removeAssignmentRecord(uint256 _recordId) internal {
        AssignmentRecord memory _record = s.assignmentRecords[_recordId];
        uint256 recordIndex = s.recordIndexes[_recordId];
        uint256 lastRecordIndex = s.userRecordIds[_record.tokenId][_record.grantor].length - 1;

        if (recordIndex != lastRecordIndex) {
            uint256 lastRecordId = s.userRecordIds[_record.tokenId][_record.grantor][lastRecordIndex];
            s.userRecordIds[_record.tokenId][_record.grantor][recordIndex] = lastRecordId;
            s.recordIndexes[lastRecordId] = recordIndex;
        }

        s.userRecordIds[_record.tokenId][_record.grantor].pop();
        delete s.recordIndexes[_recordId];
    }

    function _depositWearable(address _tokenAddress, uint256 _tokenId, address _grantor) internal {
        LibItems.removeFromOwner(_grantor, _tokenId, 1);
        LibItems.addToOwner(address(this), _tokenId, 1);
        s.userWithdrawableBalances[_grantor][_tokenAddress][_tokenId] += 1;
        IEventHandlerFacet(_tokenAddress).emitTransferSingleEvent(LibMeta.msgSender(), _grantor, address(this), _tokenId, 1);
        LibERC1155Marketplace.updateERC1155Listing(address(this), _tokenId, _grantor);
    }
}
