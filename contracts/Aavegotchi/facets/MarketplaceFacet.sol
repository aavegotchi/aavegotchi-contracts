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

// import "./MarketplaceStorage.sol";

// is Migratable, Ownable, Pausable, MarketplaceStorage
contract Marketplace is LibAppStorageModifiers {
    // using SafeMath for uint256;
    //using AddressUtils for address;
    bytes4 public constant InterfaceId_ValidateFingerprint = bytes4(keccak256("verifyFingerprint(uint256,bytes)"));

    bytes4 public constant ERC721_Interface = bytes4(0x80ac58cd);

    // EVENTS
    event OrderCreated(bytes32 id, uint256 indexed assetId, address indexed seller, address nftAddress, uint256 priceInWei, uint256 expiresAt);
    event OrderSuccessful(bytes32 id, uint256 indexed assetId, address indexed seller, address nftAddress, uint256 totalPrice, address indexed buyer);
    event OrderCancelled(bytes32 id, uint256 indexed assetId, address indexed seller, address nftAddress);

    event ChangedPublicationFee(uint256 publicationFee);
    event ChangedOwnerCutPerMillion(uint256 ownerCutPerMillion);

    /**
     * @dev Sets the publication fee that's charged to users to publish items
     * @param _publicationFee - Fee amount in wei this contract charges to publish an item
     */
    function setPublicationFee(uint256 _publicationFee) external onlyOwner {
        publicationFeeInWei = _publicationFee;
        emit ChangedPublicationFee(publicationFeeInWei);
    }

    /**
     * @dev Sets the share cut for the owner of the contract that's
     *  charged to the seller on a successful sale
     * @param _ownerCutPerMillion - Share amount, from 0 to 999,999
     */
    function setOwnerCutPerMillion(uint256 _ownerCutPerMillion) external onlyOwner {
        require(_ownerCutPerMillion < 1000000, "The owner cut should be between 0 and 999,999");

        ownerCutPerMillion = _ownerCutPerMillion;
        emit ChangedOwnerCutPerMillion(ownerCutPerMillion);
    }

    /**
     * @dev Initialize this contract. Acts as a constructor
     * @param _acceptedToken - Address of the ERC20 accepted for this marketplace
     * @param _legacyNFTAddress - Address of the NFT address used for legacy methods that don't have nftAddress as parameter
     */
    function initialize(
        address _acceptedToken,
        address _legacyNFTAddress,
        address _owner
    ) public isInitializer("Marketplace", "0.0.1") {
        // msg.sender is the App contract not the real owner. Calls ownable behind the scenes...sigh
        require(_owner != address(0), "Invalid owner");
        Pausable.initialize(_owner);

        require(_acceptedToken.isContract(), "The accepted token address must be a deployed contract");
        acceptedToken = ERC20Interface(_acceptedToken);

        _requireERC721(_legacyNFTAddress);
        legacyNFTAddress = _legacyNFTAddress;
    }

    /**
     * @dev Creates a new order
     * @param nftAddress - Non fungible registry address
     * @param assetId - ID of the published NFT
     * @param priceInWei - Price in Wei for the supported coin
     * @param expiresAt - Duration of the order (in hours)
     */
    function createOrder(
        address nftAddress,
        uint256 assetId,
        uint256 priceInWei,
        uint256 expiresAt
    ) public whenNotPaused {
        _createOrder(nftAddress, assetId, priceInWei, expiresAt);
    }

    /**
     * @dev Cancel an already published order
     *  can only be canceled by seller or the contract owner
     * @param nftAddress - Address of the NFT registry
     * @param assetId - ID of the published NFT
     */
    function cancelOrder(address nftAddress, uint256 assetId) public whenNotPaused {
        _cancelOrder(nftAddress, assetId);
    }

    /**
     * @dev Executes the sale for a published NFT and checks for the asset fingerprint
     * @param nftAddress - Address of the NFT registry
     * @param assetId - ID of the published NFT
     * @param price - Order price
     * @param fingerprint - Verification info for the asset
     */
    function safeExecuteOrder(
        address nftAddress,
        uint256 assetId,
        uint256 price,
        bytes fingerprint
    ) public whenNotPaused {
        _executeOrder(nftAddress, assetId, price, fingerprint);
    }

    /**
     * @dev Executes the sale for a published NFT
     * @param nftAddress - Address of the NFT registry
     * @param assetId - ID of the published NFT
     * @param price - Order price
     */
    function executeOrder(
        address nftAddress,
        uint256 assetId,
        uint256 price
    ) public whenNotPaused {
        _executeOrder(nftAddress, assetId, price, "");
    }

    /**
     * @dev Creates a new order
     * @param nftAddress - Non fungible registry address
     * @param assetId - ID of the published NFT
     * @param priceInWei - Price in Wei for the supported coin
     * @param expiresAt - Duration of the order (in hours)
     */
    function _createOrder(
        address nftAddress,
        uint256 assetId,
        uint256 priceInWei,
        uint256 expiresAt
    ) internal {
        _requireERC721(nftAddress);

        ERC721Interface nftRegistry = ERC721Interface(nftAddress);
        address assetOwner = nftRegistry.ownerOf(assetId);

        require(msg.sender == assetOwner, "Only the owner can create orders");
        require(
            nftRegistry.getApproved(assetId) == address(this) || nftRegistry.isApprovedForAll(assetOwner, address(this)),
            "The contract is not authorized to manage the asset"
        );
        require(priceInWei > 0, "Price should be bigger than 0");
        require(expiresAt > block.timestamp + 1 minutes, "Publication should be more than 1 minute in the future");

        bytes32 orderId = keccak256(abi.encodePacked(block.timestamp, assetOwner, assetId, nftAddress, priceInWei));

        s.orderByAssetId[nftAddress][assetId] = Order({
            id: orderId,
            seller: assetOwner,
            nftAddress: nftAddress,
            price: priceInWei,
            expiresAt: expiresAt
        });

        // Check if there's a publication fee and
        // transfer the amount to marketplace owner
        if (publicationFeeInWei > 0) {
            require(
                acceptedToken.transferFrom(msg.sender, owner, publicationFeeInWei),
                "Transfering the publication fee to the Marketplace owner failed"
            );
        }

        emit OrderCreated(orderId, assetId, assetOwner, nftAddress, priceInWei, expiresAt);
    }

    /**
     * @dev Cancel an already published order
     *  can only be canceled by seller or the contract owner
     * @param nftAddress - Address of the NFT registry
     * @param assetId - ID of the published NFT
     */
    function _cancelOrder(address nftAddress, uint256 assetId) internal returns (Order) {
        Order memory order = orderByAssetId[nftAddress][assetId];

        require(order.id != 0, "Asset not published");
        require(order.seller == msg.sender || msg.sender == owner, "Unauthorized user");

        bytes32 orderId = order.id;
        address orderSeller = order.seller;
        address orderNftAddress = order.nftAddress;
        delete orderByAssetId[nftAddress][assetId];

        emit OrderCancelled(orderId, assetId, orderSeller, orderNftAddress);

        return order;
    }

    /**
     * @dev Executes the sale for a published NFT
     * @param nftAddress - Address of the NFT registry
     * @param assetId - ID of the published NFT
     * @param price - Order price
     * @param fingerprint - Verification info for the asset
     */
    function _executeOrder(
        address nftAddress,
        uint256 assetId,
        uint256 price,
        bytes fingerprint
    ) internal returns (Order) {
        _requireERC721(nftAddress);

        ERC721Verifiable nftRegistry = ERC721Verifiable(nftAddress);

        if (nftRegistry.supportsInterface(InterfaceId_ValidateFingerprint)) {
            require(nftRegistry.verifyFingerprint(assetId, fingerprint), "The asset fingerprint is not valid");
        }
        Order memory order = orderByAssetId[nftAddress][assetId];

        require(order.id != 0, "Asset not published");

        address seller = order.seller;

        require(seller != address(0), "Invalid address");
        require(seller != msg.sender, "Unauthorized user");
        require(order.price == price, "The price is not correct");
        require(block.timestamp < order.expiresAt, "The order expired");
        require(seller == nftRegistry.ownerOf(assetId), "The seller is no longer the owner");

        uint256 saleShareAmount = 0;

        bytes32 orderId = order.id;
        delete orderByAssetId[nftAddress][assetId];

        if (ownerCutPerMillion > 0) {
            // Calculate sale share
            saleShareAmount = price.mul(ownerCutPerMillion).div(1000000);

            // Transfer share amount for marketplace Owner
            require(acceptedToken.transferFrom(msg.sender, owner, saleShareAmount), "Transfering the cut to the Marketplace owner failed");
        }

        // Transfer sale amount to seller
        require(acceptedToken.transferFrom(msg.sender, seller, price.sub(saleShareAmount)), "Transfering the sale amount to the seller failed");

        // Transfer asset owner
        nftRegistry.safeTransferFrom(seller, msg.sender, assetId);

        emit OrderSuccessful(orderId, assetId, seller, nftAddress, price, msg.sender);

        return order;
    }

    function _requireERC721(address nftAddress) internal view {
        require(nftAddress.isContract(), "The NFT Address should be a contract");

        ERC721Interface nftRegistry = ERC721Interface(nftAddress);
        require(nftRegistry.supportsInterface(ERC721_Interface), "The NFT contract has an invalid ERC721 implementation");
    }
}
