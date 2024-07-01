// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {IERC7432} from "../../shared/interfaces/IERC7432.sol";
import {IERC721} from "../../shared/interfaces/IERC721.sol";

import {IRealmDiamond} from "contracts/shared/interfaces/IRealmDiamond.sol";
import {Modifiers, RoleData} from "../libraries/LibAppStorage.sol";

import {LibItems} from "../libraries/LibItems.sol";
import {LibSharedMarketplace} from "../libraries/LibSharedMarketplace.sol";

contract ParcelRolesRegistryFacet is  Modifiers, IERC7432 {


    uint256 public constant MAX_EXPIRATION_DATE = 90 days;
    
    bytes32 public constant ROLE_ALCHEMICA_CHANNELING = keccak256("AlchemicaChanneling()");
    bytes32 public constant ROLE_EMPTY_RESERVOIR = keccak256("EmptyReservoir()");
    bytes32 public constant ROLE_EQUIP_INSTALLATIONS = keccak256("EquipInstallations()");
    bytes32 public constant ROLE_EQUIP_TILES = keccak256("EquipTiles()");
    bytes32 public constant ROLE_UPGRADE_INSTALLATIONS = keccak256("UpgradeInstallations()");

    constructor() {
        bytes32[5] memory initialRoles = [
            ROLE_ALCHEMICA_CHANNELING,
            ROLE_EMPTY_RESERVOIR,
            ROLE_EQUIP_INSTALLATIONS,
            ROLE_EQUIP_TILES,
            ROLE_UPGRADE_INSTALLATIONS
        ];
        for (uint256 i = 0; i < initialRoles.length; i++) {
            s.isRoleAllowed[initialRoles[i]] = true;
            s.allowedRoles.push(initialRoles[i]);
        }
    }

    modifier onlyAllowedRole(bytes32 _roleId) {
        require(s.isRoleAllowed[_roleId], 'ParcelRolesRegistryFacet: role is not allowed');
        _;
    }

        /** Modifiers **/


    /**
     * @notice Checks if the token is a wearable.
     * @dev It reverts if the token is not a wearable.
     * @param _tokenAddress The token address.
     * @param _tokenId The token identifier.
     */

    modifier onlyRealm(address _tokenAddress, uint256 _tokenId) {
        uint256 category = LibSharedMarketplace.getERC721Category(_tokenAddress, _tokenId);
        require(_tokenAddress == s.realmAddress, "ParcelRolesRegistryFacet: Only Item NFTs are supported");
        require(category == 4, "ParcelRolesRegistryFacet: Only Items of type Realm are supported");
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
        require(_account == _sender || isRoleApprovedForAll(_tokenAddress, _account, _sender), "ParcelRolesRegistryFacet: account not approved");
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
            "ParcelRolesRegistryFacet: invalid expiration date"
        );
        require(s.isRoleAllowed[_role], "ParcelRolesRegistryFacet: role not supported");
        _;
    }

    // @notice Checks if the grantor approved the operator for all SFTs.
    /// @param _tokenAddress The token address.
    /// @param _grantor The user that approved the operator.
    /// @param _operator The user that can grant and revoke roles.
    /// @return isApproved_ Whether the operator is approved or not.
    function isRoleApprovedForAll(address _tokenAddress, address _grantor, address _operator) public view override returns (bool) {
        return s.itemsRoleApprovals[_grantor][_tokenAddress][_operator];
    }

    function addRole(bytes32 _role) external {
        require(!s.isRoleAllowed[_role], "ParcelRolesRegistryFacet: role already exists");
        s.isRoleAllowed[_role] = true;
        s.allowedRoles.push(_role);
    }

    function revokeRole(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId
    ) external override onlyAllowedRole(_roleId) {
        address _recipient = s.roles[_tokenAddress][_tokenId][_roleId].recipient;
        address _caller = _getApprovedCaller(_tokenAddress, _tokenId, _recipient);

        // if caller is recipient, the role can be revoked regardless of its state
        if (_caller != _recipient) {
            // if caller is owner, the role can only be revoked if revocable or expired
            require(
                s.roles[_tokenAddress][_tokenId][_roleId].revocable ||
                    s.roles[_tokenAddress][_tokenId][_roleId].expirationDate < block.timestamp,
                'ParcelRolesRegistryFacet: role is not revocable nor expired'
            );
        }

        delete s.roles[_tokenAddress][_tokenId][_roleId];
        emit RoleRevoked(_tokenAddress, _tokenId, _roleId);
    }

    /// @notice Returns the account approved to call the revokeRole function. Reverts otherwise.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    /// @param _recipient The user that received the role.
    /// @return caller_ The approved account.
    function _getApprovedCaller(
        address _tokenAddress,
        uint256 _tokenId,
        address _recipient
    ) internal view returns (address caller_) {
        if (msg.sender == _recipient || isRoleApprovedForAll(_tokenAddress, _recipient, msg.sender)) {
            return _recipient;
        }
        address originalOwner = s.originalOwners[_tokenAddress][_tokenId];
        if (msg.sender == originalOwner || isRoleApprovedForAll(_tokenAddress, originalOwner, msg.sender)) {
            return originalOwner;
        }
        revert('ParcelRolesRegistryFacet: role does not exist or sender is not approved');
    }

    function unlockToken(address _tokenAddress, uint256 _tokenId) external override {
        address originalOwner = s.originalOwners[_tokenAddress][_tokenId];

        require(!_hasNonRevocableRole(_tokenAddress, _tokenId), 'ParcelRolesRegistryFacet: NFT is locked');

        require(
            originalOwner == msg.sender || isRoleApprovedForAll(_tokenAddress, originalOwner, msg.sender),
            'ParcelRolesRegistryFacet: sender must be owner or approved'
        );

        delete s.originalOwners[_tokenAddress][_tokenId];
        IERC721(_tokenAddress).transferFrom(address(this), originalOwner, _tokenId);
        emit TokenUnlocked(originalOwner, _tokenAddress, _tokenId);
    }

       function grantRole(IERC7432.Role calldata _role) external override  onlyAllowedRole(_role.roleId) onlyRealm(_role.tokenAddress, _role.tokenId)  {
        require(_role.expirationDate > block.timestamp, 'ParcelRolesRegistryFacet: expiration date must be in the future');

        // deposit NFT if necessary
        // reverts if sender is not approved or original owner
        address _originalOwner = _depositNft(_role.tokenAddress, _role.tokenId);

        // role must be expired or revocable
        RoleData storage _roleData = s.roles[_role.tokenAddress][_role.tokenId][_role.roleId];
        require(
            _roleData.revocable || _roleData.expirationDate < block.timestamp,
            'ParcelRolesRegistryFacet: role must be expired or revocable'
        );

        s.roles[_role.tokenAddress][_role.tokenId][_role.roleId] = RoleData(
            _role.recipient,
            _role.expirationDate,
            _role.revocable,
            _role.data
        );

        emit RoleGranted(
            _role.tokenAddress,
            _role.tokenId,
            _role.roleId,
            _originalOwner,
            _role.recipient,
            _role.expirationDate,
            _role.revocable,
            _role.data
        );
    }

    function _depositNft(address _tokenAddress, uint256 _tokenId) internal returns (address originalOwner_) {
        address _currentOwner = IERC721(_tokenAddress).ownerOf(_tokenId);

        if (_currentOwner == address(this)) {
            // if the NFT is already on the contract, check if sender is approved or original owner
            originalOwner_ = s.originalOwners[_tokenAddress][_tokenId];
            require(
                originalOwner_ == msg.sender || isRoleApprovedForAll(_tokenAddress, originalOwner_, msg.sender),
                'ParcelRolesRegistryFacet: sender must be owner or approved'
            );
        } else {
            // if NFT is not in the contract, deposit it and store the original owner
            require(
                _currentOwner == msg.sender || isRoleApprovedForAll(_tokenAddress, _currentOwner, msg.sender),
                'ParcelRolesRegistryFacet: sender must be owner or approved'
            );
            IERC721(_tokenAddress).transferFrom(_currentOwner, address(this), _tokenId);
            s.originalOwners[_tokenAddress][_tokenId] = _currentOwner;
            originalOwner_ = _currentOwner;
            emit TokenLocked(_currentOwner, _tokenAddress, _tokenId);
        }
    }

     /// @notice Checks whether an NFT has at least one non-revocable role.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    /// @return true if the NFT is locked.
    function _hasNonRevocableRole(address _tokenAddress, uint256 _tokenId) internal view returns (bool) {
        for (uint256 i = 0; i < s.allowedRoles.length; i++) {
            if (
                !s.roles[_tokenAddress][_tokenId][s.allowedRoles[i]].revocable &&
                s.roles[_tokenAddress][_tokenId][s.allowedRoles[i]].expirationDate > block.timestamp
            ) {
                return true;
            }
        }
        return false;
    }

    function ownerOf(address _tokenAddress, uint256 _tokenId) external view override returns (address owner_) {
        return s.originalOwners[_tokenAddress][_tokenId];
    }

    function recipientOf(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId
    ) external view override returns (address recipient_) {
        if (s.roles[_tokenAddress][_tokenId][_roleId].expirationDate > block.timestamp) {
            return s.roles[_tokenAddress][_tokenId][_roleId].recipient;
        }
        return address(0);
    }

     function roleData(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId
    ) external view override returns (bytes memory data_) {
        if (s.roles[_tokenAddress][_tokenId][_roleId].expirationDate > block.timestamp) {
            data_ = s.roles[_tokenAddress][_tokenId][_roleId].data;
        }
        return data_;
    }

     function isRoleRevocable(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId
    ) external view override returns (bool revocable_) {
        return
            s.roles[_tokenAddress][_tokenId][_roleId].expirationDate > block.timestamp &&
            s.roles[_tokenAddress][_tokenId][_roleId].revocable;
    }

    function roleExpirationDate(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId
    ) external view override returns (uint64 expirationDate_) {
        if (s.roles[_tokenAddress][_tokenId][_roleId].expirationDate > block.timestamp) {
            return s.roles[_tokenAddress][_tokenId][_roleId].expirationDate;
        }
        return 0;
    }

    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _approved) external override {
        s.tokenApprovals[msg.sender][_tokenAddress][_operator] = _approved;
        emit RoleApprovalForAll(_tokenAddress, _operator, _approved);
    }

      function supportsInterface(bytes4 interfaceId) external view virtual override returns (bool) {
        return interfaceId == type(IERC7432).interfaceId;
    }
}