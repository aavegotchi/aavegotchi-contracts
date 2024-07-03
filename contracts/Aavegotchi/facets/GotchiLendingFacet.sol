// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAavegotchi, AavegotchiInfo} from "../libraries/LibAavegotchi.sol";
import {IERC721} from "../../shared/interfaces/IERC721.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibGotchiLending} from "../libraries/LibGotchiLending.sol";
import {Modifiers, GotchiLending} from "../libraries/LibAppStorage.sol";

contract GotchiLendingFacet is Modifiers {
    ///@param _erc721TokenId The identifier of the NFT to lend
    ///@param _initialCost The lending fee of the aavegotchi in $GHST
    ///@param _period The lending period of the aavegotchi, unit: second
    ///@param _revenueSplit The revenue split of the lending, 3 values, sum of the should be 100
    ///@param _originalOwner The account for original owner, can be set to another address if the owner wishes to have profit split there.
    ///@param _thirdParty The 3rd account for receive revenue split, can be address(0)
    ///@param _whitelistId The identifier of whitelist for agree lending, if 0, allow everyone
    struct AddGotchiListing {
        uint32 tokenId;
        uint96 initialCost;
        uint32 period;
        uint8[3] revenueSplit;
        address originalOwner;
        address thirdParty;
        uint32 whitelistId;
        address[] revenueTokens;
        uint256 permissions;
    }

    ///@notice Allow an aavegotchi lender (msg sender) or their lending operator to add request for lending
    ///@dev If the lending request exist, cancel it and replaces it with the new one
    ///@dev If the lending is active, unable to cancel
    function addGotchiListing(AddGotchiListing memory p) public {
        address sender = LibMeta.msgSender();
        address tokenOwner = s.aavegotchis[p.tokenId].owner;
        bool isLendingOperator = s.lendingOperators[tokenOwner][sender][p.tokenId];
        require(tokenOwner == sender || isLendingOperator, "GotchiLending: Only the owner or a lending operator can add a lending request");
        LibGotchiLending.LibAddGotchiLending memory addLendingStruct = LibGotchiLending.LibAddGotchiLending({
            lender: tokenOwner,
            tokenId: p.tokenId,
            initialCost: p.initialCost,
            period: p.period,
            revenueSplit: p.revenueSplit,
            originalOwner: p.originalOwner,
            thirdParty: p.thirdParty,
            whitelistId: p.whitelistId,
            revenueTokens: p.revenueTokens,
            permissions: p.permissions
        });
        LibGotchiLending._addGotchiLending(addLendingStruct);
    }

    ///@notice Allow an aavegotchi lender or lending operator to cancel his NFT lending through the listingId
    ///@param _listingId The identifier of the lending to be cancelled
    function cancelGotchiLending(uint32 _listingId) public {
        GotchiLending storage lending = s.gotchiLendings[_listingId];
        require(lending.timeCreated != 0, "GotchiLending: Listing not found");
        address sender = LibMeta.msgSender();
        address lender = lending.lender;
        require(
            lender == sender || s.lendingOperators[lender][sender][lending.erc721TokenId],
            "GotchiLending: Only the lender or lending operator can cancel the lending"
        );
        LibGotchiLending.cancelGotchiLending(_listingId, lender);
    }

    ///@notice Allow a borrower to agree an lending for the NFT
    ///@dev Will throw if the NFT has been lent or if the lending has been canceled already
    ///@param _listingId The identifier of the lending to agree
    function agreeGotchiLending(
        uint32 _listingId,
        uint32 _erc721TokenId,
        uint96 _initialCost,
        uint32 _period,
        uint8[3] calldata _revenueSplit
    ) external {
        address sender = LibMeta.msgSender();
        //LibGotchiLending.addBorrowerTokenId(sender, _erc721TokenId); // This functions as a check for whether the sender already has a borrow after the upgrade
        LibGotchiLending._agreeGotchiLending(sender, _listingId, _erc721TokenId, _initialCost, _period, _revenueSplit);
    }

    ///@notice Allow to claim revenue from the lending
    ///@dev Will throw if the NFT has not been lent or if the lending has been canceled already
    ///@param _tokenId The identifier of the lent aavegotchi to claim
    function claimGotchiLending(uint32 _tokenId) public {
        uint32 listingId = LibGotchiLending.tokenIdToListingId(_tokenId);
        GotchiLending storage lending = s.gotchiLendings[listingId];
        address lender = lending.lender;
        address sender = LibMeta.msgSender();
        require(
            (lender == sender) || (lending.borrower == sender) || s.lendingOperators[lender][sender][_tokenId],
            "GotchiLending: Only lender or borrower or lending operator can claim"
        );
        LibGotchiLending.claimGotchiLending(listingId);
    }

    ///@notice Allow a lender or borrower or lending operator to claim revenue from the lending and end the listing
    ///@dev Will throw if the NFT has not been lent or if the lending has been canceled already
    ///@param _tokenId The identifier of the lent aavegotchi to claim
    function claimAndEndGotchiLending(uint32 _tokenId) public {
        uint32 listingId = LibGotchiLending.tokenIdToListingId(_tokenId);
        GotchiLending storage lending = s.gotchiLendings[listingId];

        address lender = lending.lender;
        address borrower = lending.borrower;
        address sender = LibMeta.msgSender();
        uint32 period = lending.period < 2_592_000 ? lending.period : 2_592_000;
        require(
            (lender == sender) || (borrower == sender) || s.lendingOperators[lender][sender][_tokenId],
            "GotchiLending: Only lender or borrower or lending operator can claim and end agreement"
        );
        require(borrower == sender || lending.timeAgreed + period <= block.timestamp, "GotchiLending: Agreement not over and not borrower");

        //LibGotchiLending.removeBorrowerTokenId(borrower, _tokenId); // Free up the borrower to borrow another gotchi
        LibGotchiLending.claimGotchiLending(listingId);
        LibGotchiLending.endGotchiLending(lending);
    }

    ///@notice Allows a lender or lending operator to extend a current listing
    function extendGotchiLending(uint32 _tokenId, uint32 extension) public {
        GotchiLending storage lending = s.gotchiLendings[LibGotchiLending.tokenIdToListingId(_tokenId)];
        address lender = lending.lender;
        address sender = LibMeta.msgSender();
        require(lender == sender || s.lendingOperators[lender][sender][_tokenId], "GotchiLending: Only lender or lending operator can extend");
        require(lending.timeAgreed != 0 && !lending.completed, "GotchiLending: Cannot extend a listing that has not been borrowed");
        require(lending.period + extension < 2_592_000, "GotchiLending: Cannot extend a listing beyond the maximum period");
        lending.period += extension;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// From here on, functions require no checks as the functions they call take care of the checks
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    ///@notice Exists to keep the same function signature as previous
    function addGotchiLending(
        uint32 _erc721TokenId,
        uint96 _initialCost,
        uint32 _period,
        uint8[3] calldata _revenueSplit,
        address _originalOwner,
        address _thirdParty,
        uint32 _whitelistId,
        address[] calldata _revenueTokens,
        uint256 _permissions
    ) external {
        uint8[3] memory revenueSplit = _revenueSplit;
        address[] memory revenueTokens = _revenueTokens;
        AddGotchiListing memory listing = AddGotchiListing({
            tokenId: _erc721TokenId,
            initialCost: _initialCost,
            period: _period,
            revenueSplit: revenueSplit,
            originalOwner: _originalOwner,
            thirdParty: _thirdParty,
            whitelistId: _whitelistId,
            revenueTokens: revenueTokens,
            permissions: _permissions
        });
        addGotchiListing(listing);
    }

    ///@notice Allow an aavegotchi lender to cancel his NFT lending by providing the NFT contract address and identifier
    ///@param _erc721TokenId The identifier of the NFT to be delisted from lending
    function cancelGotchiLendingByToken(uint32 _erc721TokenId) public {
        cancelGotchiLending(s.aavegotchiToListingId[_erc721TokenId]);
    }

    ///@notice Allows a lender or pet operator to end the listing and relist with the same parameters
    function claimAndEndAndRelistGotchiLending(uint32 _tokenId) public {
        GotchiLending memory lending = s.gotchiLendings[LibGotchiLending.tokenIdToListingId(_tokenId)];
        claimAndEndGotchiLending(_tokenId);
        addGotchiListing(
            AddGotchiListing({
                tokenId: lending.erc721TokenId,
                initialCost: lending.initialCost,
                period: lending.period,
                revenueSplit: lending.revenueSplit,
                originalOwner: lending.originalOwner,
                thirdParty: lending.thirdParty,
                whitelistId: lending.whitelistId,
                revenueTokens: lending.revenueTokens,
                permissions: lending.permissions
            })
        );
    }

    ///@notice Add gotchi listings in batch
    function batchAddGotchiListing(AddGotchiListing[] memory listings) external {
        for (uint256 i = 0; i < listings.length; ) {
            addGotchiListing(listings[i]);
            unchecked {
                ++i;
            }
        }
    }

    ///@notice Cancel gotchi listings in batch by listing ID
    function batchCancelGotchiLending(uint32[] calldata _listingIds) external {
        for (uint256 i = 0; i < _listingIds.length; ) {
            cancelGotchiLending(_listingIds[i]);
            unchecked {
                ++i;
            }
        }
    }

    ///@notice Cancel gotchi listings in batch by token ID
    function batchCancelGotchiLendingByToken(uint32[] calldata _erc721TokenIds) external {
        for (uint256 i = 0; i < _erc721TokenIds.length; ) {
            cancelGotchiLendingByToken(_erc721TokenIds[i]);
            unchecked {
                ++i;
            }
        }
    }

    ///@notice Claim gotchi lendings in batch by token ID
    function batchClaimGotchiLending(uint32[] calldata _tokenIds) external {
        for (uint256 i = 0; i < _tokenIds.length; ) {
            claimGotchiLending(_tokenIds[i]);
            unchecked {
                ++i;
            }
        }
    }

    ///@notice Claim and end gotchi lendings in batch by token ID
    function batchClaimAndEndGotchiLending(uint32[] calldata _tokenIds) external {
        for (uint256 i = 0; i < _tokenIds.length; ) {
            claimAndEndGotchiLending(_tokenIds[i]);
            unchecked {
                ++i;
            }
        }
    }

    ///@notice Claim and end and relist gotchi lendings in batch by token ID
    function batchClaimAndEndAndRelistGotchiLending(uint32[] calldata _tokenIds) external {
        for (uint256 i = 0; i < _tokenIds.length; ) {
            claimAndEndAndRelistGotchiLending(_tokenIds[i]);
            unchecked {
                ++i;
            }
        }
    }

    struct BatchRenew {
        uint32 tokenId;
        uint32 extension;
    }

    ///@notice Extend gotchi listings in batch by token ID
    function batchExtendGotchiLending(BatchRenew[] calldata _batchRenewParams) external {
        for (uint256 i = 0; i < _batchRenewParams.length; ) {
            extendGotchiLending(_batchRenewParams[i].tokenId, _batchRenewParams[i].extension);
            unchecked {
                ++i;
            }
        }
    }
}
