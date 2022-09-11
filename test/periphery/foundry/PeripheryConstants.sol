pragma solidity 0.8.1;

abstract contract PeripheryConstants {
    address constant aavegotchiDiamond = 0x86935F11C86623deC8a25696E1C19a8659CbF95d;
    //using constants to save test time
    address constant ownerShipFacet = 0xAE7DF9f59FEc446903c64f21a76d039Bc81712ef;
    address constant loupeFacet = 0x58f64b56B1e15D8C932c51287d814EDaa8d6feb9;
    address constant cutFacet = 0x4f908Fa47F10bc2254dae7c74d8B797C1749A8a6;

    address constant potionOwner = 0x6bac48867BC94Ff20B4C62b21d484a44D04d342C;
    uint256 constant potionId = 128;
    uint256 constant potionOwnerGotchiId = 2761;

    address constant wearableOwner = 0x852271883ed42CC3F9D9559b05aB4784Fc768E93;
    uint256 gotchiId = 3342;
    uint256 sampleWearableId = 302;

    address constant ghstOwner = 0x74BF5B9972Da24406C2c046494a5cCBE2fBa28Dc;
    address constant listingOwner = 0xD41213C320d05c0B6882EdF1021328939AA18be6;
    uint256 constant listingId = 329063;
    uint256 itemTypeId = 225;
    uint256 price = 49e18;

    address diamondOwner;
    address wearableDiamond;
}
