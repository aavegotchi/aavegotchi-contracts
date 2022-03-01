// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAppStorage, AppStorage, AavegotchiRental, RentalListItem} from "./LibAppStorage.sol";
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

        removeRentalListItem(_rentalId, _owner);

        //Unlock Aavegotchis when rental is created
        s.aavegotchis[rental.erc721TokenId].locked = false;
        s.aavegotchiToRentalId[rental.erc721TokenId] = 0;

        emit AavegotchiRentalCanceled(_rentalId, block.number);
    }

    function cancelAavegotchiRentalFromToken(uint256 _erc721TokenId, address _owner) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        cancelAavegotchiRental(s.aavegotchiToRentalId[_erc721TokenId], _owner);
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

    function enforceAavegotchiNotInRental(uint256 _tokenId, address _sender) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 _rentalId = s.aavegotchiToRentalId[_tokenId];
        if (_rentalId > 0) {
            AavegotchiRental storage _rental = s.aavegotchiRentals[_rentalId];
            require(_rental.originalOwner == _sender, "AavegotchiLending: Aavegotchi is in rental");
            if (_rental.timeAgreed > 0) {
                // revert if agreed rental
                revert("AavegotchiLending: Aavegotchi is in rental");
            } else {
                // cancel if not agreed rental
                cancelAavegotchiRental(_rentalId, _sender);
            }
        }
    }

    function isAavegotchiLent(uint256 _tokenId) internal view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 rentalId = s.aavegotchiToRentalId[_tokenId];
        if (rentalId == 0) return false;
        AavegotchiRental storage rental_ = s.aavegotchiRentals[rentalId];
        if (rental_.timeCreated == 0 || rental_.timeAgreed == 0) return false;
        return rental_.completed == false;
    }

    function addRentalListItem(address _owner, uint256 _rentalId) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        uint256 headRentalId = s.aavegotchiOwnerRentalHead[_owner];
        if (headRentalId != 0) {
            RentalListItem storage headRentalItem = s.aavegotchiOwnerRentalListItem[headRentalId];
            headRentalItem.parentRentalId = _rentalId;
        }
        RentalListItem storage rentalItem = s.aavegotchiOwnerRentalListItem[_rentalId];
        rentalItem.childRentalId = headRentalId;
        s.aavegotchiOwnerRentalHead[_owner] = _rentalId;
        rentalItem.rentalId = _rentalId;

        headRentalId = s.aavegotchiRentalHead;
        if (headRentalId != 0) {
            RentalListItem storage headRentalItem = s.aavegotchiRentalListItem[headRentalId];
            headRentalItem.parentRentalId = _rentalId;
        }
        rentalItem = s.aavegotchiRentalListItem[_rentalId];
        rentalItem.childRentalId = headRentalId;
        s.aavegotchiRentalHead = _rentalId;
        rentalItem.rentalId = _rentalId;
    }

    function removeRentalListItem(uint256 _rentalId, address _owner) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        RentalListItem storage rentalItem = s.aavegotchiRentalListItem[_rentalId];
        if (rentalItem.rentalId == 0) {
            return;
        }
        uint256 parentRentalId = rentalItem.parentRentalId;
        if (parentRentalId != 0) {
            RentalListItem storage parentRentalItem = s.aavegotchiRentalListItem[parentRentalId];
            parentRentalItem.childRentalId = rentalItem.childRentalId;
        }
        uint256 childRentalId = rentalItem.childRentalId;
        if (childRentalId != 0) {
            RentalListItem storage childRentalItem = s.aavegotchiRentalListItem[childRentalId];
            childRentalItem.parentRentalId = rentalItem.parentRentalId;
        }

        if (s.aavegotchiRentalHead == _rentalId) {
            s.aavegotchiRentalHead = rentalItem.childRentalId;
        }
        rentalItem.rentalId = 0;
        rentalItem.parentRentalId = 0;
        rentalItem.childRentalId = 0;

        rentalItem = s.aavegotchiOwnerRentalListItem[_rentalId];
        parentRentalId = rentalItem.parentRentalId;
        if (parentRentalId != 0) {
            RentalListItem storage parentRentalItem = s.aavegotchiOwnerRentalListItem[parentRentalId];
            parentRentalItem.childRentalId = rentalItem.childRentalId;
        }
        childRentalId = rentalItem.childRentalId;
        if (childRentalId != 0) {
            RentalListItem storage childRentalItem = s.aavegotchiOwnerRentalListItem[childRentalId];
            childRentalItem.parentRentalId = rentalItem.parentRentalId;
        }

        if (s.aavegotchiOwnerRentalHead[_owner] == _rentalId) {
            s.aavegotchiOwnerRentalHead[_owner] = rentalItem.childRentalId;
        }
        rentalItem.rentalId = 0;
        rentalItem.parentRentalId = 0;
        rentalItem.childRentalId = 0;
    }
}
