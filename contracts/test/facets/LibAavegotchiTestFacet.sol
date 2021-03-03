// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "../../Aavegotchi/libraries/LibAavegotchi.sol";

import {
    AppStorage
} from "../../Aavegotchi/libraries/LibAppStorage.sol";

contract LibAavegotchiTestFacet {

    AppStorage internal s;

    function t_toNumericTraits(uint256 _randomNumber, int16[NUMERIC_TRAITS_NUM] memory _modifiers) public pure returns (int16[NUMERIC_TRAITS_NUM] memory numericTraits_) {
        return LibAavegotchi.toNumericTraits(_randomNumber, _modifiers);
    }

    function t_rarityMultiplier(int16[NUMERIC_TRAITS_NUM] memory _numericTraits) public pure returns (uint256 multiplier) {
        return LibAavegotchi.rarityMultiplier(_numericTraits);
    }

    function t_singlePortalAavegotchiTraits(uint256 _randomNumber, uint256 _option)
        public
        view
        returns (InternalPortalAavegotchiTraitsIO memory singlePortalAavegotchiTraits_)
    {
        return LibAavegotchi.singlePortalAavegotchiTraits(_randomNumber, _option);
    }

    function t_xpUntilNextLevel(uint256 _experience) public pure returns (uint256 requiredXp_) {
       return LibAavegotchi.xpUntilNextLevel(_experience);
    }

    function t_aavegotchiLevel(uint256 _experience) public pure returns (uint256 level_) {
        return LibAavegotchi.aavegotchiLevel(_experience);
    }

    function t_baseRarityScore(int16[NUMERIC_TRAITS_NUM] memory _numericTraits) public pure returns (uint256 _rarityScore) {
        return LibAavegotchi.baseRarityScore(_numericTraits);
    }

    function t_purchase(uint256 _ghst) public {
        LibAavegotchi.purchase(msg.sender,_ghst);
    }


    function t_sqrt(uint256 x) public pure returns (uint256 y) {
        return LibAavegotchi.sqrt(x);
    }

    function t_validateAndLowerName(string memory _name) public pure returns (string memory) {
        return LibAavegotchi.validateAndLowerName(_name);
    }

    function t_verify(uint256 _tokenId) public pure {
       return LibAavegotchi.verify(_tokenId);
    }
}