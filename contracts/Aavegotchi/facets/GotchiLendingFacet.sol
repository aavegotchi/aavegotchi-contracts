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
    ///@notice Allow an aavegotchi lender (msg sender) or their lending operator to add request for lending
    ///@dev If the lending request exist, cancel it and replaces it with the new one
    ///@dev If the lending is active, unable to cancel
    ///@param _erc721TokenId The identifier of the NFT to lend
    ///@param _initialCost The lending fee of the aavegotchi in $GHST
    ///@param _period The lending period of the aavegotchi, unit: second
    ///@param _revenueSplit The revenue split of the lending, 3 values, sum of the should be 100
    ///@param _originalOwner The account for original owner, can be set to another address if the owner wishes to have profit split there.
    ///@param _thirdParty The 3rd account for receive revenue split, can be address(0)
    ///@param _whitelistId The identifier of whitelist for agree lending, if 0, allow everyone
    function addGotchiLending(
        uint32 _erc721TokenId,
        uint96 _initialCost,
        uint32 _period,
        uint8[3] memory _revenueSplit,
        address _originalOwner,
        address _thirdParty,
        uint32 _whitelistId,
        address[] memory _revenueTokens
    ) public {
        address sender = LibMeta.msgSender();
        address tokenOwner = s.aavegotchis[_erc721TokenId].owner;
        bool senderIsLendingOperator = s.isLendingOperator[tokenOwner][sender][_erc721TokenId];
        require(tokenOwner == sender || senderIsLendingOperator, "Only the owner or a lending operator can add a lending request");
        LibGotchiLending.AddGotchiLendingStruct memory addLendingStruct = LibGotchiLending.AddGotchiLendingStruct({
            lender: tokenOwner,
            tokenId: _erc721TokenId,
            initialCost: _initialCost,
            period: _period,
            revenueSplit: _revenueSplit,
            originalOwner: _originalOwner,
            thirdParty: _thirdParty,
            whitelistId: _whitelistId,
            revenueTokens: _revenueTokens
        });
        LibGotchiLending._addGotchiLending(addLendingStruct);
    }

    ///@notice Allow an aavegotchi lender or lending operator to cancel his NFT lending through the listingId
    ///@param _listingId The identifier of the lending to be cancelled
    function cancelGotchiLending(uint32 _listingId) public {
        GotchiLending storage lending = s.gotchiLendings[_listingId];
        address sender = LibMeta.msgSender();
        address lender = lending.lender;
        require(
            lender == sender || s.isLendingOperator[lender][sender][lending.erc721TokenId],
            "Only the lender or lending operator can cancel the lending"
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
        LibGotchiLending._agreeGotchiLending(LibMeta.msgSender(), _listingId, _erc721TokenId, _initialCost, _period, _revenueSplit);
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
            (lender == sender) || (lending.borrower == sender) || s.isLendingOperator[lender][sender][_tokenId],
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
        uint32 period = lending.period < 2_592_000 ? lending.period : 2_592_000;

        address sender = LibMeta.msgSender();
        require(
            (lender == sender) || (borrower == sender) || s.isLendingOperator[lender][sender][_tokenId],
            "GotchiLending: Only lender or borrower or lending operator can claim and end agreement"
        );
        require(borrower == sender || lending.timeAgreed + period <= block.timestamp, "GotchiLending: Agreement not over and not borrower");

        LibGotchiLending.claimGotchiLending(listingId);
        LibGotchiLending.endGotchiLending(lending);
    }

    ///@notice Allows a lender to extend a current listing
    function extendGotchiLending(uint32 _tokenId, uint32 extension) public {
        GotchiLending storage lending = s.gotchiLendings[LibGotchiLending.tokenIdToListingId(_tokenId)];
        address lender = lending.lender;
        address sender = LibMeta.msgSender();
        require(lender == sender || s.isLendingOperator[lender][sender][_tokenId], "GotchiLending: Only lender or lending operator can extend");
        require(lending.timeAgreed != 0 && !lending.completed, "GotchiLending: Cannot extend a listing that has not been borrowed");
        lending.period += extension;
    }

    struct AddGotchiLending {
        uint32 tokenId;
        uint96 initialCost;
        uint32 period;
        uint8[3] revenueSplit;
        address originalOwner;
        address thirdParty;
        uint32 whitelistId;
        address[] revenueTokens;
    }

    function batchAddGotchiLending(AddGotchiLending[] calldata listings) external {
        for (uint256 i = 0; i < listings.length; ) {
            addGotchiLending(
                listings[i].tokenId,
                listings[i].initialCost,
                listings[i].period,
                listings[i].revenueSplit,
                listings[i].originalOwner,
                listings[i].thirdParty,
                listings[i].whitelistId,
                listings[i].revenueTokens
            );
            unchecked {
                ++i;
            }
        }
    }

    function batchCancelGotchiLending(uint32[] calldata _listingIds) external {
        for (uint256 i = 0; i < _listingIds.length; ) {
            cancelGotchiLending(_listingIds[i]);
            unchecked {
                ++i;
            }
        }
    }

    ///@notice Allow an aavegotchi lender to cancel his NFT lending by providing the NFT contract address and identifier
    ///@param _erc721TokenId The identifier of the NFT to be delisted from lending
    function cancelGotchiLendingByToken(uint32 _erc721TokenId) public {
        cancelGotchiLending(s.aavegotchiToListingId[_erc721TokenId]);
    }

    function batchCancelGotchiLendingByToken(uint32[] calldata _erc721TokenIds) external {
        for (uint256 i = 0; i < _erc721TokenIds.length; ) {
            cancelGotchiLendingByToken(_erc721TokenIds[i]);
            unchecked {
                ++i;
            }
        }
    }

    function batchClaimGotchiLending(uint32[] calldata _tokenIds) external {
        for (uint256 i = 0; i < _tokenIds.length; ) {
            claimGotchiLending(_tokenIds[i]);
            unchecked {
                ++i;
            }
        }
    }

    function batchClaimAndEndGotchiLending(uint32[] calldata _tokenIds) external {
        for (uint256 i = 0; i < _tokenIds.length; ) {
            claimAndEndGotchiLending(_tokenIds[i]);
            unchecked {
                ++i;
            }
        }
    }

    ///@notice Allows a lender or pet operator to end the listing and relist with the same parameters
    function claimAndEndAndRelistGotchiLending(uint32 _tokenId) public {
        GotchiLending memory lending = s.gotchiLendings[LibGotchiLending.tokenIdToListingId(_tokenId)];
        claimAndEndGotchiLending(_tokenId);
        addGotchiLending(
            lending.erc721TokenId,
            lending.initialCost,
            lending.period,
            lending.revenueSplit,
            lending.originalOwner,
            lending.thirdParty,
            lending.whitelistId,
            lending.revenueTokens
        );
    }

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

    function batchRenewGotchiLending(BatchRenew[] calldata _batchRenewParams) external {
        for (uint256 i = 0; i < _batchRenewParams.length; ) {
            extendGotchiLending(_batchRenewParams[i].tokenId, _batchRenewParams[i].extension);
            unchecked {
                ++i;
            }
        }
    }
}
