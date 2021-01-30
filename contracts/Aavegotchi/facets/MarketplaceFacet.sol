// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

// The code in this facet was taken and modified from Decentraland Marketplace Contracts,
// this repository: https://github.com/decentraland/marketplace-contracts

// import "openzeppelin-zos/contracts/ownership/Ownable.sol";
// import "openzeppelin-zos/contracts/lifecycle/Pausable.sol";
// import "openzeppelin-zos/contracts/math/SafeMath.sol";
// import "openzeppelin-zos/contracts/AddressUtils.sol";
// import "zos-lib/contracts/migrations/Migratable.sol";
import "../libraries/LibAppStorage.sol";
import "../interfaces/IERC1155.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibMath.sol";

// import "./MarketplaceStorage.sol";

// is Migratable, Ownable, Pausable, MarketplaceStorage
contract Marketplace is LibAppStorageModifiers {
    // using SafeMath for uint256;
    //using AddressUtils for address;
    // bytes4 public constant InterfaceId_ValidateFingerprint = bytes4(keccak256("verifyFingerprint(uint256,bytes)"));

    // bytes4 public constant ERC721_Interface = bytes4(0x80ac58cd);

    // EVENTS
    event ERC1155ListingSet(
        bytes32 listingId,
        address seller,
        address erc1155TokenAddress,
        uint256 erc1155TypeId,
        uint256 category,
        uint256 quantity,
        uint256 priceInWei,
        uint256 expires
    );

    event ERC1155ListingCancelled(bytes32 listingId);

    event ChangedListingFee(uint256 listingFeeInWei);
    event ChangedOwnerCutPerMillion(uint256 ownerCutPerMillion);

    function setListingFee(uint256 _listingFeeInWei) external onlyOwner {
        s.listingFeeInWei = _listingFeeInWei;
        emit ChangedListingFee(s.listingFeeInWei);
    }

    function setOwnerCutPerMillion(uint256 _ownerCutPerMillion) external onlyOwner {
        require(_ownerCutPerMillion < 1000000, "The owner cut should be between 0 and 999,999");

        s.ownerCutPerMillion = _ownerCutPerMillion;
        emit ChangedOwnerCutPerMillion(s.ownerCutPerMillion);
    }

    function getERC1155Category(address _erc1155TokenAddress, uint256 _erc1155TypeId) internal view returns (uint256 category_) {
        category_ = s.erc1155Categories[_erc1155TokenAddress][_erc1155TypeId];
        if (category_ == 0) {
            require(_erc1155TokenAddress == address(this) && s.itemTypes[_erc1155TypeId].maxQuantity > 0, "Marketplace: erc1155 item not supported");
        }
    }

    function setERC1122Listing(
        address _erc1155TokenAddress,
        uint256 _erc1155TypeId,
        uint256 _quantity,
        uint256 _priceInWei,
        uint256 _expires
    ) public {
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
        ERC1155Listing storage listing = s.erc1155MarketListings[listingId];
        if (listing.timeCreated == 0) {
            s.erc1155MarketListings[listingId] = ERC1155Listing({
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

        // category => ("listing" or "sold" => listingIds)
        // mapping(uint256 => mapping(string => bytes32[])) erc1155MarketListingIds;
        s.erc1155MarketListingIds[category]["listing"].push(listingId);

        emit ERC1155ListingSet(listingId, LibMeta.msgSender(), _erc1155TokenAddress, _erc1155TypeId, category, _quantity, _priceInWei, _expires);
    }

    function cancelERC1155Listing(bytes32 _listingId) public {
        ERC1155Listing storage listing = s.erc1155MarketListings[_listingId];

        require(listing.seller == LibMeta.msgSender(), "Marketplace: Only seller can cancel listing.");
        listing.quantity = 0;

        emit ERC1155ListingCancelled(_listingId);
    }

    function executeERC1155Listing(bytes32 _listingId, uint256 _quantity) public {
        ERC1155Listing storage listing = s.erc1155MarketListings[_listingId];
        require(listing.timeCreated != 0, "Marketplace: listing not found");
        uint256 listingQuantity = listing.quantity;
        address buyer = LibMeta.msgSender();
        address seller = listing.seller;
        require(seller != buyer, "Marketplace: buyer can't be seller");
        require(_quantity > 0, "Marketplace: _quantity can't be zero");
        require(_quantity <= listingQuantity, "Marketplace: quantity is greater than listing");
        require(listing.expires > block.timestamp, "Marketplace: listing has expired");
        uint256 bal = IERC20(s.ghstContract).balanceOf(buyer);
        uint256 cost = LibMath.mul(_quantity, listing.priceInWei);
        require(bal >= cost, "Marketplace: not enough GHST");
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
    }

    function updateListing(bytes32 _listingId) public {}
}
