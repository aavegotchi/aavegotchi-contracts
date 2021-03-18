// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {Modifiers, ListingListItem} from "../libraries/LibAppStorage.sol";
import {LibERC1155Marketplace, ERC1155Listing} from "../libraries/LibERC1155Marketplace.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {IERC1155} from "../../shared/interfaces/IERC1155.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibItems} from "../libraries/LibItems.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";

// import "hardhat/console.sol";

contract ERC1155MarketplaceFacet is Modifiers {
    event ERC1155ListingAdd(
        uint256 indexed listingId,
        address indexed seller,
        address erc1155TokenAddress,
        uint256 erc1155TypeId,
        uint256 indexed category,
        uint256 quantity,
        uint256 priceInWei,
        uint256 time
    );

    event ERC1155ExecutedListing(
        uint256 indexed listingId,
        address indexed seller,
        address buyer,
        address erc1155TokenAddress,
        uint256 erc1155TypeId,
        uint256 indexed category,
        uint256 _quantity,
        uint256 priceInWei,
        uint256 time
    );

    event ERC1155ListingCancelled(uint256 indexed listingId);

    event ChangedListingFee(uint256 listingFeeInWei);

    function getListingFeeInWei() external view returns (uint256) {
        return s.listingFeeInWei;
    }

    function getERC1155Listing(uint256 _listingId) external view returns (ERC1155Listing memory listing_) {
        listing_ = s.erc1155Listings[_listingId];
    }

    function getERC1155ListingFromToken(
        address _erc1155TokenAddress,
        uint256 _erc1155TypeId,
        address _owner
    ) external view returns (ERC1155Listing memory listing_) {
        uint256 listingId = s.erc1155TokenToListingId[_erc1155TokenAddress][_erc1155TypeId][_owner];
        listing_ = s.erc1155Listings[listingId];
    }

    function getOwnerERC1155Listings(
        address _owner,
        uint256 _category,
        string memory _sort,
        uint256 _length // how many items to get back or the rest available
    ) external view returns (ERC1155Listing[] memory listings_) {
        uint256 listingId = s.erc1155OwnerListingHead[_owner][_category][_sort];
        listings_ = new ERC1155Listing[](_length);
        uint256 listIndex;
        for (; listingId != 0 && listIndex < _length; listIndex++) {
            listings_[listIndex] = s.erc1155Listings[listingId];
            listingId = s.erc1155OwnerListingListItem[_sort][listingId].childListingId;
        }
        assembly {
            mstore(listings_, listIndex)
        }
    }

    function getERC1155Listings(
        uint256 _category, // // 0 is wearable, 1 is badge, 2 is consumable, 3 is tickets
        string memory _sort, // "listed" or "purchased"
        uint256 _length // how many items to get back or the rest available
    ) external view returns (ERC1155Listing[] memory listings_) {
        uint256 listingId = s.erc1155ListingHead[_category][_sort];
        listings_ = new ERC1155Listing[](_length);
        uint256 listIndex;
        for (; listingId != 0 && listIndex < _length; listIndex++) {
            listings_[listIndex] = s.erc1155Listings[listingId];
            listingId = s.erc1155ListingListItem[_sort][listingId].childListingId;
        }
        assembly {
            mstore(listings_, listIndex)
        }
    }

    function setListingFee(uint256 _listingFeeInWei) external onlyDaoOrOwner {
        s.listingFeeInWei = _listingFeeInWei;
        emit ChangedListingFee(s.listingFeeInWei);
    }

    struct Category {
        address erc1155TokenAddress;
        uint256 erc1155TypeId;
        uint256 category;
    }

    function setERC1155Categories(Category[] calldata _categories) external onlyDaoOrOwner {
        for (uint256 i; i < _categories.length; i++) {
            s.erc1155Categories[_categories[i].erc1155TokenAddress][_categories[i].erc1155TypeId] = _categories[i].category;
        }
    }

    function getERC1155Category(address _erc1155TokenAddress, uint256 _erc1155TypeId) public view returns (uint256 category_) {
        category_ = s.erc1155Categories[_erc1155TokenAddress][_erc1155TypeId];
        if (category_ == 0) {
            require(
                _erc1155TokenAddress == address(this) && s.itemTypes[_erc1155TypeId].maxQuantity > 0,
                "ERC1155Marketplace: erc1155 item not supported"
            );
        }
    }

    function setERC1155Listing(
        address _erc1155TokenAddress,
        uint256 _erc1155TypeId,
        uint256 _quantity,
        uint256 _priceInWei
    ) external {
        address seller = LibMeta.msgSender();
        uint256 category = getERC1155Category(_erc1155TokenAddress, _erc1155TypeId);

        IERC1155 erc1155Token = IERC1155(_erc1155TokenAddress);
        require(erc1155Token.balanceOf(seller, _erc1155TypeId) >= _quantity, "ERC1155Marketplace: Not enough ERC1155 token");
        require(
            _erc1155TokenAddress == address(this) || erc1155Token.isApprovedForAll(seller, address(this)),
            "ERC1155Marketplace: Not approved for transfer"
        );

        uint256 cost = _quantity * _priceInWei;
        require(cost >= 1e18, "ERC1155Marketplace: cost should be 1 GHST or larger");

        uint256 listingId = s.erc1155TokenToListingId[_erc1155TokenAddress][_erc1155TypeId][seller];
        if (listingId == 0) {
            s.nextERC1155ListingId++;
            listingId = s.nextERC1155ListingId;
            s.erc1155TokenToListingId[_erc1155TokenAddress][_erc1155TypeId][seller] = listingId;
            s.erc1155Listings[listingId] = ERC1155Listing({
                listingId: listingId,
                seller: seller,
                erc1155TokenAddress: _erc1155TokenAddress,
                erc1155TypeId: _erc1155TypeId,
                category: category,
                quantity: _quantity,
                priceInWei: _priceInWei,
                timeCreated: block.timestamp,
                timeLastPurchased: 0,
                sourceListingId: 0,
                sold: false,
                cancelled: false
            });
            LibERC1155Marketplace.addERC1155ListingItem(seller, category, "listed", listingId);
            emit ERC1155ListingAdd(listingId, seller, _erc1155TokenAddress, _erc1155TypeId, category, _quantity, _priceInWei, block.timestamp);
        } else {
            ERC1155Listing storage listing = s.erc1155Listings[listingId];
            listing.quantity = _quantity;
            listing.priceInWei = _priceInWei;
            emit LibERC1155Marketplace.UpdateERC1155Listing(listingId, _quantity, _priceInWei, block.timestamp);
        }

        // Check if there's a publication fee and
        // transfer the amount to burn address
        if (s.listingFeeInWei > 0) {
            // burn address: address(0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF)
            LibERC20.transferFrom(s.ghstContract, LibMeta.msgSender(), address(0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF), s.listingFeeInWei);
        }
    }

    function cancelERC1155Listing(uint256 _listingId) external {
        LibERC1155Marketplace.cancelERC1155Listing(_listingId, LibMeta.msgSender());
    }

    function executeERC1155Listing(
        uint256 _listingId,
        uint256 _quantity,
        uint256 _priceInWei
    ) external {
        ERC1155Listing storage listing = s.erc1155Listings[_listingId];
        require(_priceInWei == listing.priceInWei, "ERC1155Marketplace: wrong price or price changed");
        require(listing.timeCreated != 0, "ERC1155Marketplace: listing not found");
        require(listing.sold == false, "ERC1155Marketplace: listing is sold out");
        require(listing.cancelled == false, "ERC1155Marketplace: listing is cancelled");
        address buyer = LibMeta.msgSender();
        address seller = listing.seller;
        require(seller != buyer, "ERC1155Marketplace: buyer can't be seller");
        require(_quantity > 0, "ERC1155Marketplace: _quantity can't be zero");
        require(_quantity <= listing.quantity, "ERC1155Marketplace: quantity is greater than listing");
        listing.quantity -= _quantity;
        uint256 cost = _quantity * _priceInWei;
        require(IERC20(s.ghstContract).balanceOf(buyer) >= cost, "ERC1155Marketplace: not enough GHST");
        {
            // handles stack too deep error
            uint256 daoShare = cost / 100;
            uint256 pixelCraftShare = (cost * 2) / 100;
            uint256 transferAmount = cost - (daoShare + pixelCraftShare);
            LibERC20.transferFrom(s.ghstContract, buyer, s.pixelCraft, pixelCraftShare);
            LibERC20.transferFrom(s.ghstContract, buyer, s.daoTreasury, daoShare);
            LibERC20.transferFrom(s.ghstContract, buyer, seller, transferAmount);

            listing.timeLastPurchased = block.timestamp;
            s.nextERC1155ListingId++;
            uint256 purchaseListingId = s.nextERC1155ListingId;
            s.erc1155Listings[purchaseListingId] = ERC1155Listing({
                listingId: purchaseListingId,
                seller: seller,
                erc1155TokenAddress: listing.erc1155TokenAddress,
                erc1155TypeId: listing.erc1155TypeId,
                category: listing.category,
                quantity: _quantity,
                priceInWei: _priceInWei,
                timeCreated: block.timestamp,
                timeLastPurchased: block.timestamp,
                sourceListingId: _listingId,
                sold: true,
                cancelled: false
            });
            LibERC1155Marketplace.addERC1155ListingItem(seller, listing.category, "purchased", purchaseListingId);
            if (listing.quantity == 0) {
                listing.sold = true;
                LibERC1155Marketplace.removeERC1155ListingItem(_listingId, seller);
            }
        }
        // Have to call it like this because LibMeta.msgSender() gets in the way
        if (listing.erc1155TokenAddress == address(this)) {
            LibItems.removeFromOwner(seller, listing.erc1155TypeId, _quantity);
            LibItems.addToOwner(buyer, listing.erc1155TypeId, _quantity);
            emit LibERC1155.TransferSingle(address(this), seller, buyer, listing.erc1155TypeId, _quantity);
            LibERC1155.onERC1155Received(address(this), seller, buyer, listing.erc1155TypeId, _quantity, "");
        } else {
            // GHSTStakingDiamond
            IERC1155(listing.erc1155TokenAddress).safeTransferFrom(seller, buyer, listing.erc1155TypeId, _quantity, new bytes(0));
        }
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

    function updateERC1155Listing(
        address _erc1155TokenAddress,
        uint256 _erc1155TypeId,
        address _owner
    ) external {
        LibERC1155Marketplace.updateERC1155Listing(_erc1155TokenAddress, _erc1155TypeId, _owner);
    }

    function updateBatchERC1155Listing(
        address _erc1155TokenAddress,
        uint256[] calldata _erc1155TypeIds,
        address _owner
    ) external {
        for (uint256 i; i < _erc1155TypeIds.length; i++) {
            LibERC1155Marketplace.updateERC1155Listing(_erc1155TokenAddress, _erc1155TypeIds[i], _owner);
        }
    }

    function cancelERC1155Listings(uint256[] calldata _listingIds) external onlyOwner {
        for (uint256 i; i < _listingIds.length; i++) {
            uint256 listingId = _listingIds[i];

            ERC1155Listing storage listing = s.erc1155Listings[listingId];
            if (listing.cancelled == true || listing.sold == true) {
                return;
            }
            listing.cancelled = true;
            emit LibERC1155Marketplace.ERC1155ListingCancelled(listingId, listing.category, block.number);
            LibERC1155Marketplace.removeERC1155ListingItem(listingId, listing.seller);
        }
    }
}
