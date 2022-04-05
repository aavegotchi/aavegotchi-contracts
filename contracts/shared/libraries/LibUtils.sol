// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

library LibUtils {
    function addressesCalldataToMemory(address[] calldata _addresses) internal pure returns (address[] memory) {
        uint256 addressesLength = _addresses.length;
        address[] memory addresses = new address[](addressesLength);
        for (uint256 i = 0; i < addressesLength; i++) {
            addresses[i] = _addresses[i];
        }
        return addresses;
    }

    function uint8sCalldataToMemory(uint8[3] calldata _uint8s) internal pure returns (uint8[3] memory) {
        uint8[3] memory uint8s;
        for (uint256 i = 0; i < 3; i++) {
            uint8s[i] = _uint8s[i];
        }
        return uint8s;
    }
}
