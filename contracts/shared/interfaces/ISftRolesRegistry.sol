// SPDX-License-Identifier: CC0-1.0

pragma solidity 0.8.1;

import { IERC165 } from './IERC165.sol';

/// @title Semi-Fungible Token Roles Registry Interface
/// Note: the ERC-165 identifier for this interface is 0x1ec9fef7
interface ISftRolesRegistry is IERC165 {
      struct RoleData {
        address grantee;
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    struct DepositInfo {
        address grantor;
        address tokenAddress;
        uint256 tokenId;
        uint256 tokenAmount;
    }

    struct RoleAssignment {
        uint256 nonce;
        bytes32 role;
        address tokenAddress;
        uint256 tokenId;
        uint256 tokenAmount;
        address grantor;
        address grantee;
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    /** Events **/

    /// @notice Emitted when a role is granted.
    /// @param _nonce The identifier of the role assignment.
    /// @param _role The role identifier.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    /// @param _tokenAmount The token amount.
    /// @param _grantor The user assigning the role.
    /// @param _grantee The user receiving the role.
    /// @param _expirationDate The expiration date of the role.
    /// @param _revocable Whether the role is revocable or not.
    /// @param _data Any additional data about the role.
    event RoleGranted(
        uint256 indexed _nonce,
        bytes32 indexed _role,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _tokenAmount,
        address _grantor,
        address _grantee,
        uint64 _expirationDate,
        bool _revocable,
        bytes _data
    );

    /// @notice Emitted when a role is revoked.
    /// @param _nonce The identifier of the role assignment.
    /// @param _role The role identifier.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    /// @param _tokenAmount The token amount.
    /// @param _revoker The user revoking the role.
    /// @param _grantee The user that receives the role revocation.
    event RoleRevoked(
        uint256 indexed _nonce,
        bytes32 indexed _role,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _tokenAmount,
        address _revoker,
        address _grantee
    );

    /// @notice Emitted when a user is approved to manage roles on behalf of another user.
    /// @param _tokenAddress The token address.
    /// @param _operator The user approved to grant and revoke roles.
    /// @param _isApproved The approval status.
    event RoleApprovalForAll(address indexed _tokenAddress, address indexed _operator, bool _isApproved);

    /// @notice Emitted when a user withdraws tokens from a role assignment.
    /// @param _nonce The identifier of the role assignment.
    /// @param _grantor The user withdrawing the tokens.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    /// @param _tokenAmount The token amount withdrawn.
    event Withdrew(uint256 indexed _nonce, address indexed _grantor, address _tokenAddress, uint256 _tokenId, uint256 _tokenAmount);

    /** External Functions **/

    /// @notice Grants a role on behalf of a user.
    /// @param _roleAssignment The role assignment data.
    function grantRoleFrom(RoleAssignment calldata _roleAssignment) external;

    /// @notice Revokes a role on behalf of a user.
    /// @param _nonce The identifier of the role assignment.
    /// @param _role The role identifier.
    /// @param _grantee The user that gets their role revoked.
    function revokeRoleFrom(uint256 _nonce, bytes32 _role, address _grantee) external;

    /// @notice Approves operator to grant and revoke any roles on behalf of another user.
    /// @param _tokenAddress The token address.
    /// @param _operator The user approved to grant and revoke roles.
    /// @param _approved The approval status.
    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _approved) external;

    /** View Functions **/

    /// @notice Returns the custom data of a role assignment.
    /// @param _nonce The identifier of the role assignment.
    /// @param _role The role identifier.
    /// @param _grantee The user that gets their role revoked.
    function roleData(uint256 _nonce, bytes32 _role, address _grantee) external view returns (RoleData memory data_);

    /// @notice Returns the expiration date of a role assignment.
    /// @param _nonce The identifier of the role assignment.
    /// @param _role The role identifier.
    /// @param _grantee The user that gets their role revoked.
    function roleExpirationDate(uint256 _nonce, bytes32 _role, address _grantee) external view returns (uint64 expirationDate_);

    /// @notice Checks if the grantor approved the operator for all NFTs.
    /// @param _tokenAddress The token address.
    /// @param _grantor The user that approved the operator.
    /// @param _operator The user that can grant and revoke roles.
    function isRoleApprovedForAll(address _tokenAddress, address _grantor, address _operator) external view returns (bool);
}
