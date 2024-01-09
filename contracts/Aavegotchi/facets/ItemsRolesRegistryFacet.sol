// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {IERC1155} from "../../shared/interfaces/IERC1155.sol";
import {IERC165} from "../../shared/interfaces/IERC165.sol";
import {IERC7589} from "../../shared/interfaces/IERC7589.sol";

import {LibItems} from "../libraries/LibItems.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibERC1155Marketplace} from "../libraries/LibERC1155Marketplace.sol";

import {Modifiers, ItemType, EQUIPPED_WEARABLE_SLOTS, GotchiEquippedCommitmentsInfo, Aavegotchi, ItemRolesInfo} from "../libraries/LibAppStorage.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {ERC1155Holder, ERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IEventHandlerFacet} from "../WearableDiamond/interfaces/IEventHandlerFacet.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract ItemsRolesRegistryFacet is Modifiers, IERC7589, ERC1155Holder {
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
        uint256 _commitmentId,
        bytes32 _role,
        address _grantee
    ) {
        require(_grantee != address(0) && _grantee == s.itemRolesCommitmentInfo[_commitmentId].roleAssignment.grantee, "ItemsRolesRegistryFacet: grantee mismatch");
        _;
    }

    /** External Functions **/

    function commitTokens(
        address _grantor,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _tokenAmount
    ) external override onlyWearables(_tokenAddress, _tokenId) onlyOwnerOrApproved(_grantor, _tokenAddress) returns (uint256 commitmentId_) {
        require(_tokenAmount > 0, "ItemsRolesRegistryFacet: tokenAmount must be greater than zero");
        commitmentId_ = _createCommitment(_grantor, _tokenAddress, _tokenId, _tokenAmount);
    }

    function grantRole(
        uint256 _commitmentId,
        bytes32 _role,
        address _grantee,
        uint64 _expirationDate,
        bool _revocable,
        bytes calldata _data
    )
        external
        override
        validGrantRoleData(_expirationDate, _role)
        onlyOwnerOrApproved(s.itemRolesCommitmentInfo[_commitmentId].commitment.grantor, s.itemRolesCommitmentInfo[_commitmentId].commitment.tokenAddress)
    {
        _grantOrUpdateRole(_commitmentId, _role, _grantee, _expirationDate, _revocable, _data);
    }

    function revokeRole(uint256 _commitmentId, bytes32 _role, address _grantee) external override sameGrantee(_commitmentId, _role, _grantee) {
        require(_role == UNIQUE_ROLE, "ItemsRolesRegistryFacet: role not supported");
        ItemRolesInfo storage _commitmentInfo = s.itemRolesCommitmentInfo[_commitmentId];
        RoleAssignment storage _roleAssignment = _commitmentInfo.roleAssignment;
        Commitment storage _commitment = _commitmentInfo.commitment;

        address caller = _findCaller(_commitment.grantor, _roleAssignment.grantee, _commitment.tokenAddress);
        if (_roleAssignment.expirationDate > block.timestamp && !_roleAssignment.revocable) {
            // if role is not expired and is not revocable, only the grantee can revoke it
            require(caller == _roleAssignment.grantee, "ItemsRolesRegistryFacet: role is not expired and is not revocable");
        }

        _unequipAllDelegatedWearables(_commitmentId, _commitment.tokenId);

        emit RoleRevoked(_commitmentId, _role, _roleAssignment.grantee);
        delete _commitmentInfo.roleAssignment;
    }

    function releaseTokens(
        uint256 _commitmentId
    ) external override onlyOwnerOrApproved(s.itemRolesCommitmentInfo[_commitmentId].commitment.grantor, s.itemRolesCommitmentInfo[_commitmentId].commitment.tokenAddress) {
        ItemRolesInfo storage _commitmentInfo = s.itemRolesCommitmentInfo[_commitmentId];
        Commitment memory _commitment = _commitmentInfo.commitment;
        require(_commitment.tokenAmount > 0, "ItemsRolesRegistryFacet: commitment does not exist");
        require(
            _commitmentInfo.roleAssignment.expirationDate < block.timestamp || _commitmentInfo.roleAssignment.revocable,
            "ItemsRolesRegistryFacet: token has an active role"
        );

        _unequipAllDelegatedWearables(_commitmentId, _commitment.tokenId); // If the item is equipped in some gotchi, it will be unequipped

        delete _commitmentInfo.commitment;
        delete _commitmentInfo.roleAssignment;

        emit TokensReleased(_commitmentId);
        _transferFrom(address(this), _commitment.grantor, _commitment.tokenAddress, _commitment.tokenId, _commitment.tokenAmount);
    }

    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _isApproved) external override {
        s.itemsRoleApprovals[LibMeta.msgSender()][_tokenAddress][_operator] = _isApproved;
        emit RoleApprovalForAll(_tokenAddress, _operator, _isApproved);
    }

    /** View Functions **/

    function grantorOf(uint256 _commitmentId) override external view returns (address grantor_) {
        grantor_ = s.itemRolesCommitmentInfo[_commitmentId].commitment.grantor;
    }

    function tokenAddressOf(uint256 _commitmentId) override external view returns (address tokenAddress_) {
        tokenAddress_ = s.itemRolesCommitmentInfo[_commitmentId].commitment.tokenAddress;
    }

    function tokenIdOf(uint256 _commitmentId) override external view returns (uint256 tokenId_) {
        tokenId_ = s.itemRolesCommitmentInfo[_commitmentId].commitment.tokenId;
    }

    function tokenAmountOf(uint256 _commitmentId) override external view returns (uint256 tokenAmount_) {
        tokenAmount_ = s.itemRolesCommitmentInfo[_commitmentId].commitment.tokenAmount;
    }

    function roleData(
        uint256 _commitmentId,
        bytes32 _role,
        address _grantee
    ) external view override sameGrantee(_commitmentId, _role, _grantee) returns (bytes memory data_) {
        return s.itemRolesCommitmentInfo[_commitmentId].roleAssignment.data;
    }

    function roleExpirationDate(
        uint256 _commitmentId,
        bytes32 _role,
        address _grantee
    ) external view override sameGrantee(_commitmentId, _role, _grantee) returns (uint64 expirationDate_) {
        return s.itemRolesCommitmentInfo[_commitmentId].roleAssignment.expirationDate;
    }

    function isRoleRevocable(
        uint256 _commitmentId,
        bytes32 _role,
        address _grantee
    ) external view override sameGrantee(_commitmentId, _role, _grantee) returns (bool revocable_) {
        return s.itemRolesCommitmentInfo[_commitmentId].roleAssignment.revocable;
    }

    function isRoleApprovedForAll(address _tokenAddress, address _grantor, address _operator) public view override returns (bool) {
        return s.itemsRoleApprovals[_grantor][_tokenAddress][_operator];
    }

    /** Helper Functions **/

    function _createCommitment(address _grantor, address _tokenAddress, uint256 _tokenId, uint256 _tokenAmount) internal returns (uint256 commitmentId_) {
        commitmentId_ = ++s.itemsCommitmentIdCounter;
        ItemRolesInfo storage _commitmentInfo = s.itemRolesCommitmentInfo[commitmentId_];
        _commitmentInfo.commitment = Commitment(_grantor, _tokenAddress, _tokenId, _tokenAmount);
        _transferFrom(_grantor, address(this), _tokenAddress, _tokenId, _tokenAmount);
        emit TokensCommitted(_grantor, commitmentId_, _tokenAddress, _tokenId, _tokenAmount);
    }

    function _grantOrUpdateRole(
        uint256 _commitmentId,
        bytes32 _role,
        address _grantee,
        uint64 _expirationDate,
        bool _revocable,
        bytes calldata _data
    ) internal {
        s.itemRolesCommitmentInfo[_commitmentId].roleAssignment = RoleAssignment(_grantee, _expirationDate, _revocable, _data);
        emit RoleGranted(_commitmentId, _role, _grantee, _expirationDate, _revocable, _data);
    }

    function _unequipAllDelegatedWearables(uint256 _commitmentId, uint256 _tokenIdToUnequip) internal {
        ItemRolesInfo storage _commitmentInfo = s.itemRolesCommitmentInfo[_commitmentId];
        uint256 _equippedGotchisLength = _commitmentInfo.equippedGotchis.length();

        for(uint256 i = _equippedGotchisLength; i > 0;) {
            i--;
            uint256 _gotchiId = _commitmentInfo.equippedGotchis.at(i);
            _unequipDelegatedWearable(_gotchiId, _tokenIdToUnequip, _commitmentId);
            _commitmentInfo.equippedGotchis.remove(_gotchiId);
        }

        delete _commitmentInfo.balanceUsed;
    }

    function _unequipDelegatedWearable(uint256 _gotchiId, uint256 _tokenIdToUnequip, uint256 _commitmentId) internal {
        GotchiEquippedCommitmentsInfo storage _gotchiInfo = s.gotchiEquippedItemsInfo[_gotchiId];
        Aavegotchi storage _aavegotchi = s.aavegotchis[_gotchiId];
        uint256 _unequippedBalance;
        for (uint256 slot; slot < EQUIPPED_WEARABLE_SLOTS; slot++) {
            if (_aavegotchi.equippedWearables[slot] != _tokenIdToUnequip || _gotchiInfo.equippedCommitmentIds[slot] != _commitmentId) continue;

            delete _aavegotchi.equippedWearables[slot];
            delete _gotchiInfo.equippedCommitmentIds[slot];
            _unequippedBalance++;
        }

        if (_unequippedBalance == 0) return;
        LibItems.removeFromParent(address(this), _gotchiId, _tokenIdToUnequip, _unequippedBalance);
        emit LibERC1155.TransferFromParent(address(this), _gotchiId, _tokenIdToUnequip, _unequippedBalance);
        _gotchiInfo.equippedCommitmentIdsCount -= _unequippedBalance;
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
