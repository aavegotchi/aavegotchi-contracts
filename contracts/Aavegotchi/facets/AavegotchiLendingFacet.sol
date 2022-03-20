// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAavegotchi, AavegotchiInfo} from "../libraries/LibAavegotchi.sol";
import {IERC721} from "../../shared/interfaces/IERC721.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibAavegotchiLending} from "../libraries/LibAavegotchiLending.sol";
import {Modifiers, AavegotchiRental} from "../libraries/LibAppStorage.sol";

contract AavegotchiLendingFacet is Modifiers {
    event AavegotchiRentalAdd(
        uint256 indexed rentalId,
        address indexed lender,
        uint256 erc721TokenId,
        uint256 initialCost,
        uint256 period,
        uint256[3] _revenueSplit,
        address[] _includes,
        uint256 time
    );

    event AavegotchiRentalExecute(
        uint256 indexed rentalId,
        address indexed lender,
        address renter,
        uint256 erc721TokenId,
        uint256 initialCost,
        uint256 period,
        uint256[3] _revenueSplit,
        address[] _includes,
        uint256 time
    );

    event AavegotchiRentalClaim(
        uint256 indexed rentalId,
        uint256 indexed erc721tokenId,
        address lender,
        address renter,
        address thirdParty,
        address[] tokenAddresses,
        uint256[] amounts,
        uint256[3] revenueSplit
    );

    event AavegotchiRentalEnd(uint256 indexed rentalId);

    ///@notice Get an aavegotchi rental details through an identifier
    ///@dev Will throw if the rental does not exist
    ///@param _rentalId The identifier of the rental to query
    ///@return rental_ A struct containing certain details about the rental like timeCreated etc
    ///@return aavegotchiInfo_ A struct containing details about the aavegotchi
    function getAavegotchiRentalInfo(uint256 _rentalId)
        external
        view
        returns (AavegotchiRental memory rental_, AavegotchiInfo memory aavegotchiInfo_)
    {
        rental_ = s.aavegotchiRentals[_rentalId];
        require(rental_.timeCreated != 0, "AavegotchiLending: rental does not exist");
        aavegotchiInfo_ = LibAavegotchi.getAavegotchi(rental_.erc721TokenId);
    }

    ///@notice Get an ERC721 rental details through an identifier
    ///@dev Will throw if the rental does not exist
    ///@param _rentalId The identifier of the rental to query
    ///@return rental_ A struct containing certain details about the ERC721 rental like timeCreated etc
    function getAavegotchiRental(uint256 _rentalId) external view returns (AavegotchiRental memory rental_) {
        rental_ = s.aavegotchiRentals[_rentalId];
        require(rental_.timeCreated != 0, "AavegotchiLending: rental does not exist");
    }

    ///@notice Get an aavegotchi rental details through an NFT
    ///@dev Will throw if the rental does not exist
    ///@param _erc721TokenId The identifier of the NFT associated with the rental
    ///@return rental_ A struct containing certain details about the rental associated with an NFT of contract identifier `_erc721TokenId`
    function getAavegotchiRentalFromToken(uint256 _erc721TokenId) external view returns (AavegotchiRental memory rental_) {
        uint256 rentalId = s.aavegotchiToRentalId[_erc721TokenId];
        require(rentalId != 0, "AavegotchiLending: rental doesn't exist");
        rental_ = s.aavegotchiRentals[rentalId];
    }

    ///@notice Query a certain amount of aavegotchi rentals created by an address
    ///@param _lender Creator of the rentals to query
    ///@param _status Status of the rentals to query, "listed" or "agreed"
    ///@param _length How many aavegotchi rentals to return
    ///@return rentals_ An array of rental
    function getOwnerAavegotchiRentals(
        address _lender,
        bytes32 _status,
        uint256 _length
    ) external view returns (AavegotchiRental[] memory rentals_) {
        uint256 rentalId = s.aavegotchiLenderRentalHead[_lender][_status];
        rentals_ = new AavegotchiRental[](_length);
        uint256 listIndex;
        for (; rentalId != 0 && listIndex < _length; listIndex++) {
            rentals_[listIndex] = s.aavegotchiRentals[rentalId];
            rentalId = s.aavegotchiLenderRentalListItem[_status][rentalId].childRentalId;
        }
        assembly {
            mstore(rentals_, listIndex)
        }
    }

    ///@notice Query a certain amount of aavegotchi rentals
    ///@param _status Status of the rentals to query, "listed" or "agreed"
    ///@param _length How many rentals to return
    ///@return rentals_ An array of rental
    function getAavegotchiRentals(bytes32 _status, uint256 _length) external view returns (AavegotchiRental[] memory rentals_) {
        uint256 rentalId = s.aavegotchiRentalHead[_status];
        rentals_ = new AavegotchiRental[](_length);
        uint256 listIndex;
        for (; rentalId != 0 && listIndex < _length; listIndex++) {
            rentals_[listIndex] = s.aavegotchiRentals[rentalId];
            rentalId = s.aavegotchiRentalListItem[_status][rentalId].childRentalId;
        }
        assembly {
            mstore(rentals_, listIndex)
        }
    }

    function isAavegotchiLent(uint256 _erc721TokenId) external view returns (bool) {
        return LibAavegotchiLending.isAavegotchiLent(_erc721TokenId);
    }

    ///@notice Allow an aavegotchi lender to add request for rental
    ///@dev If the rental request exist, cancel it and replaces it with the new one
    ///@dev If the rental is active, unable to cancel
    ///@param _erc721TokenId The identifier of the NFT to rent
    ///@param _initialCost The rental fee of the aavegotchi in $GHST
    ///@param _period The rental period of the aavegotchi, unit: second
    ///@param _revenueSplit The revenue split of the rental, 3 values, sum of the should be 100
    ///@param _originalOwner The account for original owner, can be address(0) if original owner is lender
    ///@param _thirdParty The 3rd account for receive revenue split, can be address(0)
    ///@param _whitelistId The identifier of whitelist for agree rental, if 0, allow everyone
    function addAavegotchiRental(
        uint256 _erc721TokenId,
        uint256 _initialCost,
        uint256 _period,
        uint256[3] calldata _revenueSplit,
        address _originalOwner,
        address _thirdParty,
        uint256 _whitelistId,
        address[] calldata _includes
    ) external {
        IERC721 erc721Token = IERC721(address(this));
        address sender = LibMeta.msgSender();
        require(erc721Token.ownerOf(_erc721TokenId) == sender, "AavegotchiLending: Not owner of aavegotchi");
        //        require(
        //            erc721Token.isApprovedForAll(sender, address(this)) || erc721Token.getApproved(_erc721TokenId) == address(this),
        //            "AavegotchiLending: Not approved for transfer"
        //        );

        require(_period > 0, "AavegotchiLending: period should be larger than 0");
        //        require(_revenueSplit.length == 3, "AavegotchiLending: revenues split should consists of 3 values");
        require(_revenueSplit[0] + _revenueSplit[1] + _revenueSplit[2] == 100, "AavegotchiLending: sum of revenue split should be 100");
        if (_thirdParty == address(0)) {
            require(_revenueSplit[2] == 0, "AavegotchiLending: revenue split for invalid thirdParty should be zero");
        }
        require((s.whitelists.length >= _whitelistId) || (_whitelistId == 0), "AavegotchiLending: whitelist not found");

        require(s.aavegotchis[_erc721TokenId].status == LibAavegotchi.STATUS_AAVEGOTCHI, "AavegotchiLending: Only aavegotchi available");

        uint256 oldRentalId = s.aavegotchiToRentalId[_erc721TokenId];
        if (oldRentalId != 0) {
            LibAavegotchiLending.cancelAavegotchiRental(oldRentalId, sender);
        } else {
            require(s.aavegotchis[_erc721TokenId].locked == false, "AavegotchiLending: Only callable on unlocked Aavegotchis");
        }

        s.nextAavegotchiRentalId++;
        uint256 rentalId = s.nextAavegotchiRentalId;

        s.aavegotchiToRentalId[_erc721TokenId] = rentalId;
        s.aavegotchiRentals[rentalId] = AavegotchiRental({
            rentalId: rentalId,
            initialCost: _initialCost,
            period: _period,
            revenueSplit: _revenueSplit,
            lender: sender,
            renter: address(0),
            originalOwner: _originalOwner == address(0) ? sender : _originalOwner,
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

        LibAavegotchiLending.addRentalListItem(sender, rentalId, "listed");

        emit AavegotchiRentalAdd(rentalId, sender, _erc721TokenId, _initialCost, _period, _revenueSplit, _includes, block.timestamp);

        // Lock Aavegotchis when rental is created
        s.aavegotchis[_erc721TokenId].locked = true;
    }

    ///@notice Allow an aavegotchi lender to cancel his NFT rental by providing the NFT contract address and identifier
    ///@param _erc721TokenId The identifier of the NFT to be delisted from rental
    function cancelAavegotchiRentalByToken(uint256 _erc721TokenId) external {
        LibAavegotchiLending.cancelAavegotchiRentalFromToken(_erc721TokenId, LibMeta.msgSender());
    }

    ///@notice Allow an aavegotchi lender to cancel his NFT rental through the rentalID
    ///@param _rentalId The identifier of the rental to be cancelled
    function cancelAavegotchiRental(uint256 _rentalId) external {
        LibAavegotchiLending.cancelAavegotchiRental(_rentalId, LibMeta.msgSender());
    }

    ///@notice Allow a renter to agree an rental for the NFT
    ///@dev Will throw if the NFT has been lent or if the rental has been canceled already
    ///@param _rentalId The identifier of the rental to agree
    function agreeAavegotchiRental(
        uint256 _rentalId,
        uint256 _erc721TokenId,
        uint256 _initialCost,
        uint256 _period,
        uint256[3] calldata _revenueSplit
    ) external {
        AavegotchiRental storage rental = s.aavegotchiRentals[_rentalId];
        require(rental.timeCreated != 0, "AavegotchiLending: rental not found");
        require(rental.timeAgreed == 0, "AavegotchiLending: rental already agreed");
        require(rental.canceled == false, "AavegotchiLending: rental canceled");
        require(rental.erc721TokenId == _erc721TokenId, "AavegotchiLending: Invalid token id");
        require(rental.initialCost == _initialCost, "AavegotchiLending: Invalid initial cost");
        require(rental.period == _period, "AavegotchiLending: Invalid rental period");
        for (uint256 i; i < 3; i++) {
            require(rental.revenueSplit[i] == _revenueSplit[i], "AavegotchiLending: Invalid revenue split");
        }
        address renter = LibMeta.msgSender();
        address lender = rental.lender;
        require(lender != renter, "AavegotchiLending: renter can't be lender");
        if (rental.whitelistId > 0) {
            require(s.isWhitelisted[rental.whitelistId][renter], "AavegotchiLending: Not whitelisted address");
        }

        if (rental.initialCost > 0) {
            require(IERC20(s.ghstContract).balanceOf(renter) >= rental.initialCost, "AavegotchiLending: not enough GHST");
            LibERC20.transferFrom(s.ghstContract, renter, lender, rental.initialCost);
        }

        rental.renter = renter;
        rental.timeAgreed = block.timestamp;

        LibAavegotchiLending.removeRentalListItem(lender, _rentalId, "listed");
        LibAavegotchiLending.addRentalListItem(lender, _rentalId, "agreed");

        uint256 tokenId = rental.erc721TokenId;
        s.lentTokenIdIndexes[lender][tokenId] = s.lentTokenIds[lender].length;
        s.lentTokenIds[lender].push(tokenId);

        LibAavegotchi.transfer(lender, renter, tokenId);

        // set lender as pet operator
        s.petOperators[renter][lender] = true;

        emit AavegotchiRentalExecute(
            _rentalId,
            lender,
            renter,
            tokenId,
            rental.initialCost,
            rental.period,
            _revenueSplit,
            rental.includeList,
            block.timestamp
        );
    }

    ///@notice Allow to claim revenue from the rental
    ///@dev Will throw if the NFT has not been lent or if the rental has been canceled already
    ///@param _tokenId The identifier of the lent aavegotchi to claim
    ///@param _revenueTokens The address array of the revenue tokens to claim; FUD, FOMO, ALPHA, KEK, then GHST
    function claimAavegotchiRental(uint256 _tokenId, address[] calldata _revenueTokens) external {
        uint256 rentalId = s.aavegotchiToRentalId[_tokenId];
        require(rentalId != 0, "AavegotchiLending: rental not found");
        AavegotchiRental storage rental = s.aavegotchiRentals[rentalId];

        address sender = LibMeta.msgSender();
        require((rental.lender == sender) || (rental.renter == sender), "AavegotchiLending: only lender or renter can claim");

        uint256[] memory amounts = LibAavegotchiLending.claimAavegotchiRental(rentalId, _revenueTokens);

        emit AavegotchiRentalClaim(rentalId, _tokenId, rental.lender, rental.renter, rental.thirdParty, _revenueTokens, amounts, rental.revenueSplit);
    }

    ///@notice Allow a lender to claim revenue from the rental
    ///@dev Will throw if the NFT has not been lent or if the rental has been canceled already
    ///@param _tokenId The identifier of the lent aavegotchi to claim
    ///@param _revenueTokens The address array of the revenue tokens to claim; FUD, FOMO, ALPHA, KEK, then GHST
    function claimAndEndAavegotchiRental(uint256 _tokenId, address[] calldata _revenueTokens) external {
        uint256 rentalId = s.aavegotchiToRentalId[_tokenId];
        require(rentalId != 0, "AavegotchiLending: rental not found");
        AavegotchiRental storage rental = s.aavegotchiRentals[rentalId];

        address sender = LibMeta.msgSender();
        address lender = rental.lender;
        address renter = rental.renter;
        require((lender == sender) || (renter == sender), "AavegotchiLending: only lender or renter can claim and end agreement");
        require(rental.timeAgreed + rental.period <= block.timestamp, "AavegotchiLending: not allowed during agreement");

        uint256[] memory amounts = LibAavegotchiLending.claimAavegotchiRental(rentalId, _revenueTokens);

        // end rental agreement
        s.aavegotchis[_tokenId].locked = false;
        LibAavegotchi.transfer(renter, lender, _tokenId);

        rental.completed = true;
        s.aavegotchiToRentalId[_tokenId] = 0;

        LibAavegotchiLending.removeLentAavegotchi(_tokenId, lender);
        LibAavegotchiLending.removeRentalListItem(lender, rentalId, "agreed");

        emit AavegotchiRentalClaim(rentalId, _tokenId, rental.lender, rental.renter, rental.thirdParty, _revenueTokens, amounts, rental.revenueSplit);
        emit AavegotchiRentalEnd(rentalId);
    }
}
