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
        uint256 _nonce,
        address _grantee,
        uint64 _expirationDate,
        uint256 _tokenAmount,
        bytes32 _role
    ) {
        require(_nonce > 0, "ItemsRolesRegistryFacet: nonce must be greater than zero");
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
        address _grantor,
        address _grantee,
        uint256 _nonce
    ) {
        require(_role == UNIQUE_ROLE, "ItemsRolesRegistryFacet: role not supported");
        require(_grantee == s.itemsRoleAssignments[_grantor][_nonce].grantee, "ItemsRolesRegistryFacet: grantee mismatch");
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
        if (s.itemsDeposits[_grantRoleData.grantor][_grantRoleData.nonce].tokenAmount == 0) {
            // transfer tokens
            _deposit(_grantRoleData);
        } else {
            // nonce exists
            require(
                s.itemsDeposits[_grantRoleData.grantor][_grantRoleData.nonce].tokenAddress == _grantRoleData.tokenAddress,
                "ItemsRolesRegistryFacet: tokenAddress mismatch"
            );
            require(s.itemsDeposits[_grantRoleData.grantor][_grantRoleData.nonce].tokenId == _grantRoleData.tokenId, "ItemsRolesRegistryFacet: tokenId mismatch");
            require(s.itemsDeposits[_grantRoleData.grantor][_grantRoleData.nonce].tokenAmount == _grantRoleData.tokenAmount, "ItemsRolesRegistryFacet: tokenAmount mismatch");

            RoleData storage _roleData = s.itemsRoleAssignments[_grantRoleData.grantor][_grantRoleData.nonce];
            require(
                _roleData.expirationDate < block.timestamp || _roleData.revocable,
                "ItemsRolesRegistryFacet: nonce is not expired or is not revocable"
            );
        }
        _grantOrUpdateRole(_grantRoleData);
    }

    function revokeRoleFrom(bytes32 _role, uint256 _nonce, address _grantor, address _grantee) external override validRoleAndGrantee(_role, _grantor, _grantee, _nonce) {
        RoleData memory _roleData = s.itemsRoleAssignments[_grantor][_nonce];
        DepositInfo memory _depositInfo = s.itemsDeposits[_grantor][_nonce];

        address caller = _findCaller(_grantor, _roleData.grantee, _depositInfo.tokenAddress);
        if (_roleData.expirationDate > block.timestamp && !_roleData.revocable) {
            // if role is not expired and is not revocable, only the grantee can revoke it
            require(caller == _roleData.grantee, "ItemsRolesRegistryFacet: nonce is not expired or is not revocable");
        }

        _unequipAllDelegatedWearables(_nonce, _grantor, _depositInfo.tokenId);
        
        s.itemsDepositsUnequippedBalance[_grantor][_nonce] = s.itemsDeposits[_grantor][_nonce].tokenAmount;
        delete s.itemsRoleAssignments[_grantor][_nonce];

        emit RoleRevoked(
            _nonce,
            UNIQUE_ROLE,
            _depositInfo.tokenAddress,
            _depositInfo.tokenId,
            _depositInfo.tokenAmount,
            _grantor,
            _roleData.grantee
        );
    }

    function withdrawFrom(uint256 _nonce, address _grantor) override external onlyOwnerOrApproved(_grantor, s.itemsDeposits[_grantor][_nonce].tokenAddress) {
        DepositInfo memory _depositInfo = s.itemsDeposits[_grantor][_nonce];
        require(_depositInfo.tokenAmount > 0, "ItemsRolesRegistryFacet: nonce does not exist");
        require(
            s.itemsRoleAssignments[_grantor][_nonce].expirationDate < block.timestamp || s.itemsRoleAssignments[_grantor][_nonce].revocable,
            "ItemsRolesRegistryFacet: token has an active role"
        );
        
        _unequipAllDelegatedWearables(_nonce, _grantor, _depositInfo.tokenId); // If the item is equipped in some gotchi, it will be unequipped
        
        delete s.itemsDeposits[_grantor][_nonce];
        delete s.itemsDepositsUnequippedBalance[_grantor][_nonce];
        delete s.itemsRoleAssignments[_grantor][_nonce];

        _transferFrom(address(this), _grantor, _depositInfo.tokenAddress, _depositInfo.tokenId, _depositInfo.tokenAmount);

        emit Withdrew(_nonce, _grantor, _depositInfo.tokenAddress, _depositInfo.tokenId, _depositInfo.tokenAmount);
    }

    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _isApproved) external override {
        s.itemsTokenApprovals[LibMeta.msgSender()][_tokenAddress][_operator] = _isApproved;
        emit RoleApprovalForAll(_tokenAddress, _operator, _isApproved);
    }

    /** View Functions **/

    function roleData(
        bytes32 _role,
        uint256 _nonce,
        address _grantor,
        address _grantee
    ) external view override validRoleAndGrantee(_role, _grantor, _grantee, _nonce) returns (RoleData memory) {
        return s.itemsRoleAssignments[_grantor][_nonce];
    }

    function roleExpirationDate(
        bytes32 _role,

        uint256 _nonce,
        address _grantor,
        address _grantee
    ) external view override validRoleAndGrantee(_role, _grantor, _grantee, _nonce) returns (uint64 expirationDate_) {
        return s.itemsRoleAssignments[_grantor][_nonce].expirationDate;
    }

    function isRoleApprovedForAll(address _tokenAddress, address _grantor, address _operator) public view override returns (bool) {
        return s.itemsTokenApprovals[_grantor][_tokenAddress][_operator];
    }

    /** Helper Functions **/

    function _grantOrUpdateRole(RoleAssignment calldata _grantRoleData) internal {
        s.itemsRoleAssignments[_grantRoleData.grantor][_grantRoleData.nonce] = RoleData(
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

    function _unequipAllDelegatedWearables(uint256 _nonce, address _grantor, uint256 _tokenIdToUnequip) internal {
        uint256 _equippedGotchisLength = s.depositIdToEquippedGotchis[_grantor][_nonce].length();

        for(uint256 i; i < _equippedGotchisLength; i++) {
            uint256 _gotchiId = s.depositIdToEquippedGotchis[_grantor][_nonce].at(i);
            _unequipDelegatedWearable(_gotchiId, _tokenIdToUnequip);
        }

        delete s.depositIdToEquippedGotchis[_grantor][_nonce];
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

    function _deposit(RoleAssignment calldata _grantRoleData) internal {
        s.itemsDeposits[_grantRoleData.grantor][_grantRoleData.nonce] = DepositInfo(
            _grantRoleData.tokenAddress,
            _grantRoleData.tokenId,
            _grantRoleData.tokenAmount
        );
        s.itemsDepositsUnequippedBalance[_grantRoleData.grantor][_grantRoleData.nonce] = _grantRoleData.tokenAmount;

        _transferFrom(_grantRoleData.grantor, address(this), _grantRoleData.tokenAddress, _grantRoleData.tokenId, _grantRoleData.tokenAmount);
    }
}
