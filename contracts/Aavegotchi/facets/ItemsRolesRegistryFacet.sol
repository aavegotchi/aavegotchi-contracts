// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {IERC1155} from "../../shared/interfaces/IERC1155.sol";
import {IERC165} from "../../shared/interfaces/IERC165.sol";
import {ISftRolesRegistry} from "../../shared/interfaces/ISftRolesRegistry.sol";

import {LibItems} from "../libraries/LibItems.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibERC1155Marketplace} from "../libraries/LibERC1155Marketplace.sol";

import {Modifiers, ItemType, EQUIPPED_WEARABLE_SLOTS, EquippedDelegatedItemInfo} from "../libraries/LibAppStorage.sol";
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

    modifier validGrantRoleData(
        uint256 _depositId,
        address _grantee,
        uint64 _expirationDate,
        uint256 _tokenAmount,
        bytes32 _role
    ) {
        require(_depositId > 0, "ItemsRolesRegistryFacet: depositId must be greater than zero");
        require(
            _expirationDate > block.timestamp && _expirationDate <= block.timestamp + MAX_EXPIRATION_DATE,
            "ItemsRolesRegistryFacet: invalid expiration date"
        );
        require(_tokenAmount > 0, "ItemsRolesRegistryFacet: tokenAmount must be greater than zero");
        require(_role == UNIQUE_ROLE, "ItemsRolesRegistryFacet: role not supported");
        require(_grantee != address(0), "ItemsRolesRegistryFacet: grantee must not be zero address");
        _;
    }

    modifier onlyOwnerOrApproved(address _account, address _tokenAddress) {
        require(_account == LibMeta.msgSender() || isRoleApprovedForAll(_tokenAddress, _account, LibMeta.msgSender()), "ItemsRolesRegistryFacet: account not approved");
        _;
    }

    modifier validRoleAndGrantee(
        bytes32 _role,
        address _grantee,
        uint256 _depositId
    ) {
        require(_role == UNIQUE_ROLE, "ItemsRolesRegistryFacet: role not supported");
        require(_grantee == s.itemsRoleAssignments[_depositId].grantee, "ItemsRolesRegistryFacet: grantee mismatch");
        _;
    }

    /** External Functions **/

    function grantRoleFrom(
        RoleAssignment calldata _grantRoleData
    )
        external
        override
        onlyWearables(_grantRoleData.tokenAddress, _grantRoleData.tokenId)
        validGrantRoleData(
            _grantRoleData.nonce,
            _grantRoleData.grantee,
            _grantRoleData.expirationDate,
            _grantRoleData.tokenAmount,
            _grantRoleData.role
        )
        onlyOwnerOrApproved(_grantRoleData.grantor, _grantRoleData.tokenAddress)
    {
        if (s.itemsDeposits[_grantRoleData.nonce].grantor == address(0)) {
            // transfer tokens
            _deposit(_grantRoleData);
        } else {
            // depositId exists
            require(s.itemsDeposits[_grantRoleData.nonce].grantor == _grantRoleData.grantor, "ItemsRolesRegistryFacet: grantor mismatch");
            require(
                s.itemsDeposits[_grantRoleData.nonce].tokenAddress == _grantRoleData.tokenAddress,
                "ItemsRolesRegistryFacet: tokenAddress mismatch"
            );
            require(s.itemsDeposits[_grantRoleData.nonce].tokenId == _grantRoleData.tokenId, "ItemsRolesRegistryFacet: tokenId mismatch");
            require(s.itemsDeposits[_grantRoleData.nonce].tokenAmount == _grantRoleData.tokenAmount, "ItemsRolesRegistryFacet: tokenAmount mismatch");

            RoleData storage _roleData = s.itemsRoleAssignments[_grantRoleData.nonce];
            require(
                _roleData.expirationDate < block.timestamp || _roleData.revocable,
                "ItemsRolesRegistryFacet: depositId is not expired or is not revocable"
            );
        }
        _grantOrUpdateRole(_grantRoleData);
    }

    function revokeRoleFrom(uint256 _depositId, bytes32 _role, address _grantee) external override validRoleAndGrantee(_role, _grantee, _depositId) {
        RoleData memory _roleData = s.itemsRoleAssignments[_depositId];
        DepositInfo memory _depositInfo = s.itemsDeposits[_depositId];

        address caller = _findCaller(_roleData, _depositInfo);
        if (_roleData.expirationDate > block.timestamp && !_roleData.revocable) {
            // if role is not expired and is not revocable, only the grantee can revoke it
            require(caller == _roleData.grantee, "ItemsRolesRegistryFacet: depositId is not expired or is not revocable");
        }

        _unequipAllDelegatedWearables(_depositId, _depositInfo.tokenId);
        
        s.itemsDepositsUnequippedBalance[_depositId] = s.itemsDeposits[_depositId].tokenAmount;
        delete s.itemsRoleAssignments[_depositId];

        emit RoleRevoked(
            _depositId,
            UNIQUE_ROLE,
            _depositInfo.tokenAddress,
            _depositInfo.tokenId,
            _depositInfo.tokenAmount,
            _depositInfo.grantor,
            _roleData.grantee
        );
    }

    function withdraw(uint256 _depositId) external onlyOwnerOrApproved(s.itemsDeposits[_depositId].grantor, s.itemsDeposits[_depositId].tokenAddress) {
        DepositInfo memory _depositInfo = s.itemsDeposits[_depositId];
        require(
            s.itemsRoleAssignments[_depositId].expirationDate < block.timestamp || s.itemsRoleAssignments[_depositId].revocable,
            "ItemsRolesRegistryFacet: token has an active role"
        );
        
        _unequipAllDelegatedWearables(_depositId, _depositInfo.tokenId); // If the item is equipped in some gotchi, it will be unequipped
        
        delete s.itemsDeposits[_depositId];
        delete s.itemsDepositsUnequippedBalance[_depositId];
        delete s.itemsRoleAssignments[_depositId];

        _transferFrom(address(this), _depositInfo.grantor, _depositInfo.tokenAddress, _depositInfo.tokenId, _depositInfo.tokenAmount);

        emit Withdrew(_depositId, _depositInfo.grantor, _depositInfo.tokenAddress, _depositInfo.tokenId, _depositInfo.tokenAmount);
    }

    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _isApproved) external override {
        s.itemsTokenApprovals[LibMeta.msgSender()][_tokenAddress][_operator] = _isApproved;
        emit RoleApprovalForAll(_tokenAddress, _operator, _isApproved);
    }

    /** View Functions **/

    function roleData(
        uint256 _depositId,
        bytes32 _role,
        address _grantee
    ) external view override validRoleAndGrantee(_role, _grantee, _depositId) returns (RoleData memory) {
        return s.itemsRoleAssignments[_depositId];
    }

    function roleExpirationDate(
        uint256 _depositId,
        bytes32 _role,
        address _grantee
    ) external view override validRoleAndGrantee(_role, _grantee, _depositId) returns (uint64 expirationDate_) {
        return s.itemsRoleAssignments[_depositId].expirationDate;
    }

    function isRoleApprovedForAll(address _tokenAddress, address _grantor, address _operator) public view override returns (bool) {
        return s.itemsTokenApprovals[_grantor][_tokenAddress][_operator];
    }

    /** Helper Functions **/

    function _grantOrUpdateRole(RoleAssignment calldata _grantRoleData) internal {
        s.itemsRoleAssignments[_grantRoleData.nonce] = RoleData(
            _grantRoleData.grantee,
            _grantRoleData.expirationDate,
            _grantRoleData.revocable,
            _grantRoleData.data
        );

        emit RoleGranted(
            _grantRoleData.nonce,
            UNIQUE_ROLE,
            _grantRoleData.tokenAddress,
            _grantRoleData.tokenId,
            _grantRoleData.tokenAmount,
            _grantRoleData.grantor,
            _grantRoleData.grantee,
            _grantRoleData.expirationDate,
            _grantRoleData.revocable,
            _grantRoleData.data
        );
    }

    function _unequipAllDelegatedWearables(uint256 _depositId, uint256 _tokenIdToUnequip) internal {
        uint256 _equippedGotchisLength = s.depositIdToEquippedGotchis[_depositId].length();

        for(uint256 i; i < _equippedGotchisLength; i++) {
            uint256 _gotchiId = s.depositIdToEquippedGotchis[_depositId].at(i);
            _unequipDelegatedWearable(_gotchiId, _tokenIdToUnequip);
        }

        delete s.depositIdToEquippedGotchis[_depositId];
    }

    function _unequipDelegatedWearable(uint256 _gotchiId, uint256 _tokenIdToUnequip) internal {
        EquippedDelegatedItemInfo memory _equippedDelegatedItemInfo = s.gotchiIdToEquippedItemIdToDelegationInfo[_gotchiId][_tokenIdToUnequip];
        uint256 _balanceToUnequip = _equippedDelegatedItemInfo.balance;
        if (_balanceToUnequip == 0) return; // If balance is 0, it means the item is not equipped, so we can return

        uint256 _unequippedBalance;
        for (uint256 slot; slot < EQUIPPED_WEARABLE_SLOTS; slot++) {
            if (_unequippedBalance == _balanceToUnequip) break;
            if (s.aavegotchis[_gotchiId].equippedWearables[slot] != _tokenIdToUnequip) continue;
            s.aavegotchis[_gotchiId].equippedWearables[slot] = 0;
            _unequippedBalance++;
        }

        LibItems.removeFromParent(address(this), _gotchiId, _tokenIdToUnequip, _unequippedBalance);
        emit LibERC1155.TransferFromParent(address(this), _gotchiId, _tokenIdToUnequip, _unequippedBalance);
        delete s.gotchiIdToEquippedItemIdToDelegationInfo[_gotchiId][_tokenIdToUnequip];
    }

    function _transferFrom(address _from, address _to, address _tokenAddress, uint256 _tokenId, uint256 _tokenAmount) internal {
        LibItems.removeFromOwner(_from, _tokenId, _tokenAmount);
        LibItems.addToOwner(_to, _tokenId, _tokenAmount);
        IEventHandlerFacet(_tokenAddress).emitTransferSingleEvent(LibMeta.msgSender(), _from, _to, _tokenId, _tokenAmount);
        LibERC1155Marketplace.updateERC1155Listing(address(this), _tokenId, _to);
    }

    function _findCaller(RoleData memory _roleData, DepositInfo memory _depositInfo) internal view returns (address) {
        if (_depositInfo.grantor == LibMeta.msgSender() || isRoleApprovedForAll(_depositInfo.tokenAddress, _depositInfo.grantor, LibMeta.msgSender())) {
            return _depositInfo.grantor;
        }

        if (_roleData.grantee == LibMeta.msgSender() || isRoleApprovedForAll(_depositInfo.tokenAddress, _roleData.grantee, LibMeta.msgSender())) {
            return _roleData.grantee;
        }

        revert("ItemsRolesRegistryFacet: sender must be approved");
    }

    function _deposit(RoleAssignment calldata _grantRoleData) internal {
        s.itemsDeposits[_grantRoleData.nonce] = DepositInfo(
            _grantRoleData.grantor,
            _grantRoleData.tokenAddress,
            _grantRoleData.tokenId,
            _grantRoleData.tokenAmount
        );
        s.itemsDepositsUnequippedBalance[_grantRoleData.nonce] = _grantRoleData.tokenAmount;

        _transferFrom(_grantRoleData.grantor, address(this), _grantRoleData.tokenAddress, _grantRoleData.tokenId, _grantRoleData.tokenAmount);
    }
}
