// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;


import {IRealmDiamond} from "contracts/shared/interfaces/IRealmDiamond.sol";
import {Modifiers} from "../libraries/LibAppStorage.sol";

import {LibItems} from "../libraries/LibItems.sol";

import {LibSharedMarketplace} from "../libraries/LibSharedMarketplace.sol";

contract ParcelRolesRegistryFacet is Modifiers {

  bytes32 public constant UNIQUE_ROLE = keccak256("Player()");

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
        require(
             category == 4,
            "ParcelRolesRegistryFacet: Only Items of type Realm are supported"
        );
        _;
    }

  

}



