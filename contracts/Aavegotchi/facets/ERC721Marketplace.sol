// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

import "../libraries/LibAppStorage.sol";
import "../interfaces/IERC721.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibMath.sol";

import "hardhat/console.sol";

contract ERC721MarketplaceFacet is LibAppStorageModifiers {
    event ERC721ListingSet(
        bytes32 indexed listingId,
        address indexed seller,
        address erc721TokenAddress,
        uint256 erc721TypeId,
        uint256 indexed category,
        uint256 time
    );

    event ERC721ExecutedListing(
        bytes32 indexed listingId,
        address indexed seller,
        address buyer,
        address erc721TokenAddress,
        uint256 erc721TypeId,
        uint256 indexed category,
        uint256 priceInWei,
        uint256 time
    );

    event UpdateERC721Listing(bytes32 indexed _listingId, uint256 quantity);

    event ERC721ListingCancelled(bytes32 indexed listingId);

    event ChangedListingFee(uint256 listingFeeInWei);

    // struct ERC721Listing {
    //     address seller;
    //     address erc721TokenAddress;
    //     uint256 erc721TokenId;
    //     uint256 category; // 0 is closed portal, 1 is open portal, 2 is Aavegotchi
    //     uint256 priceInWei;
    //     uint256 timeCreated;
    //     uint256 timeLastPurchased;
    // }

    function getERC721Listings(
        uint256 _category, // 0 is closed portal, 1 is open portal, 2 is Aavegotchi
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

    function toERC721ListingId(
        address _erc721TokenAddress,
        uint256 _erc721TokenId,
        address _user
    ) internal pure returns (bytes32 listingId_) {
        listingId_ = keccak256(abi.encodePacked(_erc721TokenAddress, _erc721TokenId, _user));
    }

    function getERC721Category(address _erc721TokenAddress, uint256 _erc721TokenId) public view returns (uint256 category_) {
        require(_erc721TokenAddress == address(this), "Marketplace: ERC721 category does not exist");
        category_ = s.aavegotchis[_erc721TokenId].status; // 0 == portal, 1 == vrf pending, 1 == open portal, 2 == Aavegotchi
    }

    function removeERC721ListingItem(string memory _sort, bytes32 _listingId) internal {
        ListingListItem storage listingItem = s.erc721ListingListItem[_sort][_listingId];
        if (listingItem.listingId == 0) {
            return;
        }
        bytes32 parentListingId = listingItem.parentListingId;
        if (parentListingId != 0) {
            ListingListItem storage parentListingItem = s.erc721ListingListItem[_sort][parentListingId];
            parentListingItem.childListingId = listingItem.childListingId;
        }
        bytes32 childListingId = listingItem.childListingId;
        if (childListingId != 0) {
            ListingListItem storage childListingItem = s.erc721ListingListItem[_sort][childListingId];
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
        IERC721 erc721Token = IERC721(_erc721TokenAddress);
        address owner = LibMeta.msgSender();
        require(erc721Token.ownerOf(_erc721TokenId) == owner, "Marketplace: Not owner of ERC721 token");
        require(_erc721TokenAddress == address(this) || erc721Token.isApprovedForAll(owner, address(this)), "Marketplace: Not approved for transfer");

        require(_priceInWei >= 1e18, "Marketplace: price should be 1 GHST or larger");
        bytes32 listingId = toERC721ListingId(_erc721TokenAddress, _erc721TokenId, owner);

        uint256 category = getERC721Category(_erc721TokenAddress, _erc721TokenId);
        require(category != 1, "Marketplace: Cannot list a portal that is pending VRF");

        ERC721Listing storage listing = s.erc721Listings[listingId];
        // removeERC721ListingItem("listed", listingId);
        // if (_priceInWei != listing.priceInWei) {
        //     removeERC721ListingItem("purchased", listingId);
        // }

        if (listing.timeCreated == 0) {
            s.erc721Listings[listingId] = ERC721Listing({
                listingId: listingId,
                seller: owner,
                erc721TokenAddress: _erc721TokenAddress,
                erc721TokenId: _erc721TokenId,
                category: category,
                priceInWei: _priceInWei,
                timeCreated: block.timestamp,
                timeLastPurchased: 0,
                sold: false,
                cancelled: false
            });
            //s.userListingIds[LibMeta.msgSender()].push(listingId);
            ListingListItem storage ownerListingItem = s.erc721OwnerListingListItem[owner][listingId];
            ownerListingItem.childListingId = s.erc721OwnerListingHead[owner];
            s.erc721OwnerListingHead[owner] = listingId;
            ownerListingItem.listingId = listingId;
        } else {
            listing.priceInWei = _priceInWei;
            listing.sold = false;
            listing.cancelled = false;
        }

        // Check if there's a publication fee and
        // transfer the amount to burn address
        if (s.listingFeeInWei > 0) {
            // burn address: address(0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF)
            LibERC20.transferFrom(s.ghstContract, owner, address(0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF), s.listingFeeInWei);
        }

        ListingListItem storage listingItem = s.erc721ListingListItem["listed"][listingId];
        listingItem.childListingId = s.erc721ListingHead[category]["listed"];
        s.erc721ListingHead[category]["listed"] = listingId;
        listingItem.listingId = listingId;

        emit ERC721ListingSet(listingId, owner, _erc721TokenAddress, _erc721TokenId, category, _priceInWei);
    }

    function cancelERC721Listing(bytes32 _listingId) external {
        ListingListItem storage listingItem = s.erc721ListingListItem["listed"][_listingId];
        require(listingItem.listingId != 0, "Marketplace Listing doesn't exist");
        ERC721Listing storage listing = s.erc721Listings[_listingId];
        require(listing.cancelled == false, "Marketplace Listing doesn't exist");
        require(listing.seller == LibMeta.msgSender(), "Marketplace: Only seller can cancel listing.");
        listing.cancelled = true;
        emit ERC721ListingCancelled(_listingId);
        removeERC721ListingItem("listed", _listingId);
    }

    function executeERC721Listing(bytes32 _listingId) external {
        ERC721Listing storage listing = s.erc721Listings[_listingId];
        require(listing.timeCreated != 0, "Marketplace: listing not found");
        address buyer = LibMeta.msgSender();
        address seller = listing.seller;
        require(seller != buyer, "Marketplace: buyer can't be seller");
        require(IERC20(s.ghstContract).balanceOf(buyer) >= listing.priceInWei, "Marketplace: not enough GHST");
        uint256 daoShare = listing.priceInWei / 100;
        uint256 pixelCraftShare = LibMath.mul(listing.priceInWei, 2) / 100;
        uint256 transferAmount = listing.priceInWei - (daoShare + pixelCraftShare);
        LibERC20.transferFrom(s.ghstContract, buyer, s.pixelCraft, pixelCraftShare);
        LibERC20.transferFrom(s.ghstContract, buyer, s.daoTreasury, daoShare);
        LibERC20.transferFrom(s.ghstContract, buyer, seller, transferAmount);
        // Have to call it like this because LibMeta.msgSender() gets in the way
        if (listing.erc721TokenAddress == address(this)) {
            bytes memory myFunctionCall =
                abi.encodeWithSelector(
                    0xb88d4fde, // safeTransferFrom(address,address,uint256,bytes) IERC721.safeTransferFrom.selector,
                    seller, // from
                    buyer, // to
                    listing.erc721TokenId,
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
            IERC721(listing.erc721TokenAddress).safeTransferFrom(seller, buyer, listing.erc721TokenId, new bytes(0));
        }
        removeERC721ListingItem("purchased", _listingId);
        listing.timeLastPurchased = block.timestamp;
        ListingListItem storage listingItem = s.erc721ListingListItem["purchased"][_listingId];
        listingItem.childListingId = s.erc721ListingHead[listing.category]["purchased"];
        s.erc721ListingHead[listing.category]["purchased"] = _listingId;
        listingItem.listingId = _listingId;

        //s.erc721MarketListingIds[category]["purchased"].push(listingId);
        emit ERC721ExecutedListing(
            _listingId,
            seller,
            buyer,
            listing.erc721TokenAddress,
            listing.erc721TokenId,
            listing.category,
            listing.priceInWei,
            block.timestamp
        );
    }

    // function updateERC721Listing(bytes32 _listingId) external {
    //     ERC721Listing storage listing = s.erc721Listings[_listingId];
    //     if (listing.timeCreated == 0) {
    //         return;
    //     }
    //     uint256 quantity = listing.quantity;
    //     if (quantity > 0) {
    //         quantity = IERC721(listing.erc721TokenAddress).balanceOf(listing.seller, listing.erc721TypeId);
    //         if (quantity < listing.quantity) {
    //             listing.quantity = quantity;
    //             emit UpdateERC721Listing(_listingId, quantity);
    //         }
    //     }
    //     if (quantity == 0) {
    //         removeERC721ListingItem("listed", _listingId);
    //         removeERC721ListingItem("purchased", _listingId);
    //     }
    // }
}
