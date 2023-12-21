// SPDX-License-Identifier: CC0-1.0

pragma solidity 0.8.1;

/// @title Semi-Fungible Token Roles Registry Interface
interface ISftRolesRegistry {

    struct RoleAssignment {
        address grantee;
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    struct Record {
        address grantor;
        address tokenAddress;
        uint256 tokenId;
        uint256 tokenAmount;
    }

    /** Events **/

    /// @notice Emitted when a record is created.
    /// @param _grantor The owner of the NFTs.
    /// @param _recordId The identifier of the record created.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    /// @param _tokenAmount The token amount.
    event RecordCreated(
        address indexed _grantor,
        uint256 indexed _recordId,
        address indexed _tokenAddress,
        uint256 _tokenId,
        uint256 _tokenAmount
    );

    /// @notice Emitted when a role is granted.
    /// @param _recordId The record identifier.
    /// @param _role The role identifier.
    /// @param _grantee The user receiving the role.
    /// @param _expirationDate The expiration date of the role.
    /// @param _revocable Whether the role is revocable or not.
    /// @param _data Any additional data about the role.
    event RoleGranted(
        uint256 indexed _recordId,
        bytes32 indexed _role,
        address indexed _grantee,
        uint64 _expirationDate,
        bool _revocable,
        bytes _data
    );

    /// @notice Emitted when a role is revoked.
    /// @param _recordId The record identifier.
    /// @param _role The role identifier.
    /// @param _grantee The user that receives the role revocation.
    event RoleRevoked(uint256 indexed _recordId, bytes32 indexed _role, address indexed _grantee);

    /// @notice Emitted when a user withdraws tokens from a record.
    /// @param _recordId The record identifier.
    event Withdrew(uint256 indexed _recordId);

    /// @notice Emitted when a user is approved to manage roles on behalf of another user.
    /// @param _tokenAddress The token address.
    /// @param _operator The user approved to grant and revoke roles.
    /// @param _isApproved The approval status.
    event RoleApprovalForAll(address indexed _tokenAddress, address indexed _operator, bool _isApproved);

    /** External Functions **/

    /// @notice Creates a new record for on behalf of a user.
    /// @param _grantor The owner of the NFTs.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    /// @param _tokenAmount The token amount.
    /// @return recordId_ The unique identifier of the record created.
    function createRecordFrom(
        address _grantor,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _tokenAmount
    ) external returns (uint256 recordId_);

    /// @notice Grants a role to `_grantee`.
    /// @param _recordId The identifier of the record.
    /// @param _role The role identifier.
    /// @param _grantee The user receiving the role.
    /// @param _expirationDate The expiration date of the role.
    /// @param _revocable Whether the role is revocable or not.
    /// @param _data Any additional data about the role.
    function grantRole(
        uint256 _recordId,
        bytes32 _role,
        address _grantee,
        uint64 _expirationDate,
        bool _revocable,
        bytes calldata _data
    ) external;

    /// @notice Revokes a role on behalf of a user.
    /// @param _recordId The record identifier.
    /// @param _role The role identifier.
    /// @param _grantee The user that gets their role revoked.
    function revokeRoleFrom(uint256 _recordId, bytes32 _role, address _grantee) external;

    /// @notice Withdraws tokens back to grantor.
    /// @param _recordId The record identifier.
    function withdrawFrom(uint256 _recordId) external;

    /// @notice Approves operator to grant and revoke roles on behalf of another user.
    /// @param _tokenAddress The token address.
    /// @param _operator The user approved to grant and revoke roles.
    /// @param _approved The approval status.
    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _approved) external;

    /** View Functions **/

    /// @notice Returns the custom data of a role assignment.
    /// @param _recordId The record identifier.
    /// @param _role The role identifier.
    /// @param _grantee The user that received the role.
    /// @return data_ The custom data.
    function roleData(uint256 _recordId, bytes32 _role, address _grantee) external view returns (bytes memory data_);

    /// @notice Returns the expiration date of a role assignment.
    /// @param _recordId The record identifier.
    /// @param _role The role identifier.
    /// @param _grantee The user that received the role.
    /// @return expirationDate_ The expiration date.
    function roleExpirationDate(
        uint256 _recordId,
        bytes32 _role,
        address _grantee
    ) external view returns (uint64 expirationDate_);

    /// @notice Returns the expiration date of a role assignment.
    /// @param _recordId The record identifier.
    /// @param _role The role identifier.
    /// @param _grantee The user that received the role.
    /// @return revocable_ Whether the role is revocable or not.
    function isRoleRevocable(
        uint256 _recordId,
        bytes32 _role,
        address _grantee
    ) external view returns (bool revocable_);

    /// @notice Checks if the grantor approved the operator for all NFTs.
    /// @param _tokenAddress The token address.
    /// @param _grantor The user that approved the operator.
    /// @param _operator The user that can grant and revoke roles.
    /// @return isApproved_ Whether the operator is approved or not.
    function isRoleApprovedForAll(
        address _tokenAddress,
        address _grantor,
        address _operator
    ) external view returns (bool isApproved_);
}
