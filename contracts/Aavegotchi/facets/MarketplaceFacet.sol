// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

import "../libraries/LibAppStorage.sol";
import "../interfaces/IERC1155.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibMath.sol";

contract Marketplace is LibAppStorageModifiers {
    event ERC1155ListingSet(
        bytes32 indexed listingId,
        address indexed seller,
        address erc1155TokenAddress,
        uint256 erc1155TypeId,
        uint256 indexed category,
        uint256 quantity,
        uint256 priceInWei,
        uint256 expires
    );

    event ERC1155ExecutedListing(
        bytes32 indexed listingId,
        address indexed seller,
        address buyer,
        address erc1155TokenAddress,
        uint256 erc1155TypeId,
        uint256 indexed category,
        uint256 _quantity,
        uint256 priceInWei,
        uint256 timeLastPurchased
    );

    event UpdateERC1155Listing(bytes32 indexed _listingId, uint256 quantity);

    event ERC1155ListingCancelled(bytes32 indexed listingId);
    event ERC1155ListingExpired(bytes32 indexed listingId, uint256 _expired);

    event ChangedListingFee(uint256 listingFeeInWei);

    function getERC1155Listings(
        uint256 _category, // // 0 is wearable, 1 is badge, 2 is consumable, 3 is tickets
        string memory _sort, // "listed" or "purchased"
        uint256 _length // how many items to get back or the rest available
    ) external view returns (ERC1155Listing[] memory listings_) {
        bytes32 listingId = s.erc1155ListingHead[_category][_sort];
        for (uint256 listIndex = 0; listingId != 0 && listIndex < _length; listIndex++) {
            listings_[listIndex] = s.erc1155Listings[listingId];
            listingId = s.erc1155ListingListItem[_sort][listingId].childListingId;
        }
    }

    function setListingFee(uint256 _listingFeeInWei) external onlyOwner {
        s.listingFeeInWei = _listingFeeInWei;
        emit ChangedListingFee(s.listingFeeInWei);
    }

    function getERC1155Category(address _erc1155TokenAddress, uint256 _erc1155TypeId) internal view returns (uint256 category_) {
        category_ = s.erc1155Categories[_erc1155TokenAddress][_erc1155TypeId];
        if (category_ == 0) {
            require(_erc1155TokenAddress == address(this) && s.itemTypes[_erc1155TypeId].maxQuantity > 0, "Marketplace: erc1155 item not supported");
        }
    }

    function removeERC1122ListingItem(string memory _sort, bytes32 _listingId) internal {
        ERC1155ListingListItem storage listingItem = s.erc1155ListingListItem[_sort][_listingId];
        if (listingItem.listingId == 0) {
            return;
        }
        bytes32 parentListingId = listingItem.parentListingId;
        if (parentListingId != 0) {
            ERC1155ListingListItem storage parentListingItem = s.erc1155ListingListItem[_sort][parentListingId];
            parentListingItem.childListingId = listingItem.childListingId;
        }
        bytes32 childListingId = listingItem.childListingId;
        if (childListingId != 0) {
            ERC1155ListingListItem storage childListingItem = s.erc1155ListingListItem[_sort][childListingId];
            childListingItem.parentListingId = listingItem.parentListingId;
        }
        ERC1155Listing storage listing = s.erc1155Listings[_listingId];
        if (s.erc1155ListingHead[listing.category][_sort] == _listingId) {
            s.erc1155ListingHead[listing.category][_sort] = listingItem.childListingId;
        }
        listingItem.listingId = 0;
        listingItem.parentListingId = 0;
        listingItem.childListingId = 0;
    }

    function setERC1122Listing(
        address _erc1155TokenAddress,
        uint256 _erc1155TypeId,
        uint256 _quantity,
        uint256 _priceInWei,
        uint256 _expires
    ) external {
        uint256 category = getERC1155Category(_erc1155TokenAddress, _erc1155TypeId);
        IERC1155 erc1155Token = IERC1155(_erc1155TokenAddress);
        require(erc1155Token.balanceOf(LibMeta.msgSender(), _erc1155TypeId) >= _quantity, "Marketplace: Not enough ERC1155 token");
        require(
            _erc1155TokenAddress == address(this) || erc1155Token.isApprovedForAll(LibMeta.msgSender(), address(this)),
            "Marketplace: Not approved for transfer"
        );

        uint256 cost = LibMath.mul(_quantity, _priceInWei);
        require(cost >= 1e18, "Marketplace: cost should be 1 GHST or larger");
        require(_expires > block.timestamp + 1 minutes, "Marketplace: Listing should be more than 1 minute in the future");

        bytes32 listingId = keccak256(abi.encodePacked(_erc1155TokenAddress, _erc1155TypeId, LibMeta.msgSender()));
        ERC1155Listing storage listing = s.erc1155Listings[listingId];
        removeERC1122ListingItem("listed", listingId);
        if (_priceInWei != listing.priceInWei) {
            removeERC1122ListingItem("purchased", listingId);
        }

        if (listing.timeCreated == 0) {
            s.erc1155Listings[listingId] = ERC1155Listing({
                listingId: listingId,
                seller: LibMeta.msgSender(),
                erc1155TokenAddress: _erc1155TokenAddress,
                erc1155TypeId: _erc1155TypeId,
                category: category,
                quantity: _quantity,
                priceInWei: _priceInWei,
                expires: _expires,
                timeCreated: block.timestamp,
                timeLastPurchased: 0
            });
            s.userListingIds[LibMeta.msgSender()].push(listingId);
        } else {
            listing.quantity = _quantity;
            listing.priceInWei = _priceInWei;
            listing.expires = _expires;
        }

        // Check if there's a publication fee and
        // transfer the amount to burn address
        if (s.listingFeeInWei > 0) {
            // burn address: address(0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF)
            LibERC20.transferFrom(s.ghstContract, LibMeta.msgSender(), address(0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF), s.listingFeeInWei);
        }

        ERC1155ListingListItem storage listingItem = s.erc1155ListingListItem["listed"][listingId];
        listingItem.childListingId = s.erc1155ListingHead[category]["listed"];
        s.erc1155ListingHead[category]["listed"] = listingId;
        listingItem.listingId = listingId;

        emit ERC1155ListingSet(listingId, LibMeta.msgSender(), _erc1155TokenAddress, _erc1155TypeId, category, _quantity, _priceInWei, _expires);
    }

    function cancelERC1155Listing(bytes32 _listingId) external {
        ERC1155ListingListItem storage listingItem = s.erc1155ListingListItem["listed"][_listingId];
        require(listingItem.listingId != 0, "Marketplace Listing doesn't exist or is already cancelled");
        ERC1155Listing storage listing = s.erc1155Listings[_listingId];
        require(listing.seller == LibMeta.msgSender(), "Marketplace: Only seller can cancel listing.");
        listing.quantity = 0;
        emit ERC1155ListingCancelled(_listingId);
        removeERC1122ListingItem("listed", _listingId);
        removeERC1122ListingItem("purchased", _listingId);
    }

    function executeERC1155Listing(bytes32 _listingId, uint256 _quantity) external {
        ERC1155Listing storage listing = s.erc1155Listings[_listingId];
        require(listing.timeCreated != 0, "Marketplace: listing not found");
        address buyer = LibMeta.msgSender();
        address seller = listing.seller;
        require(seller != buyer, "Marketplace: buyer can't be seller");
        require(_quantity > 0, "Marketplace: _quantity can't be zero");
        require(_quantity <= listing.quantity, "Marketplace: quantity is greater than listing");
        require(listing.expires > block.timestamp, "Marketplace: listing has expired");
        uint256 cost = LibMath.mul(_quantity, listing.priceInWei);
        require(IERC20(s.ghstContract).balanceOf(buyer) >= cost, "Marketplace: not enough GHST");
        uint256 daoShare = cost / 100;
        uint256 pixelCraftShare = (cost * 2) / 100;
        uint256 transferAmount = cost - (daoShare + pixelCraftShare);
        LibERC20.transferFrom(s.ghstContract, buyer, s.pixelCraft, pixelCraftShare);
        LibERC20.transferFrom(s.ghstContract, buyer, s.daoTreasury, daoShare);
        LibERC20.transferFrom(s.ghstContract, buyer, seller, transferAmount);
        // Have to call it like this because LibMeta.msgSender() gets in the way
        if (listing.erc1155TokenAddress == address(this)) {
            bytes memory myFunctionCall =
                abi.encodeWithSelector(
                    IERC1155.safeTransferFrom.selector,
                    seller, // from
                    buyer, // to
                    listing.erc1155TypeId,
                    _quantity,
                    new bytes(0),
                    address(this) // becomes msg.sender
                );
            (bool success, bytes memory result) = address(this).call(myFunctionCall);
            if (!success) {
                if (result.length > 0) {
                    // bubble up any reason for revert
                    revert(string(result));
                } else {
                    revert("Marketplace: ERC1155 safeTransferFrom failed");
                }
            }
        } else {
            // GHSTStakingDiamond
            IERC1155(listing.erc1155TokenAddress).safeTransferFrom(seller, buyer, listing.erc1155TypeId, _quantity, new bytes(0));
        }
        listing.timeLastPurchased = block.timestamp;
        removeERC1122ListingItem("purchased", _listingId);
        ERC1155ListingListItem storage listingItem = s.erc1155ListingListItem["purchased"][_listingId];
        listingItem.childListingId = s.erc1155ListingHead[listing.category]["purchased"];
        s.erc1155ListingHead[listing.category]["purchased"] = _listingId;
        listingItem.listingId = _listingId;

        //s.erc1155MarketListingIds[category]["purchased"].push(listingId);
        emit ERC1155ExecutedListing(
            _listingId,
            seller,
            buyer,
            listing.erc1155TokenAddress,
            listing.erc1155TypeId,
            listing.category,
            _quantity,
            listing.priceInWei,
            block.timestamp
        );
    }

    function updateERC1155Listing(bytes32 _listingId) external {
        ERC1155Listing storage listing = s.erc1155Listings[_listingId];
        if (listing.timeCreated == 0) {
            return;
        }
        uint256 quantity = listing.quantity;
        if (quantity > 0) {
            quantity = IERC1155(listing.erc1155TokenAddress).balanceOf(listing.seller, listing.erc1155TypeId);
            if (quantity < listing.quantity) {
                listing.quantity = quantity;
                emit UpdateERC1155Listing(_listingId, quantity);
            }
        }
        bool removeListing = false;
        if (quantity == 0) {
            removeListing = true;
        }
        if (block.timestamp >= listing.expires) {
            emit ERC1155ListingExpired(_listingId, listing.expires);
            removeListing = true;
        }
        if (removeListing) {
            removeERC1122ListingItem("listed", _listingId);
            removeERC1122ListingItem("purchased", _listingId);
        }
    }
}
