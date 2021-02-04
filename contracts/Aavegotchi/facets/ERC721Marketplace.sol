// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

import "../libraries/LibAppStorage.sol";
import "../interfaces/IERC721.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibMath.sol";

// import "hardhat/console.sol";

contract ERC721MarketplaceFacet is LibAppStorageModifiers {
    event ERC721ListingSet(
        bytes32 indexed listingId,
        address indexed seller,
        address erc721TokenAddress,
        uint256 erc721TypeId,
        uint256 indexed category,
        uint256 quantity,
        uint256 priceInWei
    );

    event ERC721ExecutedListing(
        bytes32 indexed listingId,
        address indexed seller,
        address buyer,
        address erc721TokenAddress,
        uint256 erc721TypeId,
        uint256 indexed category,
        uint256 _quantity,
        uint256 priceInWei,
        uint256 timeLastPurchased
    );

    event UpdateERC721Listing(bytes32 indexed _listingId, uint256 quantity);

    event ERC721ListingCancelled(bytes32 indexed listingId);

    event ChangedListingFee(uint256 listingFeeInWei);

    function getERC721Listings(
        uint256 _category, // // 0 is wearable, 1 is badge, 2 is consumable, 3 is tickets
        string memory _sort, // "listed" or "purchased"
        uint256 _length // how many items to get back or the rest available
    ) external view returns (ERC721Listing[] memory listings_) {
        bytes32 listingId = s.erc721ListingHead[_category][_sort];
        listings_ = new ERC721Listing[](_length);
        uint256 listIndex;
        for (; listingId != 0 && listIndex < _length; listIndex++) {
            listings_[listIndex] = s.erc721Listings[listingId];
            listingId = s.erc721ListingListItem[_sort][listingId].childListingId;
        }
        assembly {
            mstore(listings_, listIndex)
        }
    }

    function removeERC721ListingItem(string memory _sort, bytes32 _listingId) internal {
        ERC721ListingListItem storage listingItem = s.erc721ListingListItem[_sort][_listingId];
        if (listingItem.listingId == 0) {
            return;
        }
        bytes32 parentListingId = listingItem.parentListingId;
        if (parentListingId != 0) {
            ERC721ListingListItem storage parentListingItem = s.erc721ListingListItem[_sort][parentListingId];
            parentListingItem.childListingId = listingItem.childListingId;
        }
        bytes32 childListingId = listingItem.childListingId;
        if (childListingId != 0) {
            ERC721ListingListItem storage childListingItem = s.erc721ListingListItem[_sort][childListingId];
            childListingItem.parentListingId = listingItem.parentListingId;
        }
        ERC721Listing storage listing = s.erc721Listings[_listingId];
        if (s.erc721ListingHead[listing.category][_sort] == _listingId) {
            s.erc721ListingHead[listing.category][_sort] = listingItem.childListingId;
        }
        listingItem.listingId = 0;
        listingItem.parentListingId = 0;
        listingItem.childListingId = 0;
    }

    function setERC721Listing(
        address _erc721TokenAddress,
        uint256 _erc721TokenId,
        uint256 _priceInWei
    ) external {
        uint256 category = getERC721Category(_erc721TokenAddress, _erc721TokenId);

        IERC721 erc721Token = IERC721(_erc721TokenAddress);
        require(erc721Token.balanceOf(LibMeta.msgSender(), _erc721TokenId) >= _quantity, "Marketplace: Not enough ERC721 token");
        require(
            _erc721TokenAddress == address(this) || erc721Token.isApprovedForAll(LibMeta.msgSender(), address(this)),
            "Marketplace: Not approved for transfer"
        );

        uint256 cost = LibMath.mul(_quantity, _priceInWei);
        require(cost >= 1e18, "Marketplace: cost should be 1 GHST or larger");

        bytes32 listingId = keccak256(abi.encodePacked(_erc721TokenAddress, _erc721TokenId, LibMeta.msgSender()));
        ERC721Listing storage listing = s.erc721Listings[listingId];
        removeERC721ListingItem("listed", listingId);
        if (_priceInWei != listing.priceInWei) {
            removeERC721ListingItem("purchased", listingId);
        }

        if (listing.timeCreated == 0) {
            s.erc721Listings[listingId] = ERC721Listing({
                listingId: listingId,
                seller: LibMeta.msgSender(),
                erc721TokenAddress: _erc721TokenAddress,
                erc721TypeId: _erc721TokenId,
                category: category,
                quantity: _quantity,
                priceInWei: _priceInWei,
                timeCreated: block.timestamp,
                timeLastPurchased: 0
            });
            s.userListingIds[LibMeta.msgSender()].push(listingId);
        } else {
            listing.quantity = _quantity;
            listing.priceInWei = _priceInWei;
        }

        // Check if there's a publication fee and
        // transfer the amount to burn address
        if (s.listingFeeInWei > 0) {
            // burn address: address(0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF)
            LibERC20.transferFrom(s.ghstContract, LibMeta.msgSender(), address(0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF), s.listingFeeInWei);
        }

        ERC721ListingListItem storage listingItem = s.erc721ListingListItem["listed"][listingId];
        listingItem.childListingId = s.erc721ListingHead[category]["listed"];
        s.erc721ListingHead[category]["listed"] = listingId;
        listingItem.listingId = listingId;

        emit ERC721ListingSet(listingId, LibMeta.msgSender(), _erc721TokenAddress, _erc721TokenId, category, _quantity, _priceInWei);
    }

    function cancelERC721Listing(bytes32 _listingId) external {
        ERC721ListingListItem storage listingItem = s.erc721ListingListItem["listed"][_listingId];
        require(listingItem.listingId != 0, "Marketplace Listing doesn't exist or is already cancelled");
        ERC721Listing storage listing = s.erc721Listings[_listingId];
        require(listing.seller == LibMeta.msgSender(), "Marketplace: Only seller can cancel listing.");
        listing.quantity = 0;
        emit ERC721ListingCancelled(_listingId);
        removeERC721ListingItem("listed", _listingId);
        removeERC721ListingItem("purchased", _listingId);
    }

    function executeERC721Listing(bytes32 _listingId, uint256 _quantity) external {
        ERC721Listing storage listing = s.erc721Listings[_listingId];
        require(listing.timeCreated != 0, "Marketplace: listing not found");
        address buyer = LibMeta.msgSender();
        address seller = listing.seller;
        require(seller != buyer, "Marketplace: buyer can't be seller");
        require(_quantity > 0, "Marketplace: _quantity can't be zero");
        require(_quantity <= listing.quantity, "Marketplace: quantity is greater than listing");
        uint256 cost = LibMath.mul(_quantity, listing.priceInWei);
        require(IERC20(s.ghstContract).balanceOf(buyer) >= cost, "Marketplace: not enough GHST");
        uint256 daoShare = cost / 100;
        uint256 pixelCraftShare = (cost * 2) / 100;
        uint256 transferAmount = cost - (daoShare + pixelCraftShare);
        LibERC20.transferFrom(s.ghstContract, buyer, s.pixelCraft, pixelCraftShare);
        LibERC20.transferFrom(s.ghstContract, buyer, s.daoTreasury, daoShare);
        LibERC20.transferFrom(s.ghstContract, buyer, seller, transferAmount);
        // Have to call it like this because LibMeta.msgSender() gets in the way
        if (listing.erc721TokenAddress == address(this)) {
            bytes memory myFunctionCall =
                abi.encodeWithSelector(
                    IERC721.safeTransferFrom.selector,
                    seller, // from
                    buyer, // to
                    listing.erc721TypeId,
                    _quantity,
                    new bytes(0)
                );
            // address(this) becomes msg.sender
            (bool success, bytes memory result) = address(this).call(abi.encodePacked(myFunctionCall, address(this)));
            if (!success) {
                if (result.length > 0) {
                    // bubble up any reason for revert
                    revert(string(result));
                } else {
                    revert("Marketplace: ERC721 safeTransferFrom failed");
                }
            }
        } else {
            // GHSTStakingDiamond
            IERC721(listing.erc721TokenAddress).safeTransferFrom(seller, buyer, listing.erc721TypeId, _quantity, new bytes(0));
        }
        listing.timeLastPurchased = block.timestamp;
        removeERC721ListingItem("purchased", _listingId);
        ERC721ListingListItem storage listingItem = s.erc721ListingListItem["purchased"][_listingId];
        listingItem.childListingId = s.erc721ListingHead[listing.category]["purchased"];
        s.erc721ListingHead[listing.category]["purchased"] = _listingId;
        listingItem.listingId = _listingId;

        //s.erc721MarketListingIds[category]["purchased"].push(listingId);
        emit ERC721ExecutedListing(
            _listingId,
            seller,
            buyer,
            listing.erc721TokenAddress,
            listing.erc721TypeId,
            listing.category,
            _quantity,
            listing.priceInWei,
            block.timestamp
        );
    }

    function updateERC721Listing(bytes32 _listingId) external {
        ERC721Listing storage listing = s.erc721Listings[_listingId];
        if (listing.timeCreated == 0) {
            return;
        }
        uint256 quantity = listing.quantity;
        if (quantity > 0) {
            quantity = IERC721(listing.erc721TokenAddress).balanceOf(listing.seller, listing.erc721TypeId);
            if (quantity < listing.quantity) {
                listing.quantity = quantity;
                emit UpdateERC721Listing(_listingId, quantity);
            }
        }
        if (quantity == 0) {
            removeERC721ListingItem("listed", _listingId);
            removeERC721ListingItem("purchased", _listingId);
        }
    }
}
