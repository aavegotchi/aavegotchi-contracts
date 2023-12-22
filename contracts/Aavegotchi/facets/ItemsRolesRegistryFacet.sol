// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {IERC1155} from "../../shared/interfaces/IERC1155.sol";
import {IERC165} from "../../shared/interfaces/IERC165.sol";
import {ISftRolesRegistry} from "../../shared/interfaces/ISftRolesRegistry.sol";

import {LibItems} from "../libraries/LibItems.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibERC1155Marketplace} from "../libraries/LibERC1155Marketplace.sol";

import {Modifiers, ItemType, EQUIPPED_WEARABLE_SLOTS, GotchiEquippedRecordsInfo, Aavegotchi, ItemRolesInfo} from "../libraries/LibAppStorage.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {ERC1155Holder, ERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IEventHandlerFacet} from "../WearableDiamond/interfaces/IEventHandlerFacet.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract ItemsRolesRegistryFacet is Modifiers, ISftRolesRegistry, ERC1155Holder {
    using EnumerableSet for EnumerableSet.UintSet;
    bytes32 public constant UNIQUE_ROLE = keccak256("Player()");

    uint256 public constant MAX_EXPIRATION_DATE = 90 days;

    /** Modifiers **/

    modifier onlyWearables(address _tokenAddress, uint256 _tokenId) {
        require(_tokenAddress == s.wearableDiamond, "ItemsRolesRegistryFacet: Only Item NFTs are supported");
        require(
            s.itemTypes[_tokenId].category == LibItems.ITEM_CATEGORY_WEARABLE,
            "ItemsRolesRegistryFacet: Only Items of type Wearable are supported"
        );
        _;
    }

    modifier validGrantRoleData(uint64 _expirationDate, bytes32 _role) {
        require(
            _expirationDate > block.timestamp && _expirationDate <= block.timestamp + MAX_EXPIRATION_DATE,
            "ItemsRolesRegistryFacet: invalid expiration date"
        );
        require(_role == UNIQUE_ROLE, "ItemsRolesRegistryFacet: role not supported");
        _;
    }

    modifier onlyOwnerOrApproved(address _account, address _tokenAddress) {
        address _sender = LibMeta.msgSender();
        require(
            _account == _sender || isRoleApprovedForAll(_tokenAddress, _account, _sender),
            "ItemsRolesRegistryFacet: account not approved"
        );
        _;
    }

    modifier sameGrantee(
        uint256 _recordId,
        bytes32 _role,
        address _grantee
    ) {
        require(_grantee != address(0) && _grantee == s.itemRolesRecordInfo[_recordId].roleAssignment.grantee, "ItemsRolesRegistryFacet: grantee mismatch");
        _;
    }

    /** External Functions **/

    function createRecordFrom(
        address _grantor,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _tokenAmount
    ) external override onlyWearables(_tokenAddress, _tokenId) onlyOwnerOrApproved(_grantor, _tokenAddress) returns (uint256 recordId_) {
        require(_tokenAmount > 0, "ItemsRolesRegistryFacet: tokenAmount must be greater than zero");
        recordId_ = _createRecord(_grantor, _tokenAddress, _tokenId, _tokenAmount);
    }

    function grantRole(
        uint256 _recordId,
        bytes32 _role,
        address _grantee,
        uint64 _expirationDate,
        bool _revocable,
        bytes calldata _data
    )
        external
        override
        validGrantRoleData(_expirationDate, _role)
        onlyOwnerOrApproved(s.itemRolesRecordInfo[_recordId].record.grantor, s.itemRolesRecordInfo[_recordId].record.tokenAddress)
    {
        _grantOrUpdateRole(_recordId, _role, _grantee, _expirationDate, _revocable, _data);
    }

    function revokeRoleFrom(uint256 _recordId, bytes32 _role, address _grantee) external override sameGrantee(_recordId, _role, _grantee) {
        require(_role == UNIQUE_ROLE, "ItemsRolesRegistryFacet: role not supported");
        ItemRolesInfo storage _recordInfo = s.itemRolesRecordInfo[_recordId];
        RoleAssignment storage _roleAssignment = _recordInfo.roleAssignment;
        Record storage _record = _recordInfo.record;

        address caller = _findCaller(_record.grantor, _roleAssignment.grantee, _record.tokenAddress);
        if (_roleAssignment.expirationDate > block.timestamp && !_roleAssignment.revocable) {
            // if role is not expired and is not revocable, only the grantee can revoke it
            require(caller == _roleAssignment.grantee, "ItemsRolesRegistryFacet: role is not expired and is not revocable");
        }

        _unequipAllDelegatedWearables(_recordId, _record.tokenId);

        emit RoleRevoked(_recordId, _role, _roleAssignment.grantee);
        delete _recordInfo.roleAssignment;
    }

    function withdrawFrom(
        uint256 _recordId
    ) external override onlyOwnerOrApproved(s.itemRolesRecordInfo[_recordId].record.grantor, s.itemRolesRecordInfo[_recordId].record.tokenAddress) {
        ItemRolesInfo storage _recordInfo = s.itemRolesRecordInfo[_recordId];
        Record memory _record = _recordInfo.record;
        require(_record.tokenAmount > 0, "ItemsRolesRegistryFacet: record does not exist");
        require(
            _recordInfo.roleAssignment.expirationDate < block.timestamp || _recordInfo.roleAssignment.revocable,
            "ItemsRolesRegistryFacet: token has an active role"
        );

        _unequipAllDelegatedWearables(_recordId, _record.tokenId); // If the item is equipped in some gotchi, it will be unequipped

        delete _recordInfo.record;
        delete _recordInfo.roleAssignment;

        emit Withdrew(_recordId);
        _transferFrom(address(this), _record.grantor, _record.tokenAddress, _record.tokenId, _record.tokenAmount);
    }

    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _isApproved) external override {
        s.itemsRoleApprovals[LibMeta.msgSender()][_tokenAddress][_operator] = _isApproved;
        emit RoleApprovalForAll(_tokenAddress, _operator, _isApproved);
    }

    /** View Functions **/

    function roleData(
        uint256 _recordId,
        bytes32 _role,
        address _grantee
    ) external view override sameGrantee(_recordId, _role, _grantee) returns (bytes memory data_) {
        return s.itemRolesRecordInfo[_recordId].roleAssignment.data;
    }

    function roleExpirationDate(
        uint256 _recordId,
        bytes32 _role,
        address _grantee
    ) external view override sameGrantee(_recordId, _role, _grantee) returns (uint64 expirationDate_) {
        return s.itemRolesRecordInfo[_recordId].roleAssignment.expirationDate;
    }

    function isRoleRevocable(
        uint256 _recordId,
        bytes32 _role,
        address _grantee
    ) external view override sameGrantee(_recordId, _role, _grantee) returns (bool revocable_) {
        return s.itemRolesRecordInfo[_recordId].roleAssignment.revocable;
    }

    function isRoleApprovedForAll(address _tokenAddress, address _grantor, address _operator) public view override returns (bool) {
        return s.itemsRoleApprovals[_grantor][_tokenAddress][_operator];
    }

    /** Helper Functions **/

    function _createRecord(address _grantor, address _tokenAddress, uint256 _tokenId, uint256 _tokenAmount) internal returns (uint256 recordId_) {
        recordId_ = ++s.itemsRecordIdCounter;
        ItemRolesInfo storage _recordInfo = s.itemRolesRecordInfo[recordId_];
        _recordInfo.record = Record(_grantor, _tokenAddress, _tokenId, _tokenAmount);
        _transferFrom(_grantor, address(this), _tokenAddress, _tokenId, _tokenAmount);
        emit RecordCreated(_grantor, recordId_, _tokenAddress, _tokenId, _tokenAmount);
    }

    function _grantOrUpdateRole(
        uint256 _recordId,
        bytes32 _role,
        address _grantee,
        uint64 _expirationDate,
        bool _revocable,
        bytes calldata _data
    ) internal {
        s.itemRolesRecordInfo[_recordId].roleAssignment = RoleAssignment(_grantee, _expirationDate, _revocable, _data);
        emit RoleGranted(_recordId, _role, _grantee, _expirationDate, _revocable, _data);
    }

    function _unequipAllDelegatedWearables(uint256 _recordId, uint256 _tokenIdToUnequip) internal {
        ItemRolesInfo storage _recordInfo = s.itemRolesRecordInfo[_recordId];
        uint256 _equippedGotchisLength = _recordInfo.equippedGotchis.length();

        for(uint256 i = _equippedGotchisLength; i > 0;) {
            i--;
            uint256 _gotchiId = _recordInfo.equippedGotchis.at(i);
            _unequipDelegatedWearable(_gotchiId, _tokenIdToUnequip, _recordId);
            _recordInfo.equippedGotchis.remove(_gotchiId);
        }

        delete _recordInfo.balanceUsed;
    }

    function _unequipDelegatedWearable(uint256 _gotchiId, uint256 _tokenIdToUnequip, uint256 _recordId) internal {
        GotchiEquippedRecordsInfo storage _gotchiInfo = s.gotchiEquippedItemsInfo[_gotchiId];
        Aavegotchi storage _aavegotchi = s.aavegotchis[_gotchiId];
        uint256 _unequippedBalance;
        for (uint256 slot; slot < EQUIPPED_WEARABLE_SLOTS; slot++) {
            if (_aavegotchi.equippedWearables[slot] != _tokenIdToUnequip || _gotchiInfo.equippedRecordIds[slot] != _recordId) continue;

            delete _aavegotchi.equippedWearables[slot];
            delete _gotchiInfo.equippedRecordIds[slot];
            _unequippedBalance++;
        }

        if (_unequippedBalance == 0) return;
        LibItems.removeFromParent(address(this), _gotchiId, _tokenIdToUnequip, _unequippedBalance);
        emit LibERC1155.TransferFromParent(address(this), _gotchiId, _tokenIdToUnequip, _unequippedBalance);
        _gotchiInfo.equippedRecordIdsCount -= _unequippedBalance;
    }

    function _transferFrom(address _from, address _to, address _tokenAddress, uint256 _tokenId, uint256 _tokenAmount) internal {
        LibItems.removeFromOwner(_from, _tokenId, _tokenAmount);
        LibItems.addToOwner(_to, _tokenId, _tokenAmount);
        IEventHandlerFacet(_tokenAddress).emitTransferSingleEvent(LibMeta.msgSender(), _from, _to, _tokenId, _tokenAmount);
        LibERC1155Marketplace.updateERC1155Listing(address(this), _tokenId, _to);
    }

    function _findCaller(address _grantor, address _grantee, address _tokenAddress) internal view returns (address) {
        address _sender = LibMeta.msgSender();
        if (_grantor == _sender || isRoleApprovedForAll(_tokenAddress, _grantor, _sender)) {
            return _grantor;
        }

        if (_grantee == _sender || isRoleApprovedForAll(_tokenAddress, _grantee, _sender)) {
            return _grantee;
        }

        revert("ItemsRolesRegistryFacet: sender must be approved");
    }
}
