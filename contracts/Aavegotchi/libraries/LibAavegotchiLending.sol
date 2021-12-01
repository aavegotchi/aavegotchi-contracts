// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAppStorage, AppStorage, AavegotchiRental} from "./LibAppStorage.sol";
import "../../shared/interfaces/IERC721.sol";

library LibAavegotchiLending {
    event AavegotchiRentalCanceled(uint256 indexed rentalId, uint256 time);

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
        s.aavegotchiRentalHead[rental.erc721TokenId] = 0;

        emit AavegotchiRentalCanceled(_rentalId, block.number);
    }

    function cancelAavegotchiRentalFromToken(uint256 _erc721TokenId, address _owner) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        cancelAavegotchiRental(s.aavegotchiRentalHead[_erc721TokenId], _owner);
    }

    function removeLentAavegotchi(uint256 _tokenId, address _owner) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

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

    function enforceAavegotchiNotInRental(uint256 _tokenId) internal view {
        AppStorage storage s = LibAppStorage.diamondStorage();
        require(s.aavegotchiRentalHead[_tokenId] == 0, "AavegotchiLending: Aavegotchi is in rental");
    }
}
