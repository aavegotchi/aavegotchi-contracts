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
    event GotchiLendingAdd(uint256 indexed lendingId);
    event GotchiLendingExecute(uint256 indexed lendingId);
    event GotchiLendingClaim(uint256 indexed lendingId, address[] tokenAddresses, uint256[] amounts);
    event GotchiLendingEnd(uint256 indexed lendingId);

    ///@notice Get an aavegotchi lending details through an identifier
    ///@dev Will throw if the lending does not exist
    ///@param _lendingId The identifier of the lending to query
    ///@return lending_ A struct containing certain details about the lending like timeCreated etc
    ///@return aavegotchiInfo_ A struct containing details about the aavegotchi
    function getGotchiLendingInfo(uint256 _lendingId) external view returns (GotchiLending memory lending_, AavegotchiInfo memory aavegotchiInfo_) {
        lending_ = s.gotchiLendings[_lendingId];
        require(lending_.timeCreated != 0, "GotchiLending: lending does not exist");
        aavegotchiInfo_ = LibAavegotchi.getAavegotchi(lending_.erc721TokenId);
    }

    ///@notice Get an ERC721 lending details through an identifier
    ///@dev Will throw if the lending does not exist
    ///@param _lendingId The identifier of the lending to query
    ///@return lending_ A struct containing certain details about the ERC721 lending like timeCreated etc
    function getGotchiLending(uint256 _lendingId) external view returns (GotchiLending memory lending_) {
        lending_ = s.gotchiLendings[_lendingId];
        require(lending_.timeCreated != 0, "GotchiLending: lending does not exist");
    }

    ///@notice Get an aavegotchi lending details through an NFT
    ///@dev Will throw if the lending does not exist
    ///@param _erc721TokenId The identifier of the NFT associated with the lending
    ///@return lending_ A struct containing certain details about the lending associated with an NFT of contract identifier `_erc721TokenId`
    function getGotchiLendingFromToken(uint256 _erc721TokenId) external view returns (GotchiLending memory lending_) {
        uint256 lendingId = s.aavegotchiToLendingId[_erc721TokenId];
        require(lendingId != 0, "GotchiLending: lending doesn't exist");
        lending_ = s.gotchiLendings[lendingId];
    }

    ///@notice Query a certain amount of aavegotchi lendings created by an address
    ///@param _lender Creator of the lendings to query
    ///@param _status Status of the lendings to query, "listed" or "agreed"
    ///@param _length How many aavegotchi lendings to return
    ///@return lendings_ An array of lending
    function getOwnerGotchiLendings(
        address _lender,
        bytes32 _status,
        uint256 _length
    ) external view returns (GotchiLending[] memory lendings_) {
        uint256 lendingId = s.aavegotchiLenderLendingHead[_lender][_status];
        lendings_ = new GotchiLending[](_length);
        uint256 listIndex;
        for (; lendingId != 0 && listIndex < _length; listIndex++) {
            lendings_[listIndex] = s.gotchiLendings[lendingId];
            lendingId = s.aavegotchiLenderLendingListItem[_status][lendingId].childLendingId;
        }
        assembly {
            mstore(lendings_, listIndex)
        }
    }

    ///@notice Query a certain amount of aavegotchi lendings
    ///@param _status Status of the lendings to query, "listed" or "agreed"
    ///@param _length How many lendings to return
    ///@return lendings_ An array of lending
    function getGotchiLendings(bytes32 _status, uint256 _length) external view returns (GotchiLending[] memory lendings_) {
        uint256 lendingId = s.gotchiLendingHead[_status];
        lendings_ = new GotchiLending[](_length);
        uint256 listIndex;
        for (; lendingId != 0 && listIndex < _length; listIndex++) {
            lendings_[listIndex] = s.gotchiLendings[lendingId];
            lendingId = s.gotchiLendingListItem[_status][lendingId].childLendingId;
        }
        assembly {
            mstore(lendings_, listIndex)
        }
    }

    function isAavegotchiLent(uint256 _erc721TokenId) external view returns (bool) {
        return LibGotchiLending.isAavegotchiLent(_erc721TokenId);
    }

    ///@notice Allow an aavegotchi lender to add request for lending
    ///@dev If the lending request exist, cancel it and replaces it with the new one
    ///@dev If the lending is active, unable to cancel
    ///@param _erc721TokenId The identifier of the NFT to lend
    ///@param _initialCost The lending fee of the aavegotchi in $GHST
    ///@param _period The lending period of the aavegotchi, unit: second
    ///@param _revenueSplit The revenue split of the lending, 3 values, sum of the should be 100
    ///@param _originalOwner The account for original owner, can be address(0) if original owner is lender
    ///@param _thirdParty The 3rd account for receive revenue split, can be address(0)
    ///@param _whitelistId The identifier of whitelist for agree lending, if 0, allow everyone
    function addGotchiLending(
        uint256 _erc721TokenId,
        uint256 _initialCost,
        uint256 _period,
        uint256[3] calldata _revenueSplit,
        address _originalOwner,
        address _thirdParty,
        uint256 _whitelistId,
        address[] calldata _includes
    ) external {
        address sender = LibMeta.msgSender();
        require(IERC721(address(this)).ownerOf(_erc721TokenId) == sender, "GotchiLending: Not owner of aavegotchi");
        require(_period > 0, "GotchiLending: period should be larger than 0");
        require(_revenueSplit[0] + _revenueSplit[1] + _revenueSplit[2] == 100, "GotchiLending: sum of revenue split should be 100");
        if (_thirdParty == address(0)) {
            require(_revenueSplit[2] == 0, "GotchiLending: revenue split for invalid thirdParty should be zero");
        }
        require((s.whitelists.length >= _whitelistId) || (_whitelistId == 0), "GotchiLending: whitelist not found");

        require(s.aavegotchis[_erc721TokenId].status == LibAavegotchi.STATUS_AAVEGOTCHI, "GotchiLending: Only aavegotchi available");

        uint256 oldLendingId = s.aavegotchiToLendingId[_erc721TokenId];
        if (oldLendingId != 0) {
            LibGotchiLending.cancelGotchiLending(oldLendingId, sender);
        } else {
            require(s.aavegotchis[_erc721TokenId].locked == false, "GotchiLending: Only callable on unlocked Aavegotchis");
        }

        s.nextGotchiLendingId++;
        uint256 lendingId = s.nextGotchiLendingId;

        s.aavegotchiToLendingId[_erc721TokenId] = lendingId;
        s.gotchiLendings[lendingId] = GotchiLending({
            lendingId: lendingId,
            initialCost: _initialCost,
            period: _period,
            revenueSplit: _revenueSplit,
            lender: sender,
            borrower: address(0),
            originalOwner: _originalOwner,
            thirdParty: _thirdParty,
            erc721TokenId: _erc721TokenId,
            whitelistId: _whitelistId,
            includeList: _includes,
            timeCreated: block.timestamp,
            timeAgreed: 0,
            lastClaimed: 0,
            canceled: false,
            completed: false
        });

        LibGotchiLending.addLendingListItem(sender, lendingId, "listed");

        emit GotchiLendingAdd(lendingId);

        // Lock Aavegotchis when lending is created
        s.aavegotchis[_erc721TokenId].locked = true;
    }

    ///@notice Allow an aavegotchi lender to cancel his NFT lending by providing the NFT contract address and identifier
    ///@param _erc721TokenId The identifier of the NFT to be delisted from lending
    function cancelGotchiLendingByToken(uint256 _erc721TokenId) external {
        LibGotchiLending.cancelGotchiLendingFromToken(_erc721TokenId, LibMeta.msgSender());
    }

    ///@notice Allow an aavegotchi lender to cancel his NFT lending through the lendingID
    ///@param _lendingId The identifier of the lending to be cancelled
    function cancelGotchiLending(uint256 _lendingId) external {
        LibGotchiLending.cancelGotchiLending(_lendingId, LibMeta.msgSender());
    }

    ///@notice Allow a borrower to agree an lending for the NFT
    ///@dev Will throw if the NFT has been lent or if the lending has been canceled already
    ///@param _lendingId The identifier of the lending to agree
    function agreeGotchiLending(
        uint256 _lendingId,
        uint256 _erc721TokenId,
        uint256 _initialCost,
        uint256 _period,
        uint256[3] calldata _revenueSplit
    ) external {
        GotchiLending storage lending = s.gotchiLendings[_lendingId];
        require(lending.timeCreated != 0, "GotchiLending: lending not found");
        require(lending.timeAgreed == 0, "GotchiLending: lending already agreed");
        require(lending.canceled == false, "GotchiLending: lending canceled");
        require(lending.erc721TokenId == _erc721TokenId, "GotchiLending: Invalid token id");
        require(lending.initialCost == _initialCost, "GotchiLending: Invalid initial cost");
        require(lending.period == _period, "GotchiLending: Invalid lending period");
        for (uint256 i; i < 3; i++) {
            require(lending.revenueSplit[i] == _revenueSplit[i], "GotchiLending: Invalid revenue split");
        }
        address borrower = LibMeta.msgSender();
        address lender = lending.lender;
        require(lender != borrower, "GotchiLending: borrower can't be lender");
        if (lending.whitelistId > 0) {
            require(s.isWhitelisted[lending.whitelistId][borrower], "GotchiLending: Not whitelisted address");
        }

        if (lending.initialCost > 0) {
            require(IERC20(s.ghstContract).balanceOf(borrower) >= lending.initialCost, "GotchiLending: not enough GHST");
            LibERC20.transferFrom(s.ghstContract, borrower, lender, lending.initialCost);
        }

        lending.borrower = borrower;
        lending.timeAgreed = block.timestamp;

        LibGotchiLending.removeLendingListItem(lender, _lendingId, "listed");
        LibGotchiLending.addLendingListItem(lender, _lendingId, "agreed");

        uint256 tokenId = lending.erc721TokenId;
        s.lentTokenIdIndexes[lender][tokenId] = s.lentTokenIds[lender].length;
        s.lentTokenIds[lender].push(tokenId);

        LibAavegotchi.transfer(lender, borrower, tokenId);

        // set lender as pet operator
        s.petOperators[borrower][lender] = true;

        emit GotchiLendingExecute(_lendingId);
    }

    ///@notice Allow to claim revenue from the lending
    ///@dev Will throw if the NFT has not been lent or if the lending has been canceled already
    ///@param _tokenId The identifier of the lent aavegotchi to claim
    ///@param _revenueTokens The address array of the revenue tokens to claim; FUD, FOMO, ALPHA, KEK, then GHST
    function claimGotchiLending(uint256 _tokenId, address[] calldata _revenueTokens) external {
        uint256 lendingId = s.aavegotchiToLendingId[_tokenId];
        require(lendingId != 0, "GotchiLending: lending not found");
        GotchiLending storage lending = s.gotchiLendings[lendingId];

        address sender = LibMeta.msgSender();
        require((lending.lender == sender) || (lending.borrower == sender), "GotchiLending: only lender or borrower can claim");

        uint256[] memory amounts = LibGotchiLending.claimGotchiLending(lendingId, _revenueTokens);

        emit GotchiLendingClaim(lendingId, _revenueTokens, amounts);
    }

    ///@notice Allow a lender to claim revenue from the lending
    ///@dev Will throw if the NFT has not been lent or if the lending has been canceled already
    ///@param _tokenId The identifier of the lent aavegotchi to claim
    ///@param _revenueTokens The address array of the revenue tokens to claim; FUD, FOMO, ALPHA, KEK, then GHST
    function claimAndEndGotchiLending(uint256 _tokenId, address[] calldata _revenueTokens) external {
        uint256 lendingId = s.aavegotchiToLendingId[_tokenId];
        require(lendingId != 0, "GotchiLending: lending not found");
        GotchiLending storage lending = s.gotchiLendings[lendingId];

        address sender = LibMeta.msgSender();
        address lender = lending.lender;
        address borrower = lending.borrower;
        require((lender == sender) || (borrower == sender), "GotchiLending: only lender or borrower can claim and end agreement");
        require(lending.timeAgreed + lending.period <= block.timestamp, "GotchiLending: not allowed during agreement");

        uint256[] memory amounts = LibGotchiLending.claimGotchiLending(lendingId, _revenueTokens);

        // end lending agreement
        s.aavegotchis[_tokenId].locked = false;
        LibAavegotchi.transfer(borrower, lender, _tokenId);

        lending.completed = true;
        s.aavegotchiToLendingId[_tokenId] = 0;

        LibGotchiLending.removeLentAavegotchi(_tokenId, lender);
        LibGotchiLending.removeLendingListItem(lender, lendingId, "agreed");

        emit GotchiLendingClaim(lendingId, _revenueTokens, amounts);
        emit GotchiLendingEnd(lendingId);
    }
}
