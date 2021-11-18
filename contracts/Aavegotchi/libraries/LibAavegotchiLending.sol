// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAppStorage, AppStorage, AavegotchiRental} from "./LibAppStorage.sol";

import "../../shared/interfaces/IERC721.sol";

library LibAavegotchiLending {
    event AavegotchiRentalCanceled(uint256 indexed rentalId, uint256 category, uint256 time);
    event AavegotchiRentalRemoved(uint256 indexed rentalId, uint256 category, uint256 time);

    function cancelAavegotchiRental(uint256 _rentalId, address _owner) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        AavegotchiRental storage rental = s.aavegotchiRentals[_rentalId];
        require(rental.timeCreated != 0, "AavegotchiLending: rental not found");
        if (rental.canceled) {
            return;
        }
        require(rental.timeAgreed == 0, "AavegotchiLending: rental already agreed");
        require(rental.originalOwner == _owner, "AavegotchiLending: not original owner");
        rental.canceled = true;

        //Unlock Aavegotchis when rental is created
        if (rental.erc721TokenAddress == address(this)) {
            s.aavegotchis[rental.erc721TokenId].locked = false;
        }

        emit AavegotchiRentalCanceled(_rentalId, rental.category, block.number);
        removeAavegotchiRental(rental.erc721TokenId, _owner);
    }

    function cancelAavegotchiRentalFromToken(
        uint256 _erc721TokenId,
        address _owner
    ) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 rentalId = s.aavegotchiRentalHead[_erc721TokenId];
        if (rentalId == 0) {
            return;
        }
        cancelAavegotchiRental(rentalId, _owner);
    }

    function removeAavegotchiRental(uint256 _tokenId, address _owner) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        s.aavegotchiRentalHead[_tokenId] = 0;

        // Remove indexed data for original owner
        uint256 index = s.lentTokenIdIndexes[_owner][_tokenId];
        uint256 lastIndex = s.lentTokenIds[_owner].length - 1;
        if (index != lastIndex) {
            uint256 lastTokenId = s.lentTokenIds[_owner][lastIndex];
            s.lentTokenIds[_owner][index] = lastTokenId;
            s.lentTokenIdIndexes[_owner][lastTokenId] = index;
        }
        s.lentTokenIds[_owner].pop();
        delete s.lentTokenIdIndexes[_owner][_tokenId];
    }
}
