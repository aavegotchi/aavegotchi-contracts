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
    ///@notice Allow an aavegotchi lender (msg sender) to add request for lending
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
        uint8[3] calldata _revenueSplit,
        address _originalOwner, // Need to take care with this one
        address _thirdParty,
        uint32 _whitelistId,
        address[] calldata _revenueTokens
    ) external onlyAavegotchiOwner(_erc721TokenId) {
        LibGotchiLending._addGotchiLending(
            LibMeta.msgSender(),
            _erc721TokenId,
            _initialCost,
            _period,
            _revenueSplit,
            _originalOwner,
            _thirdParty,
            _whitelistId,
            _revenueTokens
        );
    }

    struct AddGotchiLendingStruct {
        uint32 tokenId;
        uint96 initialCost;
        uint32 period;
        uint8[3] revenueSplit;
        address originalOwner;
        address thirdParty;
        uint32 whitelistId;
        address[] revenueTokens;
    }

    function batchAddGotchiLending(AddGotchiLendingStruct[] calldata listings) external {
        address sender = LibMeta.msgSender();
        for (uint256 i = 0; i < listings.length; ) {
            LibGotchiLending._addGotchiLending(
                sender,
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

    ///@notice Allow an aavegotchi lender to cancel his NFT lending by providing the NFT contract address and identifier
    ///@param _erc721TokenId The identifier of the NFT to be delisted from lending
    function cancelGotchiLendingByToken(uint32 _erc721TokenId) external {
        LibGotchiLending.cancelGotchiLendingFromToken(_erc721TokenId, LibMeta.msgSender());
    }

    ///@notice Allow an aavegotchi lender to cancel his NFT lending through the listingId
    ///@param _listingId The identifier of the lending to be cancelled
    function cancelGotchiLending(uint32 _listingId) external {
        LibGotchiLending.cancelGotchiLending(_listingId, LibMeta.msgSender());
    }

    function batchCancelGotchiLending(uint32[] calldata _listingIds) external {
        for (uint256 i = 0; i < _listingIds.length; i++) {
            LibGotchiLending.cancelGotchiLending(_listingIds[i], LibMeta.msgSender());
        }
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

    struct AgreeGotchiLendingStruct {
        uint32 listingId;
        uint32 tokenId;
        uint96 initialCost;
        uint32 period;
        uint8[3] revenueSplit;
    }

    function batchAgreeGotchiLending(AgreeGotchiLendingStruct[] calldata inputs) external {
        address sender = LibMeta.msgSender();
        for (uint256 i = 0; i < inputs.length; ) {
            LibGotchiLending._agreeGotchiLending(
                sender,
                inputs[i].listingId,
                inputs[i].tokenId,
                inputs[i].initialCost,
                inputs[i].period,
                inputs[i].revenueSplit
            );
            unchecked {
                ++i;
            }
        }
    }

    ///@notice Allow to claim revenue from the lending
    ///@dev Will throw if the NFT has not been lent or if the lending has been canceled already
    ///@param _tokenId The identifier of the lent aavegotchi to claim

    function claimGotchiLending(uint32 _tokenId) external {
        uint32 listingId = LibGotchiLending.tokenIdToListingId(_tokenId);
        GotchiLending storage lending = s.gotchiLendings[listingId];
        address sender = LibMeta.msgSender();
        require((lending.lender == sender) || (lending.borrower == sender), "GotchiLending: Only lender or borrower can claim");
        LibGotchiLending.claimGotchiLending(listingId);
    }

    ///@notice Allow a lender to claim revenue from the lending
    ///@dev Will throw if the NFT has not been lent or if the lending has been canceled already
    ///@param _tokenId The identifier of the lent aavegotchi to claim

    function claimAndEndGotchiLending(uint32 _tokenId) external {
        uint32 listingId = LibGotchiLending.tokenIdToListingId(_tokenId);
        GotchiLending storage lending = s.gotchiLendings[listingId];

        address lender = lending.lender;
        address borrower = lending.borrower;
        uint32 period = lending.period < 2_592_000 ? lending.period : 2_592_000;

        address sender = LibMeta.msgSender();
        require((lender == sender) || (borrower == sender), "GotchiLending: Only lender or borrower can claim and end agreement");
        require(borrower == sender || lending.timeAgreed + period <= block.timestamp, "GotchiLending: Not allowed during agreement");

        LibGotchiLending.claimGotchiLending(listingId);
        LibGotchiLending.endGotchiLending(lending);
    }
}
