// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;
import {LibAppStorage, AppStorage} from "./LibAppStorage.sol";

struct BaazaarSplit {
    uint256 daoShare;
    uint256 pixelcraftShare;
    uint256 playerRewardsShare;
    uint256 sellerShare;
    uint256 affiliateShare;
    uint256[] royaltyShares;
}

struct SplitAddresses {
    address buyer;
    address seller;
    address affiliate;
    address[] royalties;
    address daoTreasury;
    address pixelCraft;
    address rarityFarming;
}

library LibSharedMarketplace {
    function getBaazaarSplit(
        uint256 _amount,
        uint256[] memory _royaltyShares,
        uint16[2] memory _principalSplit
    ) internal pure returns (BaazaarSplit memory) {
        //Add up all the royalty amounts
        uint256 royaltyShares;
        for (uint256 i = 0; i < _royaltyShares.length; i++) {
            royaltyShares += _royaltyShares[i];
        }

        uint256 daoShare = _amount / 100; //1%
        uint256 pixelcraftShare = (_amount * 2) / 100; //2%
        uint256 playerRewardsShare = _amount / 200; //0.5%
        uint256 principal = _amount - royaltyShares - (daoShare + pixelcraftShare + playerRewardsShare); //96.5%-royalty

        uint256 sellerShare = (principal * _principalSplit[0]) / 10000;
        uint256 affiliateShare = (principal * _principalSplit[1]) / 10000;

        return
            BaazaarSplit({
                daoShare: daoShare,
                pixelcraftShare: pixelcraftShare,
                playerRewardsShare: playerRewardsShare,
                sellerShare: sellerShare,
                affiliateShare: affiliateShare,
                royaltyShares: _royaltyShares
            });
    }

    function transferSales(SplitAddresses memory _a, BaazaarSplit memory split) internal {
        if (_a.buyer == address(this)) {
            (bool success, ) = payable(_a.pixelCraft).call{value: split.pixelcraftShare}("");
            require(success, "ETH transfer to pixelCraft failed");

            (success, ) = payable(_a.daoTreasury).call{value: split.daoShare}("");
            require(success, "ETH transfer to daoTreasury failed");

            (success, ) = payable(_a.rarityFarming).call{value: split.playerRewardsShare}("");
            require(success, "ETH transfer to rarityFarming failed");

            (success, ) = payable(_a.seller).call{value: split.sellerShare}("");
            require(success, "ETH transfer to seller failed");

            //handle affiliate split if necessary
            if (split.affiliateShare > 0) {
                (success, ) = payable(_a.affiliate).call{value: split.affiliateShare}("");
                require(success, "ETH transfer to affiliate failed");
            }
            //handle royalty if necessary
            if (_a.royalties.length > 0) {
                for (uint256 i = 0; i < _a.royalties.length; i++) {
                    if (split.royaltyShares[i] > 0) {
                        (success, ) = payable(_a.royalties[i]).call{value: split.royaltyShares[i]}("");
                        require(success, "ETH transfer to royalty failed");
                    }
                }
            }
        } else {
            (bool success, ) = payable(_a.pixelCraft).call{value: split.pixelcraftShare}("");
            require(success, "ETH transfer to pixelCraft failed");

            (success, ) = payable(_a.daoTreasury).call{value: split.daoShare}("");
            require(success, "ETH transfer to daoTreasury failed");

            (success, ) = payable(_a.rarityFarming).call{value: split.playerRewardsShare}("");
            require(success, "ETH transfer to rarityFarming failed");

            (success, ) = payable(_a.seller).call{value: split.sellerShare}("");
            require(success, "ETH transfer to seller failed");

            //handle affiliate split if necessary
            if (split.affiliateShare > 0) {
                (success, ) = payable(_a.affiliate).call{value: split.affiliateShare}("");
                require(success, "ETH transfer to affiliate failed");
            }
            //handle royalty if necessary
            if (_a.royalties.length > 0) {
                for (uint256 i = 0; i < _a.royalties.length; i++) {
                    if (split.royaltyShares[i] > 0) {
                        (success, ) = payable(_a.royalties[i]).call{value: split.royaltyShares[i]}("");
                        require(success, "ETH transfer to royalty failed");
                    }
                }
            }
        }
    }

    ///@notice Query the category of an NFT
    ///@param _erc721TokenAddress The contract address of the NFT to query
    ///@param _erc721TokenId The identifier of the NFT to query
    ///@return category_ Category of the NFT // 0 == portal, 1 == vrf pending, 2 == open portal, 3 == Aavegotchi 4 == Realm.
    function getERC721Category(address _erc721TokenAddress, uint256 _erc721TokenId) internal view returns (uint256 category_) {
        AppStorage storage s = LibAppStorage.diamondStorage();

        require(
            _erc721TokenAddress == address(this) || s.erc721Categories[_erc721TokenAddress][0] != 0,
            "ERC721Marketplace: ERC721 category does not exist"
        );
        if (_erc721TokenAddress != address(this)) {
            category_ = s.erc721Categories[_erc721TokenAddress][0];
        } else {
            category_ = s.aavegotchis[_erc721TokenId].status; // 0 == portal, 1 == vrf pending, 2 == open portal, 3 == Aavegotchi
        }
    }

    ///@notice Query the category details of a ERC1155 NFT
    ///@param _erc1155TokenAddress Contract address of NFT to query
    ///@param _erc1155TypeId Identifier of the NFT to query
    ///@return category_ Category of the NFT // 0 is wearable, 1 is badge, 2 is consumable, 3 is tickets
    function getERC1155Category(address _erc1155TokenAddress, uint256 _erc1155TypeId) internal view returns (uint256 category_) {
        AppStorage storage s = LibAppStorage.diamondStorage();
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
}
