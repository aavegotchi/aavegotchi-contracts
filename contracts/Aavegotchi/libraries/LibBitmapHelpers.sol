// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

library LibBitmapHelpers {
    function getValueInByte(uint8 index, uint256 bitmap) internal pure returns (uint8) {
        require(index < 32, "Invalid index"); // Ensure index is within bounds
        //reverse index order
        index = 31 - index;
        bytes32 bitmapBytes = bytes32(bitmap);
        uint8 byteValue = uint8(bitmapBytes[index]);
        return byteValue;
    }

    function getAllNumbers(uint256 bitmap) internal pure returns (uint8[32] memory) {
        uint8[32] memory numbers;
        for (uint8 i = 0; i < 32; i++) {
            numbers[i] = getValueInByte(i, bitmap);
        }
        return numbers;
    }

    function getSelectedNumbers(uint8[] memory bytePositions, uint256 bitmap) internal pure returns (uint8[] memory) {
        uint8[] memory selectedNumbers = new uint8[](bytePositions.length);

        for (uint256 i = 0; i < bytePositions.length; i++) {
            selectedNumbers[i] = getValueInByte(bytePositions[i], bitmap);
        }

        return selectedNumbers;
    }
}
