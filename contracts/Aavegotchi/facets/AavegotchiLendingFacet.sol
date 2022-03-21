// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAavegotchi, AavegotchiInfo} from "../libraries/LibAavegotchi.sol";
import {IERC721} from "../../shared/interfaces/IERC721.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibAavegotchiLending} from "../libraries/LibAavegotchiLending.sol";
import {Modifiers, AavegotchiLending} from "../libraries/LibAppStorage.sol";

contract AavegotchiLendingFacet is Modifiers {
    event AavegotchiLendingAdd(uint256 indexed lendingId);
    event AavegotchiLendingExecute(uint256 indexed lendingId);
    event AavegotchiLendingClaim(uint256 indexed lendingId, address[] tokenAddresses, uint256[] amounts);
    event AavegotchiLendingEnd(uint256 indexed lendingId);

    ///@notice Get an aavegotchi lending details through an identifier
    ///@dev Will throw if the lending does not exist
    ///@param _lendingId The identifier of the lending to query
    ///@return lending_ A struct containing certain details about the lending like timeCreated etc
    ///@return aavegotchiInfo_ A struct containing details about the aavegotchi
    function getAavegotchiLendingInfo(uint256 _lendingId)
        external
        view
        returns (AavegotchiLending memory lending_, AavegotchiInfo memory aavegotchiInfo_)
    {
        lending_ = s.aavegotchiLendings[_lendingId];
        require(lending_.timeCreated != 0, "AavegotchiLending: lending does not exist");
        aavegotchiInfo_ = LibAavegotchi.getAavegotchi(lending_.erc721TokenId);
    }

    ///@notice Get an ERC721 lending details through an identifier
    ///@dev Will throw if the lending does not exist
    ///@param _lendingId The identifier of the lending to query
    ///@return lending_ A struct containing certain details about the ERC721 lending like timeCreated etc
    function getAavegotchiLending(uint256 _lendingId) external view returns (AavegotchiLending memory lending_) {
        lending_ = s.aavegotchiLendings[_lendingId];
        require(lending_.timeCreated != 0, "AavegotchiLending: lending does not exist");
    }

    ///@notice Get an aavegotchi lending details through an NFT
    ///@dev Will throw if the lending does not exist
    ///@param _erc721TokenId The identifier of the NFT associated with the lending
    ///@return lending_ A struct containing certain details about the lending associated with an NFT of contract identifier `_erc721TokenId`
    function getAavegotchiLendingFromToken(uint256 _erc721TokenId) external view returns (AavegotchiLending memory lending_) {
        uint256 lendingId = s.aavegotchiToLendingId[_erc721TokenId];
        require(lendingId != 0, "AavegotchiLending: lending doesn't exist");
        lending_ = s.aavegotchiLendings[lendingId];
    }

    ///@notice Query a certain amount of aavegotchi lendings created by an address
    ///@param _lender Creator of the lendings to query
    ///@param _status Status of the lendings to query, "listed" or "agreed"
    ///@param _length How many aavegotchi lendings to return
    ///@return lendings_ An array of lending
    function getOwnerAavegotchiLendings(
        address _lender,
        bytes32 _status,
        uint256 _length
    ) external view returns (AavegotchiLending[] memory lendings_) {
        uint256 lendingId = s.aavegotchiLenderLendingHead[_lender][_status];
        lendings_ = new AavegotchiLending[](_length);
        uint256 listIndex;
        for (; lendingId != 0 && listIndex < _length; listIndex++) {
            lendings_[listIndex] = s.aavegotchiLendings[lendingId];
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
    function getAavegotchiLendings(bytes32 _status, uint256 _length) external view returns (AavegotchiLending[] memory lendings_) {
        uint256 lendingId = s.aavegotchiLendingHead[_status];
        lendings_ = new AavegotchiLending[](_length);
        uint256 listIndex;
        for (; lendingId != 0 && listIndex < _length; listIndex++) {
            lendings_[listIndex] = s.aavegotchiLendings[lendingId];
            lendingId = s.aavegotchiLendingListItem[_status][lendingId].childLendingId;
        }
        assembly {
            mstore(lendings_, listIndex)
        }
    }

    function isAavegotchiLent(uint256 _erc721TokenId) external view returns (bool) {
        return LibAavegotchiLending.isAavegotchiLent(_erc721TokenId);
    }

    ///@notice Allow an aavegotchi lender to add request for lending
    ///@dev If the lending request exist, cancel it and replaces it with the new one
    ///@dev If the lending is active, unable to cancel
    ///@param _erc721TokenId The identifier of the NFT to rent
    ///@param _initialCost The lending fee of the aavegotchi in $GHST
    ///@param _period The lending period of the aavegotchi, unit: second
    ///@param _revenueSplit The revenue split of the lending, 3 values, sum of the should be 100
    ///@param _originalOwner The account for original owner, can be address(0) if original owner is lender
    ///@param _thirdParty The 3rd account for receive revenue split, can be address(0)
    ///@param _whitelistId The identifier of whitelist for agree lending, if 0, allow everyone
    function addAavegotchiLending(
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
        require(IERC721(address(this)).ownerOf(_erc721TokenId) == sender, "AavegotchiLending: Not owner of aavegotchi");
        require(_period > 0, "AavegotchiLending: period should be larger than 0");
        require(_revenueSplit[0] + _revenueSplit[1] + _revenueSplit[2] == 100, "AavegotchiLending: sum of revenue split should be 100");
        if (_thirdParty == address(0)) {
            require(_revenueSplit[2] == 0, "AavegotchiLending: revenue split for invalid thirdParty should be zero");
        }
        require((s.whitelists.length >= _whitelistId) || (_whitelistId == 0), "AavegotchiLending: whitelist not found");

        require(s.aavegotchis[_erc721TokenId].status == LibAavegotchi.STATUS_AAVEGOTCHI, "AavegotchiLending: Only aavegotchi available");

        uint256 oldLendingId = s.aavegotchiToLendingId[_erc721TokenId];
        if (oldLendingId != 0) {
            LibAavegotchiLending.cancelAavegotchiLending(oldLendingId, sender);
        } else {
            require(s.aavegotchis[_erc721TokenId].locked == false, "AavegotchiLending: Only callable on unlocked Aavegotchis");
        }

        s.nextAavegotchiLendingId++;
        uint256 lendingId = s.nextAavegotchiLendingId;

        s.aavegotchiToLendingId[_erc721TokenId] = lendingId;
        s.aavegotchiLendings[lendingId] = AavegotchiLending({
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

        LibAavegotchiLending.addLendingListItem(sender, lendingId, "listed");

        emit AavegotchiLendingAdd(lendingId);

        // Lock Aavegotchis when lending is created
        s.aavegotchis[_erc721TokenId].locked = true;
    }

    ///@notice Allow an aavegotchi lender to cancel his NFT lending by providing the NFT contract address and identifier
    ///@param _erc721TokenId The identifier of the NFT to be delisted from lending
    function cancelAavegotchiLendingByToken(uint256 _erc721TokenId) external {
        LibAavegotchiLending.cancelAavegotchiLendingFromToken(_erc721TokenId, LibMeta.msgSender());
    }

    ///@notice Allow an aavegotchi lender to cancel his NFT lending through the lendingID
    ///@param _lendingId The identifier of the lending to be cancelled
    function cancelAavegotchiLending(uint256 _lendingId) external {
        LibAavegotchiLending.cancelAavegotchiLending(_lendingId, LibMeta.msgSender());
    }

    ///@notice Allow a borrower to agree an lending for the NFT
    ///@dev Will throw if the NFT has been lent or if the lending has been canceled already
    ///@param _lendingId The identifier of the lending to agree
    function agreeAavegotchiLending(
        uint256 _lendingId,
        uint256 _erc721TokenId,
        uint256 _initialCost,
        uint256 _period,
        uint256[3] calldata _revenueSplit
    ) external {
        AavegotchiLending storage lending = s.aavegotchiLendings[_lendingId];
        require(lending.timeCreated != 0, "AavegotchiLending: lending not found");
        require(lending.timeAgreed == 0, "AavegotchiLending: lending already agreed");
        require(lending.canceled == false, "AavegotchiLending: lending canceled");
        require(lending.erc721TokenId == _erc721TokenId, "AavegotchiLending: Invalid token id");
        require(lending.initialCost == _initialCost, "AavegotchiLending: Invalid initial cost");
        require(lending.period == _period, "AavegotchiLending: Invalid lending period");
        for (uint256 i; i < 3; i++) {
            require(lending.revenueSplit[i] == _revenueSplit[i], "AavegotchiLending: Invalid revenue split");
        }
        address borrower = LibMeta.msgSender();
        address lender = lending.lender;
        require(lender != borrower, "AavegotchiLending: borrower can't be lender");
        if (lending.whitelistId > 0) {
            require(s.isWhitelisted[lending.whitelistId][borrower], "AavegotchiLending: Not whitelisted address");
        }

        if (lending.initialCost > 0) {
            require(IERC20(s.ghstContract).balanceOf(borrower) >= lending.initialCost, "AavegotchiLending: not enough GHST");
            LibERC20.transferFrom(s.ghstContract, borrower, lender, lending.initialCost);
        }

        lending.borrower = borrower;
        lending.timeAgreed = block.timestamp;

        LibAavegotchiLending.removeLendingListItem(lender, _lendingId, "listed");
        LibAavegotchiLending.addLendingListItem(lender, _lendingId, "agreed");

        uint256 tokenId = lending.erc721TokenId;
        s.lentTokenIdIndexes[lender][tokenId] = s.lentTokenIds[lender].length;
        s.lentTokenIds[lender].push(tokenId);

        LibAavegotchi.transfer(lender, borrower, tokenId);

        // set lender as pet operator
        s.petOperators[borrower][lender] = true;

        emit AavegotchiLendingExecute(_lendingId);
    }

    ///@notice Allow to claim revenue from the lending
    ///@dev Will throw if the NFT has not been lent or if the lending has been canceled already
    ///@param _tokenId The identifier of the lent aavegotchi to claim
    ///@param _revenueTokens The address array of the revenue tokens to claim; FUD, FOMO, ALPHA, KEK, then GHST
    function claimAavegotchiLending(uint256 _tokenId, address[] calldata _revenueTokens) external {
        uint256 lendingId = s.aavegotchiToLendingId[_tokenId];
        require(lendingId != 0, "AavegotchiLending: lending not found");
        AavegotchiLending storage lending = s.aavegotchiLendings[lendingId];

        address sender = LibMeta.msgSender();
        require((lending.lender == sender) || (lending.borrower == sender), "AavegotchiLending: only lender or borrower can claim");

        uint256[] memory amounts = LibAavegotchiLending.claimAavegotchiLending(lendingId, _revenueTokens);

        emit AavegotchiLendingClaim(lendingId, _revenueTokens, amounts);
    }

    ///@notice Allow a lender to claim revenue from the lending
    ///@dev Will throw if the NFT has not been lent or if the lending has been canceled already
    ///@param _tokenId The identifier of the lent aavegotchi to claim
    ///@param _revenueTokens The address array of the revenue tokens to claim; FUD, FOMO, ALPHA, KEK, then GHST
    function claimAndEndAavegotchiLending(uint256 _tokenId, address[] calldata _revenueTokens) external {
        uint256 lendingId = s.aavegotchiToLendingId[_tokenId];
        require(lendingId != 0, "AavegotchiLending: lending not found");
        AavegotchiLending storage lending = s.aavegotchiLendings[lendingId];

        address sender = LibMeta.msgSender();
        address lender = lending.lender;
        address borrower = lending.borrower;
        require((lender == sender) || (borrower == sender), "AavegotchiLending: only lender or borrower can claim and end agreement");
        require(lending.timeAgreed + lending.period <= block.timestamp, "AavegotchiLending: not allowed during agreement");

        uint256[] memory amounts = LibAavegotchiLending.claimAavegotchiLending(lendingId, _revenueTokens);

        // end lending agreement
        s.aavegotchis[_tokenId].locked = false;
        LibAavegotchi.transfer(borrower, lender, _tokenId);

        lending.completed = true;
        s.aavegotchiToLendingId[_tokenId] = 0;

        LibAavegotchiLending.removeLentAavegotchi(_tokenId, lender);
        LibAavegotchiLending.removeLendingListItem(lender, lendingId, "agreed");

        emit AavegotchiLendingClaim(lendingId, _revenueTokens, amounts);
        emit AavegotchiLendingEnd(lendingId);
    }
}
