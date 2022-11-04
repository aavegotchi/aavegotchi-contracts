// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "./IERC165.sol";

/// @title IMultiRoyalty
/// @dev Interface for the MultiRoyalty standard (will update to EIP when submitted)
interface IMultiRoyalty is IERC165 {
    /// ERC165 bytes to add to interface array - set in parent contract
    /// implementing this standard
    ///
    /// bytes4(keccak256("multiRoyaltyInfo(uint256,uint256)")) == 0x24d34933
    /// bytes4 private constant _INTERFACE_ID = 0x24d34933;
    /// _registerInterface(_INTERFACE_ID);

    /// @notice Called with the sale price to determine how much royalty
    //          is owed and to whom.
    /// @param _tokenId - the NFT asset queried for royalty information
    /// @param _salePrice - the sale price of the NFT asset specified by _tokenId
    /// @return receivers - address of who should be sent the royalty payment
    /// @return royaltyAmounts - the royalty payment amount for _salePrice
    function multiRoyaltyInfo(uint256 _tokenId, uint256 _salePrice)
        external
        view
        returns (address[] memory receivers, uint256[] memory royaltyAmounts);

    /// @notice Informs callers that this contract supports multi royalty standard
    /// @dev If `_registerInterface(_INTERFACE_ID)` is called
    ///      in the initializer, this should be automatic
    /// @param interfaceID The interface identifier, as specified in ERC-165
    /// @return `true` if the contract implements
    ///         `_INTERFACE_ID` and `false` otherwise
    function supportsInterface(bytes4 interfaceID) external view override returns (bool);
}
