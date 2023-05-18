// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAavegotchi, AavegotchiInfo} from "../libraries/LibAavegotchi.sol";
import {LibGotchiLending} from "../libraries/LibGotchiLending.sol";
import {Modifiers, GotchiLending} from "../libraries/LibAppStorage.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";

import {LibBitmapHelpers} from "../libraries/LibBitmapHelpers.sol";

contract LendingGetterAndSetterFacet is Modifiers {
    event LendingOperatorSet(address indexed lender, address indexed lendingOperator, uint32 indexed tokenId, bool isLendingOperator);

    function allowRevenueTokens(address[] calldata tokens) external onlyOwner {
        for (uint256 i = 0; i < tokens.length; ) {
            s.revenueTokenAllowed[tokens[i]] = true;
            unchecked {
                ++i;
            }
        }
    }

    function disallowRevenueTokens(address[] calldata tokens) external onlyOwner {
        for (uint256 i = 0; i < tokens.length; ) {
            s.revenueTokenAllowed[tokens[i]] = false;
            unchecked {
                ++i;
            }
        }
    }

    // /// @dev Should be removed after all old listings are fixed
    // function emergencyChangeRevenueTokens(uint32[] calldata _listingIds, address[] calldata _revenueTokens) external onlyOwnerOrDaoOrGameManager {
    //     for (uint256 i = 0; i < _listingIds.length; ) {
    //         GotchiLending storage listing_ = s.gotchiLendings[_listingIds[i]];
    //         require(listing_.timeCreated != 0, "GotchiLending: Listing does not exist");
    //         listing_.revenueTokens = _revenueTokens;
    //         unchecked {
    //             ++i;
    //         }
    //     }
    // }

    ///@notice Set the lending operator for a given token
    ///@dev Only the aavegotchi owner can set a lending operator
    ///@dev Can only be called when the token is unlocked to prevent borrowers from setting operators
    function setLendingOperator(
        address _lendingOperator,
        uint32 _tokenId,
        bool _isLendingOperator
    ) public onlyAavegotchiOwner(_tokenId) onlyUnlocked(_tokenId) {
        address sender = LibMeta.msgSender();
        s.lendingOperators[sender][_lendingOperator][_tokenId] = _isLendingOperator;
        emit LendingOperatorSet(sender, _lendingOperator, _tokenId, _isLendingOperator);
    }

    struct LendingOperatorInputs {
        uint32 _tokenId;
        bool _isLendingOperator;
    }

    function batchSetLendingOperator(address _lendingOperator, LendingOperatorInputs[] calldata _inputs) external {
        for (uint256 i = 0; i < _inputs.length; ) {
            setLendingOperator(_lendingOperator, _inputs[i]._tokenId, _inputs[i]._isLendingOperator);
            unchecked {
                ++i;
            }
        }
    }

    /*/////////////////////////////////////////////////////////////////////////////////
    ///                                    GETTERS                                  ///
    /////////////////////////////////////////////////////////////////////////////////*/

    function revenueTokenAllowed(address token) external view returns (bool) {
        return s.revenueTokenAllowed[token];
    }

    function getTokenBalancesInEscrow(uint32 _tokenId, address[] calldata _revenueTokens) external view returns (uint256[] memory revenueBalances) {
        revenueBalances = new uint256[](_revenueTokens.length);
        address escrow = LibAavegotchi.getAavegotchi(_tokenId).escrow;
        for (uint256 i = 0; i < _revenueTokens.length; ) {
            revenueBalances[i] = IERC20(_revenueTokens[i]).balanceOf(escrow);
            unchecked {
                ++i;
            }
        }
    }

    function isLendingOperator(address _lender, address _lendingOperator, uint32 _tokenId) external view returns (bool) {
        return s.lendingOperators[_lender][_lendingOperator][_tokenId];
    }

    // function getBorrowerTokenId(address _borrower) external view returns (uint32) {
    //     return LibGotchiLending.borrowerTokenId(_borrower);
    // }

    // function isBorrowing(address _borrower) external view returns (bool) {
    //     return LibGotchiLending.isBorrowing(_borrower);
    // }

    ///@notice Get an aavegotchi lending details through an identifier
    ///@dev Will throw if the lending does not exist
    ///@param _listingId The identifier of the lending to query
    ///@return listing_ A struct containing certain details about the lending like timeCreated etc
    ///@return aavegotchiInfo_ A struct containing details about the aavegotchi
    function getGotchiLendingListingInfo(
        uint32 _listingId
    ) external view returns (GotchiLending memory listing_, AavegotchiInfo memory aavegotchiInfo_) {
        listing_ = LibGotchiLending.getListing(_listingId);
        aavegotchiInfo_ = LibAavegotchi.getAavegotchi(listing_.erc721TokenId);
    }

    ///@notice Get an ERC721 lending details through an identifier
    ///@dev Will throw if the lending does not exist
    ///@param _listingId The identifier of the lending to query
    ///@return listing_ A struct containing certain details about the ERC721 lending like timeCreated etc
    function getLendingListingInfo(uint32 _listingId) external view returns (GotchiLending memory listing_) {
        listing_ = LibGotchiLending.getListing(_listingId);
    }

    ///@notice Get an aavegotchi lending details through an NFT
    ///@dev Will throw if the lending does not exist
    ///@param _erc721TokenId The identifier of the NFT associated with the lending
    ///@return listing_ A struct containing certain details about the lending associated with an NFT of contract identifier `_erc721TokenId`
    function getGotchiLendingFromToken(uint32 _erc721TokenId) external view returns (GotchiLending memory listing_) {
        listing_ = LibGotchiLending.getListing(s.aavegotchiToListingId[_erc721TokenId]);
    }

    function getGotchiLendingIdByToken(uint32 _erc721TokenId) external view returns (uint32) {
        return s.aavegotchiToListingId[_erc721TokenId];
    }

    ///@notice Query a certain amount of aavegotchi lending listings created by an address
    ///@param _lender Creator of the listings to query
    ///@param _status Status of the listings to query, "listed" or "agreed"
    ///@param _length How many aavegotchi listings to return
    ///@return listings_ An array of lending
    function getOwnerGotchiLendings(address _lender, bytes32 _status, uint256 _length) external view returns (GotchiLending[] memory listings_) {
        uint32 listingId = s.aavegotchiLenderLendingHead[_lender][_status];
        listings_ = new GotchiLending[](_length);
        uint256 listIndex;
        for (; listingId != 0 && listIndex < _length; ) {
            listings_[listIndex] = LibGotchiLending.getListing(listingId);
            listingId = s.aavegotchiLenderLendingListItem[_status][listingId].childListingId;
            unchecked {
                ++listIndex;
            }
        }
        assembly {
            mstore(listings_, listIndex)
        }
    }

    ///@notice Query a certain amount of aavegotchi lending listings created by an address
    ///@dev We don't care that this can loop forever since it's just an external view function
    function getOwnerGotchiLendingsLength(address _lender, bytes32 _status) external view returns (uint256) {
        uint32 listingId = s.aavegotchiLenderLendingHead[_lender][_status];
        uint256 length = 0;
        for (; listingId != 0; ) {
            listingId = s.aavegotchiLenderLendingListItem[_status][listingId].childListingId;
            unchecked {
                ++length;
            }
        }
        return length;
    }

    ///@notice Query a certain amount of aavegotchi lending listings
    ///@param _status Status of the listings to query, "listed" or "agreed"
    ///@param _length How many listings to return
    ///@return listings_ An array of lending
    function getGotchiLendings(bytes32 _status, uint256 _length) external view returns (GotchiLending[] memory listings_) {
        uint32 listingId = s.gotchiLendingHead[_status];
        listings_ = new GotchiLending[](_length);
        uint256 listIndex;
        for (; listingId != 0 && listIndex < _length; ) {
            listings_[listIndex] = LibGotchiLending.getListing(listingId);
            listingId = s.gotchiLendingListItem[_status][listingId].childListingId;
            unchecked {
                ++listIndex;
            }
        }
        assembly {
            mstore(listings_, listIndex)
        }
    }

    function getLentTokenIdsOfLender(address _lender) external view returns (uint32[] memory tokenIds_) {
        tokenIds_ = s.lentTokenIds[_lender];
    }

    function balanceOfLentGotchis(address _lender) external view returns (uint256 balance_) {
        balance_ = s.lentTokenIds[_lender].length;
    }

    function getGotchiLendingsLength() external view returns (uint256) {
        return s.nextGotchiListingId;
    }

    function isAavegotchiLent(uint32 _erc721TokenId) external view returns (bool) {
        return LibGotchiLending.isAavegotchiLent(_erc721TokenId);
    }

    function isAavegotchiListed(uint32 _erc721TokenId) external view returns (bool) {
        return LibGotchiLending.isAavegotchiListed(_erc721TokenId);
    }

    function getLendingPermissionBitmap(uint32 _listingId) external view returns (uint256) {
        return s.gotchiLendings[_listingId].permissions;
    }

    function getAllLendingPermissions(uint32 _listingId) external view returns (uint8[32] memory permissions_) {
        permissions_ = LibBitmapHelpers.getAllNumbers(s.gotchiLendings[_listingId].permissions);
    }

    function getLendingPermissionModifier(uint32 _listingId, uint8 _permissionIndex) public view returns (uint8) {
        return LibBitmapHelpers.getValueInByte(_permissionIndex, s.gotchiLendings[_listingId].permissions);
    }

    //simple check to see if a lending listing permission is set to none
    function lendingPermissionSetToNone(uint32 _listingId) public view returns (bool) {
        return getLendingPermissionModifier(_listingId, 0) == 0;
    }
}
