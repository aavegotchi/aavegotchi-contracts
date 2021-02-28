// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "../../Aavegotchi/libraries/LibAavegotchi.sol";

import {
    LibAppStorage
} from "../../Aavegotchi/libraries/LibAppStorage.sol";

contract LibAavegotchiTest {

    constructor() {

    }

    function toNumericTraits(uint256 _randomNumber, int16[NUMERIC_TRAITS_NUM] memory _modifiers) public pure returns (int16[NUMERIC_TRAITS_NUM] memory numericTraits_) {
        return LibAavegotchi.toNumericTraits(_randomNumber, _modifiers);
    }

    function rarityMultiplier(int16[NUMERIC_TRAITS_NUM] memory _numericTraits) public pure returns (uint256 multiplier) {
        return LibAavegotchi.rarityMultiplier(_numericTraits);
    }

    function singlePortalAavegotchiTraits(uint256 _randomNumber, uint256 _option)
        public
        view
        returns (InternalPortalAavegotchiTraitsIO memory singlePortalAavegotchiTraits_)
    {
        return LibAavegotchi.singlePortalAavegotchiTraits(_randomNumber, _option);
    }

    function xpUntilNextLevel(uint256 _experience) public pure returns (uint256 requiredXp_) {
       return LibAavegotchi.xpUntilNextLevel(_experience);
    }

    function aavegotchiLevel(uint256 _experience) public pure returns (uint256 level_) {
        return LibAavegotchi.aavegotchiLevel(_experience);
    }

    function baseRarityScore(int16[NUMERIC_TRAITS_NUM] memory _numericTraits) public pure returns (uint256 _rarityScore) {
        return LibAavegotchi.baseRarityScore(_numericTraits);
    }

    function purchase(uint256 _ghst) public {
        LibAavegotchi.purchase(_ghst);
    }


    function sqrt(uint256 x) public pure returns (uint256 y) {
        return LibAavegotchi.sqrt(x);
    }

    function validateAndLowerName(string memory _name) public pure returns (string memory) {
        return LibAavegotchi.validateAndLowerName(_name);
    }

    function isContract(address _addr) public view returns (address) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        address _add = s.ghstContract;
        return _add;
        uint32 size;
        assembly {
            size := extcodesize(_add)
        }

        //return (size > 0);
    }
}