// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;
import {LibERC20} from "../../shared/libraries/LibERC20.sol";

struct BaazaarSplit {
    uint256 daoShare;
    uint256 pixelcraftShare;
    uint256 playerRewardsShare;
    uint256 sellerShare;
    uint256 affiliateShare;
}

struct SplitAddresses {
    address ghstContract;
    address buyer;
    address seller;
    address affiliate;
    address daoTreasury;
    address pixelCraft;
    address rarityFarming;
}

library LibSharedMarketplace {
    function getBaazaarSplit(uint256 _amount, uint16[2] memory _principalSplit) internal pure returns (BaazaarSplit memory) {
        uint256 daoShare = _amount / 100; //1%
        uint256 pixelcraftShare = (_amount * 2) / 100; //2%
        uint256 playerRewardsShare = _amount / 200; //0.5%
        uint256 principal = _amount - (daoShare + pixelcraftShare + playerRewardsShare); //96.5%

        //@todo: check this math
        uint256 sellerShare = (principal * _principalSplit[0]) / 10000;
        uint256 affiliateShare = (principal * _principalSplit[1]) / 10000;

        return
            BaazaarSplit({
                daoShare: daoShare,
                pixelcraftShare: pixelcraftShare,
                playerRewardsShare: playerRewardsShare,
                sellerShare: sellerShare,
                affiliateShare: affiliateShare
            });
    }

    function transferSales(SplitAddresses memory _a, BaazaarSplit memory split) internal {
        LibERC20.transferFrom(_a.ghstContract, _a.buyer, _a.pixelCraft, split.pixelcraftShare);
        LibERC20.transferFrom(_a.ghstContract, _a.buyer, _a.daoTreasury, split.daoShare);

        LibERC20.transferFrom((_a.ghstContract), _a.buyer, _a.rarityFarming, split.playerRewardsShare);

        //@todo: check that this is 100% for legacy listings
        LibERC20.transferFrom(_a.ghstContract, _a.buyer, _a.seller, split.sellerShare);

        //handle affiliate split if necessary
        if (split.affiliateShare > 0) {
            LibERC20.transferFrom(_a.ghstContract, _a.buyer, _a.affiliate, split.affiliateShare);
        }
    }
}
