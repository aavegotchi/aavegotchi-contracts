// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAppStorage, AppStorage, AavegotchiRental, RentalListItem} from "./LibAppStorage.sol";
import "../../shared/interfaces/IERC721.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {CollateralEscrow} from "../CollateralEscrow.sol";

library LibAavegotchiLending {
    event AavegotchiRentalCancel(uint256 indexed rentalId, uint256 time);

    function cancelAavegotchiRental(uint256 _rentalId, address _lender) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        AavegotchiRental storage rental = s.aavegotchiRentals[_rentalId];
        require(rental.timeCreated != 0, "AavegotchiLending: rental not found");
        if (rental.canceled) {
            return;
        }
        require(rental.timeAgreed == 0, "AavegotchiLending: rental already agreed");
        require(rental.lender == _lender, "AavegotchiLending: not lender");
        rental.canceled = true;

        removeRentalListItem(_lender, _rentalId, "listed");

        //Unlock Aavegotchis when rental is created
        s.aavegotchis[rental.erc721TokenId].locked = false;
        s.aavegotchiToRentalId[rental.erc721TokenId] = 0;

        emit AavegotchiRentalCancel(_rentalId, block.number);
    }

    function cancelAavegotchiRentalFromToken(uint256 _erc721TokenId, address _lender) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        cancelAavegotchiRental(s.aavegotchiToRentalId[_erc721TokenId], _lender);
    }

    function removeLentAavegotchi(uint256 _tokenId, address _lender) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        // Remove indexed data for lender
        uint256 index = s.lentTokenIdIndexes[_lender][_tokenId];
        uint256 lastIndex = s.lentTokenIds[_lender].length - 1;
        if (index != lastIndex) {
            uint256 lastTokenId = s.lentTokenIds[_lender][lastIndex];
            s.lentTokenIds[_lender][index] = lastTokenId;
            s.lentTokenIdIndexes[_lender][lastTokenId] = index;
        }
        s.lentTokenIds[_lender].pop();
        delete s.lentTokenIdIndexes[_lender][_tokenId];
    }

    function claimAavegotchiRental(uint256 rentalId, address[] calldata _revenueTokens) internal returns (uint256[] memory) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        AavegotchiRental storage rental = s.aavegotchiRentals[rentalId];

        uint256[] memory amounts = new uint256[](_revenueTokens.length);
        uint256 tokenId = rental.erc721TokenId;
        address escrow = s.aavegotchis[tokenId].escrow;
        if (escrow == address(0)) return amounts;
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
            amounts[i] = balance;

            if (IERC20(revenueToken).allowance(escrow, address(this)) < balance) {
                CollateralEscrow(escrow).approveAavegotchiDiamond(revenueToken);
            }

            uint256 ownerAmount = (balance * rental.revenueSplit[0]) / 100;
            uint256 renterAmount = (balance * rental.revenueSplit[1]) / 100;
            address owner = rental.originalOwner == address(0) ? rental.lender : rental.originalOwner;
            LibERC20.transferFrom(revenueToken, escrow, owner, ownerAmount);
            LibERC20.transferFrom(revenueToken, escrow, rental.renter, renterAmount);
            if (rental.thirdParty != address(0)) {
                uint256 thirdPartyAmount = (balance * rental.revenueSplit[2]) / 100;
                LibERC20.transferFrom(revenueToken, escrow, rental.thirdParty, thirdPartyAmount);
            }
        }

        rental.lastClaimed = block.timestamp;

        return amounts;
    }

    function enforceAavegotchiNotInRental(uint256 _tokenId, address _sender) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 _rentalId = s.aavegotchiToRentalId[_tokenId];
        if (_rentalId > 0) {
            AavegotchiRental storage _rental = s.aavegotchiRentals[_rentalId];
            require(_rental.lender == _sender, "AavegotchiLending: Aavegotchi is in rental");
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

    function addRentalListItem(
        address _lender,
        uint256 _rentalId,
        bytes32 _status
    ) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        uint256 headRentalId = s.aavegotchiLenderRentalHead[_lender][_status];
        if (headRentalId != 0) {
            RentalListItem storage headRentalItem = s.aavegotchiLenderRentalListItem[_status][headRentalId];
            headRentalItem.parentRentalId = _rentalId;
        }
        RentalListItem storage rentalItem = s.aavegotchiLenderRentalListItem[_status][_rentalId];
        rentalItem.childRentalId = headRentalId;
        s.aavegotchiLenderRentalHead[_lender][_status] = _rentalId;
        rentalItem.rentalId = _rentalId;

        headRentalId = s.aavegotchiRentalHead[_status];
        if (headRentalId != 0) {
            RentalListItem storage headRentalItem = s.aavegotchiRentalListItem[_status][headRentalId];
            headRentalItem.parentRentalId = _rentalId;
        }
        rentalItem = s.aavegotchiRentalListItem[_status][_rentalId];
        rentalItem.childRentalId = headRentalId;
        s.aavegotchiRentalHead[_status] = _rentalId;
        rentalItem.rentalId = _rentalId;
    }

    function removeRentalListItem(
        address _lender,
        uint256 _rentalId,
        bytes32 _status
    ) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        RentalListItem storage rentalItem = s.aavegotchiRentalListItem[_status][_rentalId];
        if (rentalItem.rentalId == 0) {
            return;
        }
        uint256 parentRentalId = rentalItem.parentRentalId;
        if (parentRentalId != 0) {
            RentalListItem storage parentRentalItem = s.aavegotchiRentalListItem[_status][parentRentalId];
            parentRentalItem.childRentalId = rentalItem.childRentalId;
        }
        uint256 childRentalId = rentalItem.childRentalId;
        if (childRentalId != 0) {
            RentalListItem storage childRentalItem = s.aavegotchiRentalListItem[_status][childRentalId];
            childRentalItem.parentRentalId = rentalItem.parentRentalId;
        }

        if (s.aavegotchiRentalHead[_status] == _rentalId) {
            s.aavegotchiRentalHead[_status] = rentalItem.childRentalId;
        }
        rentalItem.rentalId = 0;
        rentalItem.parentRentalId = 0;
        rentalItem.childRentalId = 0;

        rentalItem = s.aavegotchiLenderRentalListItem[_status][_rentalId];
        parentRentalId = rentalItem.parentRentalId;
        if (parentRentalId != 0) {
            RentalListItem storage parentRentalItem = s.aavegotchiLenderRentalListItem[_status][parentRentalId];
            parentRentalItem.childRentalId = rentalItem.childRentalId;
        }
        childRentalId = rentalItem.childRentalId;
        if (childRentalId != 0) {
            RentalListItem storage childRentalItem = s.aavegotchiLenderRentalListItem[_status][childRentalId];
            childRentalItem.parentRentalId = rentalItem.parentRentalId;
        }

        if (s.aavegotchiLenderRentalHead[_lender][_status] == _rentalId) {
            s.aavegotchiLenderRentalHead[_lender][_status] = rentalItem.childRentalId;
        }
        rentalItem.rentalId = 0;
        rentalItem.parentRentalId = 0;
        rentalItem.childRentalId = 0;
    }
}
