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

    /**
     * @notice Checks if the token is a wearable.
     * @dev It reverts if the token is not a wearable.
     * @param _tokenAddress The token address.
     * @param _tokenId The token identifier.
     */
    modifier onlyWearables(address _tokenAddress, uint256 _tokenId) {
        require(_tokenAddress == s.wearableDiamond, "ItemsRolesRegistryFacet: Only Item NFTs are supported");
        require(
            s.itemTypes[_tokenId].category == LibItems.ITEM_CATEGORY_WEARABLE,
            "ItemsRolesRegistryFacet: Only Items of type Wearable are supported"
        );
        _;
    }

    /**
     * @notice Checks if the data is valid.
     * @dev Expiration date must be greater than the current block timestamp and less than the current block timestamp plus the maximum expiration date.
     * @param _expirationDate The expiration date of the role.
     * @param _role The role identifier.
     */
    modifier validGrantRoleData(uint64 _expirationDate, bytes32 _role) {
        require(
            _expirationDate > block.timestamp && _expirationDate <= block.timestamp + MAX_EXPIRATION_DATE,
            "ItemsRolesRegistryFacet: invalid expiration date"
        );
        require(_role == UNIQUE_ROLE, "ItemsRolesRegistryFacet: role not supported");
        _;
    }

    /**
     * @notice Checks if the sender is the owner or approved for all.
     * @dev It reverts if the sender is not the owner or approved for all.
     * @param _account The account to check.
     * @param _tokenAddress The token address.
     */
    modifier onlyOwnerOrApproved(address _account, address _tokenAddress) {
        address _sender = LibMeta.msgSender();
        require(
            _account == _sender || isRoleApprovedForAll(_tokenAddress, _account, _sender),
            "ItemsRolesRegistryFacet: account not approved"
        );
        _;
    }

    /**
     * @notice Checks if the grantee is the same as the one in the commitment.
     * @dev It reverts if the grantee is not the same.
     * @param _commitmentId The commitment identifier.
     * @param _role The role identifier.
     * @param _grantee The recipient the role.
     */
    modifier sameGrantee(
        uint256 _commitmentId,
        bytes32 _role,
        address _grantee
    ) {
        require(_grantee != address(0) && _grantee == s.itemRolesCommitmentInfo[_commitmentId].roleAssignment.grantee, "ItemsRolesRegistryFacet: grantee mismatch");
        _;
    }

    /** External Functions **/

    /// @notice Commits tokens (deposits on a contract or freezes balance).
    /// @param _grantor The owner of the SFTs.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    /// @param _tokenAmount The token amount.
    /// @return commitmentId_ The unique identifier of the commitment created.
    function commitTokens(
        address _grantor,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _tokenAmount
    ) external override onlyWearables(_tokenAddress, _tokenId) onlyOwnerOrApproved(_grantor, _tokenAddress) returns (uint256 commitmentId_) {
        require(_tokenAmount > 0, "ItemsRolesRegistryFacet: tokenAmount must be greater than zero");
        commitmentId_ = _createCommitment(_grantor, _tokenAddress, _tokenId, _tokenAmount);
    }

    /// @notice Grants a role to `_grantee`.
    /// @param _commitmentId The identifier of the commitment.
    /// @param _role The role identifier.
    /// @param _grantee The recipient the role.
    /// @param _expirationDate The expiration date of the role.
    /// @param _revocable Whether the role is revocable or not.
    /// @param _data Any additional data about the role.
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

    /// @notice Revokes a role.
    /// @param _commitmentId The commitment identifier.
    /// @param _role The role identifier.
    /// @param _grantee The recipient of the role revocation.
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

    /// @notice Releases tokens back to grantor.
    /// @param _commitmentId The commitment identifier.
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

    /// @notice Approves operator to grant and revoke roles on behalf of another user.
    /// @param _tokenAddress The token address.
    /// @param _operator The user approved to grant and revoke roles.
    /// @param _isApproved The approval status.
    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _isApproved) external override {
        s.itemsRoleApprovals[LibMeta.msgSender()][_tokenAddress][_operator] = _isApproved;
        emit RoleApprovalForAll(_tokenAddress, _operator, _isApproved);
    }

    /** View Functions **/

    /// @notice Returns the owner of the commitment (grantor).
    /// @param _commitmentId The commitment identifier.
    /// @return grantor_ The commitment owner.
    function grantorOf(uint256 _commitmentId) override external view returns (address grantor_) {
        grantor_ = s.itemRolesCommitmentInfo[_commitmentId].commitment.grantor;
    }

    /// @notice Returns the address of the token committed.
    /// @param _commitmentId The commitment identifier.
    /// @return tokenAddress_ The token address.
    function tokenAddressOf(uint256 _commitmentId) override external view returns (address tokenAddress_) {
        tokenAddress_ = s.itemRolesCommitmentInfo[_commitmentId].commitment.tokenAddress;
    }

    /// @notice Returns the identifier of the token committed.
    /// @param _commitmentId The commitment identifier.
    /// @return tokenId_ The token identifier.
    function tokenIdOf(uint256 _commitmentId) override external view returns (uint256 tokenId_) {
        tokenId_ = s.itemRolesCommitmentInfo[_commitmentId].commitment.tokenId;
    }

    /// @notice Returns the amount of tokens committed.
    /// @param _commitmentId The commitment identifier.
    /// @return tokenAmount_ The token amount.
    function tokenAmountOf(uint256 _commitmentId) override external view returns (uint256 tokenAmount_) {
        tokenAmount_ = s.itemRolesCommitmentInfo[_commitmentId].commitment.tokenAmount;
    }

    /// @notice Returns the custom data of a role assignment.
    /// @param _commitmentId The commitment identifier.
    /// @param _role The role identifier.
    /// @param _grantee The recipient the role.
    /// @return data_ The custom data.
    function roleData(
        uint256 _commitmentId,
        bytes32 _role,
        address _grantee
    ) external view override sameGrantee(_commitmentId, _role, _grantee) returns (bytes memory data_) {
        return s.itemRolesCommitmentInfo[_commitmentId].roleAssignment.data;
    }

    /// @notice Returns the expiration date of a role assignment.
    /// @param _commitmentId The commitment identifier.
    /// @param _role The role identifier.
    /// @param _grantee The recipient the role.
    /// @return expirationDate_ The expiration date.
    function roleExpirationDate(
        uint256 _commitmentId,
        bytes32 _role,
        address _grantee
    ) external view override sameGrantee(_commitmentId, _role, _grantee) returns (uint64 expirationDate_) {
        return s.itemRolesCommitmentInfo[_commitmentId].roleAssignment.expirationDate;
    }

    /// @notice Returns the expiration date of a role assignment.
    /// @param _commitmentId The commitment identifier.
    /// @param _role The role identifier.
    /// @param _grantee The recipient the role.
    /// @return revocable_ Whether the role is revocable or not.
    function isRoleRevocable(
        uint256 _commitmentId,
        bytes32 _role,
        address _grantee
    ) external view override sameGrantee(_commitmentId, _role, _grantee) returns (bool revocable_) {
        return s.itemRolesCommitmentInfo[_commitmentId].roleAssignment.revocable;
    }

    /// @notice Checks if the grantor approved the operator for all SFTs.
    /// @param _tokenAddress The token address.
    /// @param _grantor The user that approved the operator.
    /// @param _operator The user that can grant and revoke roles.
    /// @return isApproved_ Whether the operator is approved or not.
    function isRoleApprovedForAll(address _tokenAddress, address _grantor, address _operator) public view override returns (bool) {
        return s.itemsRoleApprovals[_grantor][_tokenAddress][_operator];
    }

    /** Helper Functions **/

    /**
     * @notice Creates a commitment.
     * @dev The commitment is created by transferring the tokens to this contract.
     * @param _grantor The owner of the SFTs.
     * @param _tokenAddress The token address.
     * @param _tokenId The token identifier.
     * @param _tokenAmount The token amount.
     */
    function _createCommitment(address _grantor, address _tokenAddress, uint256 _tokenId, uint256 _tokenAmount) internal returns (uint256 commitmentId_) {
        commitmentId_ = ++s.itemsCommitmentIdCounter;
        ItemRolesInfo storage _commitmentInfo = s.itemRolesCommitmentInfo[commitmentId_];
        _commitmentInfo.commitment = Commitment(_grantor, _tokenAddress, _tokenId, _tokenAmount);
        _transferFrom(_grantor, address(this), _tokenAddress, _tokenId, _tokenAmount);
        emit TokensCommitted(_grantor, commitmentId_, _tokenAddress, _tokenId, _tokenAmount);
    }

    /**
     * @notice Grants or updates a role.
     * @dev If the role is already granted and it's revocable, the previous one will be revoked.
     * @param _commitmentId The commitment identifier.
     * @param _role The role identifier.
     * @param _grantee The recipient the role.
     * @param _expirationDate The expiration date of the role.
     * @param _revocable The revocable status of the role.
     * @param _data The custom data of the role.
     */
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

    /**
     * @notice Unequips all delegated wearables from a commitment from all gotchis.
     * @dev If the commitment is not equipped in any gotchi, it will do nothing.
     * @param _commitmentId The commitment identifier.
     * @param _tokenIdToUnequip The tokenId of the item to unequip.
     */
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

    /**
     * @notice Unequips a delegated wearable from a gotchi.
     * @dev If the commitment is not equipped in the gotchi, it will do nothing.
     * @param _gotchiId The gotchi to unequip the item from
     * @param _tokenIdToUnequip The tokenId of the item to unequip
     * @param _commitmentId The commitment identifier
     */
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

    /**
     * @notice Transfers tokens from one address to another.
     * @dev It emits a TransferSingle event.
     * @param _from The address to transfer from.
     * @param _to The address to transfer to.
     * @param _tokenAddress The token address.
     * @param _tokenId The token identifier.
     * @param _tokenAmount The token amount.
     */
    function _transferFrom(address _from, address _to, address _tokenAddress, uint256 _tokenId, uint256 _tokenAmount) internal {
        LibItems.removeFromOwner(_from, _tokenId, _tokenAmount);
        LibItems.addToOwner(_to, _tokenId, _tokenAmount);
        IEventHandlerFacet(_tokenAddress).emitTransferSingleEvent(LibMeta.msgSender(), _from, _to, _tokenId, _tokenAmount);
        LibERC1155Marketplace.updateERC1155Listing(address(this), _tokenId, _to);
    }

    /**
     * @notice Finds the caller of the function.
     * @dev The caller must be the grantee or the grantor, or the grantee or grantor must have approved the caller.
     * @param _grantor The grantor of the commitment. 
     * @param _grantee The grantee of the commitment.
     * @param _tokenAddress The token address.
     */
    function _findCaller(address _grantor, address _grantee, address _tokenAddress) internal view returns (address) {
        address _sender = LibMeta.msgSender();
        if (_grantee == _sender || isRoleApprovedForAll(_tokenAddress, _grantee, _sender)) {
            return _grantee;
        }

        if (_grantor == _sender || isRoleApprovedForAll(_tokenAddress, _grantor, _sender)) {
            return _grantor;
        }

        revert("ItemsRolesRegistryFacet: sender must be approved");
    }
}
