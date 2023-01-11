// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;
import {LibERC20} from "../../shared/libraries/LibERC20.sol";

struct BaazaarSplit {
    uint256 daoShare;
    uint256 pixelcraftShare;
    uint256 playerRewardsShare;
    uint256 sellerShare;
    uint256 affiliateShare;
    uint256[] royaltyShares;
}

struct SplitAddresses {
    address ghstContract;
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
        LibERC20.transferFrom(_a.ghstContract, _a.buyer, _a.pixelCraft, split.pixelcraftShare);
        LibERC20.transferFrom(_a.ghstContract, _a.buyer, _a.daoTreasury, split.daoShare);

        LibERC20.transferFrom((_a.ghstContract), _a.buyer, _a.rarityFarming, split.playerRewardsShare);

        LibERC20.transferFrom(_a.ghstContract, _a.buyer, _a.seller, split.sellerShare);

        //handle affiliate split if necessary
        if (split.affiliateShare > 0) {
            LibERC20.transferFrom(_a.ghstContract, _a.buyer, _a.affiliate, split.affiliateShare);
        }
        //handle royalty if necessary
        if (_a.royalties.length > 0) {
            for (uint256 i = 0; i < _a.royalties.length; i++) {
                if (split.royaltyShares[i] > 0) {
                    LibERC20.transferFrom(_a.ghstContract, _a.buyer, _a.royalties[i], split.royaltyShares[i]);
                }
            }
        }
    }

    //will only habdle fee asserts and refunds(in case of >s.listingFee values)
    function burnListingFee(uint256 listingFee, address owner) internal {
        if (listingFee > 0) {
            assert(msg.value >= listingFee);
            //send out fee to feeCollector
            address to;
            (bool success, ) = to.call{value: listingFee}("");
            assert(success);
            if (msg.value > listingFee) {
                //refund extra matic sent in
                (bool success2, ) = owner.call{value: msg.value - listingFee}("");
                assert(success2);
            }
        }
    }
}
