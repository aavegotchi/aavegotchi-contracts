// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAppStorage, AppStorage, AavegotchiRental} from "./LibAppStorage.sol";
import "../../shared/interfaces/IERC721.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {CollateralEscrow} from "../CollateralEscrow.sol";

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
        s.aavegotchis[rental.erc721TokenId].locked = false;
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

    function claimAavegotchiRental(uint256 rentalId, address[] calldata _revenueTokens) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        AavegotchiRental storage rental = s.aavegotchiRentals[rentalId];

        address originalOwner = rental.originalOwner;
        address renter = rental.renter;
        address receiver = rental.receiver;
        uint256 tokenId = rental.erc721TokenId;
        address escrow = s.aavegotchis[tokenId].escrow;
        if (escrow == address(0)) return;
        address collateralType = s.aavegotchis[tokenId].collateralType;
        for (uint256 i; i < _revenueTokens.length; i++) {
            address revenueToken = _revenueTokens[i];
            if (collateralType == revenueToken) continue;

            bool isIncluded;
            for (uint256 j; j < rental.includeList.length; j++) {
                if (rental.includeList[j] == revenueToken) {
                    isIncluded = true;
                    break;
                }
            }
            if (!isIncluded) continue;

            uint256 balance = IERC20(revenueToken).balanceOf(escrow);
            if (balance == 0) continue;

            if (IERC20(revenueToken).allowance(escrow, address(this)) < balance) {
                CollateralEscrow(escrow).approveAavegotchiDiamond(revenueToken);
            }

            uint256 ownerAmount = (balance * rental.revenueSplit[0]) / 100;
            uint256 renterAmount = (balance * rental.revenueSplit[1]) / 100;
            LibERC20.transferFrom(revenueToken, escrow, originalOwner, ownerAmount);
            LibERC20.transferFrom(revenueToken, escrow, renter, renterAmount);
            if (receiver != address(0)) {
                uint256 receiverAmount = (balance * rental.revenueSplit[2]) / 100;
                LibERC20.transferFrom(revenueToken, escrow, receiver, receiverAmount);
            }
        }

        rental.lastClaimed = block.timestamp;
    }

    function enforceAavegotchiNotInRental(uint256 _tokenId) internal view {
        AppStorage storage s = LibAppStorage.diamondStorage();
        require(s.aavegotchiRentalHead[_tokenId] == 0, "AavegotchiLending: Aavegotchi is in rental");
    }

    function isAavegotchiLent(uint256 _tokenId) internal view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 rentalId = s.aavegotchiRentalHead[_tokenId];
        if (rentalId == 0) return false;
        AavegotchiRental storage rental_ = s.aavegotchiRentals[rentalId];
        if (rental_.timeCreated == 0 || rental_.timeAgreed == 0) return false;
        return rental_.completed == false;
    }
}
