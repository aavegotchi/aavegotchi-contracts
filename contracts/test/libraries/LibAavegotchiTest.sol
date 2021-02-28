// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "../../Aavegotchi/libraries/LibAavegotchi.sol";

contract LibAavegotchiTest {

    constructor() {

    }

    function toNumericTraits(uint256 _randomNumber, int16[NUMERIC_TRAITS_NUM] memory _modifiers) public pure returns (int16[NUMERIC_TRAITS_NUM] memory numericTraits_) {
        return LibAavegotchi.toNumericTraits(_randomNumber, _modifiers);
    }

    function xpUntilNextLevel(uint256 _experience) public pure returns (uint256 requiredXp_) {
       return LibAavegotchi.xpUntilNextLevel(_experience);
    }

    function aavegotchiLevel(uint256 _experience) public pure returns (uint256 level_) {
        return LibAavegotchi.aavegotchiLevel(_experience);
    }

    function sqrt(uint256 x) public pure returns (uint256 y) {
        return LibAavegotchi.sqrt(x);
    }

    function validateAndLowerName(string memory _name) public pure returns (string memory) {
        return LibAavegotchi.validateAndLowerName(_name);
    }
}