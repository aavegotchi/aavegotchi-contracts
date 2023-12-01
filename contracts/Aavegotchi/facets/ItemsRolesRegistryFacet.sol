// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {IERC1155} from "../../shared/interfaces/IERC1155.sol";
import {IERC165} from "../../shared/interfaces/IERC165.sol";
import {ISftRolesRegistry} from "../../shared/interfaces/ISftRolesRegistry.sol";

import {LibItems} from "../libraries/LibItems.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibERC1155Marketplace} from "../libraries/LibERC1155Marketplace.sol";

import {Modifiers, ItemType} from "../libraries/LibAppStorage.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {ERC1155Holder, ERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IEventHandlerFacet} from "../WearableDiamond/interfaces/IEventHandlerFacet.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";

contract ItemsRolesRegistryFacet is Modifiers, ISftRolesRegistry, ERC1155Holder {
    bytes32 public constant EQUIP_WEARABLE_ROLE = keccak256("EQUIP_WEARABLE_ROLE");

    /** Modifiers **/

    modifier onlyWearables(address _tokenAddress, uint256 _tokenId) {
        require(_tokenAddress == s.wearableDiamond, "ItemsRolesRegistryFacet: Only Item NFTs are supported");
        require(
            s.itemTypes[_tokenId].category == LibItems.ITEM_CATEGORY_WEARABLE,
            "ItemsRolesRegistryFacet: Only Items of type Wearable are supported"
        );
        _;
    }

    modifier validExpirationDate(uint64 _expirationDate) {
        require(_expirationDate > block.timestamp, "ItemsRolesRegistryFacet: expiration date must be in the future");
        _;
    }

    modifier onlyOwnerOrApprovedWithBalance(
        address _account,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _tokenAmount
    ) {
        require(_tokenAmount > 0, "ItemsRolesRegistryFacet: tokenAmount must be greater than zero");
        require(_account == msg.sender || isRoleApprovedForAll(_tokenAddress, _account, msg.sender), "ItemsRolesRegistryFacet: account not approved");
        _;
    }

    /** External Functions **/

    function grantRoleFrom(
        RoleAssignment calldata _grantRoleData
    )
        external
        override
        onlyWearables(_grantRoleData.tokenAddress, _grantRoleData.tokenId)
        validExpirationDate(_grantRoleData.expirationDate)
        onlyOwnerOrApprovedWithBalance(_grantRoleData.grantor, _grantRoleData.tokenAddress, _grantRoleData.tokenId, _grantRoleData.tokenAmount)
    {
        require(_grantRoleData.role != EQUIP_WEARABLE_ROLE, "ItemsRolesRegistryFacet: EQUIP_WEARABLE_ROLE is not supported");
        DepositInfo memory _depositInfo = s.itemsDeposits[_grantRoleData.nonce];
        if (_depositInfo.tokenAmount == 0) {
            _depositInfo = DepositInfo(_grantRoleData.grantor, _grantRoleData.tokenAddress, _grantRoleData.tokenId, _grantRoleData.tokenAmount);
            _deposit(_grantRoleData.nonce, _depositInfo);
        }
        RoleData memory _roleData = RoleData(
            _grantRoleData.role,
            _grantRoleData.grantee,
            _grantRoleData.expirationDate,
            _grantRoleData.revocable,
            _grantRoleData.data
        );
        _grantOrUpdateRole(_grantRoleData.nonce, _depositInfo, _roleData);
    }

    function _grantOrUpdateRole(uint256 _nonce, DepositInfo memory _depositInfo, RoleData memory _roleData) internal {
        // validate if previous role assignment is expired or revocable
        require(_roleData.expirationDate < block.timestamp || _roleData.revocable, "ItemsRolesRegistryFacet: role is not revocable or not expired");

        s.itemsRoleAssignments[_nonce] = _roleData;

        emit RoleGranted(
            _nonce,
            _roleData.role,
            _depositInfo.tokenAddress,
            _depositInfo.tokenId,
            _depositInfo.tokenAmount,
            _depositInfo.grantor,
            _roleData.grantee,
            _roleData.expirationDate,
            _roleData.revocable,
            _roleData.data
        );
    }

    function _deposit(uint256 _nonce, DepositInfo memory _depositInfo) internal {
        require(_depositInfo.tokenAmount > 0, "ItemsRolesRegistryFacet: tokenAmount must be greater than zero");
        require(s.itemsDeposits[_nonce].grantor == address(0), "ItemsRolesRegistryFacet: deposit already exists");

        s.itemsDeposits[_nonce] = _depositInfo;

        emit Deposited(_nonce, _depositInfo.tokenAddress, _depositInfo.tokenId, _depositInfo.tokenAmount, _depositInfo.grantor);

        _transferFrom(_depositInfo.grantor, address(this), _depositInfo.tokenAddress, _depositInfo.tokenId, _depositInfo.tokenAmount);
    }

    function revokeRoleFrom(uint256 _nonce, bytes32 _role) external override {
        // revoke(depositId, role1)
        RoleData memory _roleData = s.itemsRoleAssignments[_nonce];
        require(_roleData.grantee != address(0), "ItemsRolesRegistryFacet: role does not exist");
        DepositInfo memory _depositInfo = s.itemsDeposits[_nonce];

        address caller = _findCaller(_roleData, _depositInfo);
        if (_roleData.expirationDate > block.timestamp && !_roleData.revocable) {
            // if role is not expired and is not revocable, only the grantee can revoke it
            require(caller == _roleData.grantee, "ItemsRolesRegistryFacet: role is not revocable or caller is not the approved");
        }


        if (s.itemIdToDelegationIdToGotchiId[_nonce][_depositInfo.tokenId] != 0) {
            uint256 _gotchiId = s.itemIdToDelegationIdToGotchiId[_nonce][_depositInfo.tokenId];
            LibItems.removeFromParent(address(this), _gotchiId, _depositInfo.tokenId, 1);
            IEventHandlerFacet(s.wearableDiamond).emitTransferSingleEvent(msg.sender, address(this), msg.sender, _depositInfo.tokenId, 1);
            emit LibERC1155.TransferFromParent(address(this), _gotchiId, _depositInfo.tokenId, 1);
            delete s.itemIdToDelegationIdToGotchiId[_nonce][_depositInfo.tokenId];
        }

        delete s.itemsRoleAssignments[_nonce];


        emit RoleRevoked(
            _nonce,
            _roleData.role,
            _depositInfo.tokenAddress,
            _depositInfo.tokenId,
            _depositInfo.tokenAmount,
            _depositInfo.grantor,
            _roleData.grantee
        );
    }

    function withdraw(
        uint256 _nonce
    )
        public
        onlyOwnerOrApprovedWithBalance(
            s.itemsDeposits[_nonce].grantor,
            s.itemsDeposits[_nonce].tokenAddress,
            s.itemsDeposits[_nonce].tokenId,
            s.itemsDeposits[_nonce].tokenAmount
        )
    {
        DepositInfo memory _depositInfo = s.itemsDeposits[_nonce];
        require(_depositInfo.tokenAmount > 0, "ItemsRolesRegistryFacet: deposit does not exist");
        require(
            s.itemsRoleAssignments[_nonce].grantee == address(0) || s.itemsRoleAssignments[_nonce].expirationDate < block.timestamp,
            "ItemsRolesRegistryFacet: nft is delegated"
        );

        delete s.itemsDeposits[_nonce];

        _transferFrom(address(this), _depositInfo.grantor, _depositInfo.tokenAddress, _depositInfo.tokenId, _depositInfo.tokenAmount);

        emit Withdrew(_nonce, _depositInfo.tokenAddress, _depositInfo.tokenId, _depositInfo.tokenAmount);
    }

    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _isApproved) external override {
        s.itemsTokenApprovals[msg.sender][_tokenAddress][_operator] = _isApproved;
        emit RoleApprovalForAll(_tokenAddress, _operator, _isApproved);
    }

    /** View Functions **/

    function roleData(uint256 _nonce, bytes32 _role) external view override returns (RoleData memory) {
        return s.itemsRoleAssignments[_nonce];
    }

    function roleExpirationDate(uint256 _nonce, bytes32 _role) external view override returns (uint64 expirationDate_) {
        return s.itemsRoleAssignments[_nonce].expirationDate;
    }

    function isRoleApprovedForAll(address _tokenAddress, address _grantor, address _operator) public view override returns (bool) {
        return s.itemsTokenApprovals[_grantor][_tokenAddress][_operator];
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155Receiver, IERC165) returns (bool) {
        return interfaceId == type(ISftRolesRegistry).interfaceId || interfaceId == type(IERC1155Receiver).interfaceId;
    }

    /** Helper Functions **/

    function _transferFrom(address _from, address _to, address _tokenAddress, uint256 _tokenId, uint256 _tokenAmount) internal {
        LibItems.removeFromOwner(_from, _tokenId, _tokenAmount);
        LibItems.addToOwner(_to, _tokenId, _tokenAmount);
        IEventHandlerFacet(_tokenAddress).emitTransferSingleEvent(LibMeta.msgSender(), _from, _to, _tokenId, _tokenAmount);
        LibERC1155Marketplace.updateERC1155Listing(address(this), _tokenId, _to);
    }

    function _findCaller(RoleData memory _roleData, DepositInfo memory _depositInfo) internal view returns (address) {
        if (_depositInfo.grantor == msg.sender || isRoleApprovedForAll(_depositInfo.tokenAddress, _depositInfo.grantor, msg.sender)) {
            return _depositInfo.grantor;
        }

        if (_roleData.grantee == msg.sender || isRoleApprovedForAll(_depositInfo.tokenAddress, _roleData.grantee, msg.sender)) {
            return _roleData.grantee;
        }

        revert("ItemsRolesRegistryFacet: sender must be approved");
    }
}
