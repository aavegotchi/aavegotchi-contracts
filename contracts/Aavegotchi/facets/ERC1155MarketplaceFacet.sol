// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {Modifiers} from "../libraries/LibAppStorage.sol";
import {LibERC1155Marketplace, ERC1155Listing} from "../libraries/LibERC1155Marketplace.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {IERC1155} from "../../shared/interfaces/IERC1155.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibItems} from "../libraries/LibItems.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";
import "../WearableDiamond/interfaces/IEventHandlerFacet.sol";
import {BaazaarSplit, LibSharedMarketplace, SplitAddresses} from "../libraries/LibSharedMarketplace.sol";

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

    event ERC1155ListingSplit(uint256 indexed listingId, uint16[2] principalSplit, address affiliate);
    event ERC1155ListingWhitelistSet(uint256 indexed listingId, uint32 whitelistId);

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

    ///@dev Is sent in tandem with ERC1155ExecutedListing
    event ERC1155ExecutedToRecipient(uint256 indexed listingId, address indexed buyer, address indexed recipient);

    event ChangedListingFee(uint256 listingFeeInWei);

    ///@notice Allow the aavegotchi diamond owner or DAO to set the default listing fee
    ///@param _listingFeeInWei The new listing fee in wei
    function setListingFee(uint256 _listingFeeInWei) external onlyDaoOrOwner {
        s.listingFeeInWei = _listingFeeInWei;
        emit ChangedListingFee(s.listingFeeInWei);
    }

    struct Category {
        address erc1155TokenAddress;
        uint256 erc1155TypeId;
        uint256 category;
    }

    ///@notice Allow the aavegotchi diamond owner or DAO to set the category details for multiple ERC1155 NFTs
    ///@param _categories An array of structs where each struct contains details about each ERC1155 item //erc1155TokenAddress,erc1155TypeId and category
    function setERC1155Categories(Category[] calldata _categories) external onlyItemManager {
        for (uint256 i; i < _categories.length; i++) {
            s.erc1155Categories[_categories[i].erc1155TokenAddress][_categories[i].erc1155TypeId] = _categories[i].category;
        }
    }

    ///@notice Query the category details of a ERC1155 NFT
    ///@param _erc1155TokenAddress Contract address of NFT to query
    ///@param _erc1155TypeId Identifier of the NFT to query
    ///@return category_ Category of the NFT // 0 is wearable, 1 is badge, 2 is consumable, 3 is tickets
    function getERC1155Category(address _erc1155TokenAddress, uint256 _erc1155TypeId) public view returns (uint256 category_) {
        if (_erc1155TokenAddress == s.forgeDiamond && _erc1155TypeId < 1_000_000_000) {
            //Schematics are always supported to trade, so long as the wearable exists
            //Schematic IDs are under 1_000_000_000 offset.
            category_ = 7;
            require(s.itemTypes[_erc1155TypeId].maxQuantity > 0, "ERC1155Marketplace: erc1155 item not supported");
        } else {
            category_ = s.erc1155Categories[_erc1155TokenAddress][_erc1155TypeId];
        }

        if (category_ == 0) {
            require(
                _erc1155TokenAddress == address(this) && s.itemTypes[_erc1155TypeId].maxQuantity > 0,
                "ERC1155Marketplace: erc1155 item not supported"
            );
        }
    }

    ///@notice Allow an ERC1155 owner to list his NFTs for sale
    ///@dev If an NFT has been listed before,it cancels it and replaces it with the new one
    ///@param _erc1155TokenAddress The contract address of the NFT to be listed
    ///@param _erc1155TypeId The identifier of the NFT to be listed
    ///@param _quantity The amount of NFTs to be listed
    ///@param _priceInWei The cost price of the NFT individually in $GHST
    function setERC1155Listing(address _erc1155TokenAddress, uint256 _erc1155TypeId, uint256 _quantity, uint256 _priceInWei) external {
        createERC1155Listing(_erc1155TokenAddress, _erc1155TypeId, _quantity, _priceInWei, [10000, 0], address(0), 0);
    }

    function setERC1155ListingWithSplit(
        address _erc1155TokenAddress,
        uint256 _erc1155TypeId,
        uint256 _quantity,
        uint256 _priceInWei,
        uint16[2] memory _principalSplit,
        address _affiliate
    ) external {
        createERC1155Listing(_erc1155TokenAddress, _erc1155TypeId, _quantity, _priceInWei, _principalSplit, _affiliate, 0);
    }

    //@dev Not implemented in UI yet. Do not use unless you don't want anyone purchasing your NFT.

    function setERC1155ListingWithWhitelist(
        address _erc1155TokenAddress,
        uint256 _erc1155TypeId,
        uint256 _quantity,
        uint256 _priceInWei,
        uint16[2] memory _principalSplit,
        address _affiliate,
        uint32 _whitelistId
    ) external {
        createERC1155Listing(_erc1155TokenAddress, _erc1155TypeId, _quantity, _priceInWei, _principalSplit, _affiliate, _whitelistId);
    }

    function createERC1155Listing(
        address _erc1155TokenAddress,
        uint256 _erc1155TypeId,
        uint256 _quantity,
        uint256 _priceInWei,
        uint16[2] memory _principalSplit,
        address _affiliate,
        uint32 _whitelistId
    ) internal {
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
        require(_principalSplit[0] + _principalSplit[1] == 10000, "ERC1155Marketplace: Sum of principal splits not 10000");
        if (_affiliate == address(0)) {
            require(_principalSplit[1] == 0, "ERC1155Marketplace: Affiliate split must be 0 for address(0)");
        }

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
                cancelled: false,
                principalSplit: _principalSplit,
                affiliate: _affiliate,
                whitelistId: _whitelistId
            });
            LibERC1155Marketplace.addERC1155ListingItem(seller, category, "listed", listingId);

            emit ERC1155ListingAdd(listingId, seller, _erc1155TokenAddress, _erc1155TypeId, category, _quantity, _priceInWei, block.timestamp);

            if (_affiliate != address(0)) {
                emit ERC1155ListingSplit(listingId, _principalSplit, _affiliate);
            }
            if (_whitelistId != 0) {
                emit ERC1155ListingWhitelistSet(listingId, _whitelistId);
            }
        } else {
            ERC1155Listing storage listing = s.erc1155Listings[listingId];
            listing.quantity = _quantity;
            emit LibERC1155Marketplace.UpdateERC1155Listing(listingId, _quantity, listing.priceInWei, block.timestamp);
        }

        //Burn listing fee
        if (s.listingFeeInWei > 0) {
            LibSharedMarketplace.burnListingFee(s.listingFeeInWei, LibMeta.msgSender(), s.ghstContract);
        }
    }

    ///@notice Allow an ERC1155 owner to cancel his NFT listing through the listingID
    ///@param _listingId The identifier of the listing to be cancelled

    function cancelERC1155Listing(uint256 _listingId) external {
        LibERC1155Marketplace.cancelERC1155Listing(_listingId, LibMeta.msgSender());
    }

    ///@notice Allow a buyer to execcute an open listing i.e buy the NFT
    ///@dev Will throw if the NFT has been sold or if the listing has been cancelled already
    ///@dev Will be deprecated soon.
    ///@param _listingId The identifier of the listing to execute
    ///@param _quantity The amount of ERC1155 NFTs execute/buy
    ///@param _priceInWei the cost price of the ERC1155 NFTs individually
    function executeERC1155Listing(uint256 _listingId, uint256 _quantity, uint256 _priceInWei) external {
        ERC1155Listing storage listing = s.erc1155Listings[_listingId];
        handleExecuteERC1155Listing(_listingId, listing.erc1155TokenAddress, listing.erc1155TypeId, _quantity, _priceInWei, LibMeta.msgSender());
    }

    ///@notice Allow a buyer to execcute an open listing i.e buy the NFT on behalf of the recipient. Also checks to ensure the item details match the listing.
    ///@dev Will throw if the NFT has been sold or if the listing has been cancelled already
    ///@param _listingId The identifier of the listing to execute
    ///@param _contractAddress The token contract address
    ///@param _itemId the erc1155 token id
    ///@param _quantity The amount of ERC1155 NFTs execute/buy
    ///@param _priceInWei the cost price of the ERC1155 NFTs individually
    ///@param _recipient the recipient of the item
    function executeERC1155ListingToRecipient(
        uint256 _listingId,
        address _contractAddress,
        uint256 _itemId,
        uint256 _quantity,
        uint256 _priceInWei,
        address _recipient
    ) external {
        handleExecuteERC1155Listing(_listingId, _contractAddress, _itemId, _quantity, _priceInWei, _recipient);
    }

    ///@param listingId The identifier of the listing to execute
    ///@param contractAddress The token contract address
    ///@param itemId the erc1155 token id
    ///@param quantity The amount of ERC1155 NFTs execute/buy
    ///@param priceInWei The price of the item
    ///@param recipient The address to receive the NFT
    struct ExecuteERC1155ListingParams {
        uint256 listingId;
        address contractAddress;
        uint256 itemId;
        uint256 quantity;
        uint256 priceInWei;
        address recipient;
    }

    ///@notice execute ERC1155 listings in batch
    function batchExecuteERC1155Listing(ExecuteERC1155ListingParams[] calldata listings) external {
        require(listings.length <= 10, "ERC1155Marketplace: length should be lower than 10");
        for (uint256 i = 0; i < listings.length; i++) {
            handleExecuteERC1155Listing(
                listings[i].listingId,
                listings[i].contractAddress,
                listings[i].itemId,
                listings[i].quantity,
                listings[i].priceInWei,
                listings[i].recipient
            );
        }
    }

    function handleExecuteERC1155Listing(
        uint256 _listingId,
        address _contractAddress,
        uint256 _itemId,
        uint256 _quantity,
        uint256 _priceInWei,
        address _recipient
    ) internal {
        ERC1155Listing storage listing = s.erc1155Listings[_listingId];
        require(listing.timeCreated != 0, "ERC1155Marketplace: listing not found");
        require(listing.sold == false, "ERC1155Marketplace: listing is sold out");
        require(listing.cancelled == false, "ERC1155Marketplace: listing is cancelled");
        require(_priceInWei == listing.priceInWei, "ERC1155Marketplace: wrong price or price changed");
        require(listing.erc1155TokenAddress == _contractAddress, "ERC1155Marketplace: Incorrect token address");
        require(listing.erc1155TypeId == _itemId, "ERC1155Marketplace: Incorrect token id");
        address buyer = LibMeta.msgSender();
        address seller = listing.seller;
        require(seller != buyer, "ERC1155Marketplace: buyer can't be seller");
        if (listing.whitelistId > 0) {
            require(s.isWhitelisted[listing.whitelistId][buyer] > 0, "ERC1155Marketplace: Not whitelisted address");
        }
        require(_quantity > 0, "ERC1155Marketplace: _quantity can't be zero");
        require(_quantity <= listing.quantity, "ERC1155Marketplace: quantity is greater than listing");
        listing.quantity -= _quantity;
        uint256 cost = _quantity * _priceInWei;
        require(IERC20(s.ghstContract).balanceOf(buyer) >= cost, "ERC1155Marketplace: not enough GHST");
        {
            BaazaarSplit memory split = LibSharedMarketplace.getBaazaarSplit(
                cost,
                new uint256[](0),
                listing.affiliate == address(0) ? [10000, 0] : listing.principalSplit
            );

            LibSharedMarketplace.transferSales(
                SplitAddresses({
                    ghstContract: s.ghstContract,
                    buyer: buyer,
                    seller: seller,
                    affiliate: listing.affiliate,
                    royalties: new address[](0),
                    daoTreasury: s.daoTreasury,
                    pixelCraft: s.pixelCraft,
                    rarityFarming: s.rarityFarming
                }),
                split
            );

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
                cancelled: false,
                principalSplit: listing.principalSplit,
                affiliate: listing.affiliate,
                whitelistId: listing.whitelistId
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
            LibItems.addToOwner(_recipient, listing.erc1155TypeId, _quantity);
            IEventHandlerFacet(s.wearableDiamond).emitTransferSingleEvent(address(this), seller, _recipient, listing.erc1155TypeId, _quantity);
            LibERC1155.onERC1155Received(address(this), seller, _recipient, listing.erc1155TypeId, _quantity, "");
        } else {
            // GHSTStakingDiamond
            IERC1155(listing.erc1155TokenAddress).safeTransferFrom(seller, _recipient, listing.erc1155TypeId, _quantity, new bytes(0));
        }
        emit ERC1155ExecutedListing(
            _listingId,
            seller,
            _recipient,
            listing.erc1155TokenAddress,
            listing.erc1155TypeId,
            listing.category,
            _quantity,
            listing.priceInWei,
            block.timestamp
        );

        //Only emit if buyer is not recipient
        if (buyer != _recipient) {
            emit ERC1155ExecutedToRecipient(_listingId, buyer, _recipient);
        }
    }

    ///@notice Update the ERC1155 listing of an address
    ///@param _erc1155TokenAddress Contract address of the ERC1155 token
    ///@param _erc1155TypeId Identifier of the ERC1155 token
    ///@param _owner Owner of the ERC1155 token
    function updateERC1155Listing(address _erc1155TokenAddress, uint256 _erc1155TypeId, address _owner) external {
        LibERC1155Marketplace.updateERC1155Listing(_erc1155TokenAddress, _erc1155TypeId, _owner);
    }

    ///@notice Update the ERC1155 listings of an address
    ///@param _erc1155TokenAddress Contract address of the ERC1155 token
    ///@param _erc1155TypeIds An array containing the identifiers of the ERC1155 tokens to update
    ///@param _owner Owner of the ERC1155 tokens
    function updateBatchERC1155Listing(address _erc1155TokenAddress, uint256[] calldata _erc1155TypeIds, address _owner) external {
        for (uint256 i; i < _erc1155TypeIds.length; i++) {
            LibERC1155Marketplace.updateERC1155Listing(_erc1155TokenAddress, _erc1155TypeIds[i], _owner);
        }
    }

    ///@notice Allow an ERC1155 owner to cancel his NFT listings through the listingIDs
    ///@param _listingIds An array containing the identifiers of the listings to be cancelled
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

    ///@notice Allow an ERC1155 owner to update list price of his NFT for sale
    ///@dev If the NFT has not been listed before, it will be rejected
    ///@param _listingId The identifier of the listing to execute
    ///@param _quantity The amount of ERC1155 NFTs execute/buy
    ///@param _priceInWei The price of the item
    function updateERC1155ListingPriceAndQuantity(uint256 _listingId, uint256 _quantity, uint256 _priceInWei) external {
        LibERC1155Marketplace.updateERC1155ListingPriceAndQuantity(_listingId, _quantity, _priceInWei);
        if (s.listingFeeInWei > 0) {
            LibSharedMarketplace.burnListingFee(s.listingFeeInWei, LibMeta.msgSender(), s.ghstContract);
        }
    }

    function batchUpdateERC1155ListingPriceAndQuantity(
        uint256[] calldata _listingIds,
        uint256[] calldata _quantities,
        uint256[] calldata _priceInWeis
    ) external {
        require(_listingIds.length == _quantities.length, "ERC1155Marketplace: listing ids not same length as quantities");
        require(_listingIds.length == _priceInWeis.length, "ERC1155Marketplace: listing ids not same length as prices");

        for (uint256 i; i < _listingIds.length; i++) {
            LibERC1155Marketplace.updateERC1155ListingPriceAndQuantity(_listingIds[i], _quantities[i], _priceInWeis[i]);
        }

        if (s.listingFeeInWei > 0) {
            uint256 totalFee = s.listingFeeInWei * _listingIds.length;
            LibSharedMarketplace.burnListingFee(totalFee, LibMeta.msgSender(), s.ghstContract);
        }
    }
}
