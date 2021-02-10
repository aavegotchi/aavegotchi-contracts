// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "./libraries/LibAppStorage.sol";
import "../shared/libraries/LibDiamond.sol";
import "../shared/interfaces/IERC165.sol";
import "../shared/interfaces/IDiamondLoupe.sol";
import "../shared/interfaces/IERC173.sol";

contract InitDiamond {
    AppStorage internal s;

    function init() external {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        // adding ERC165 data
        ds.supportedInterfaces[type(IERC165).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;
        ds.supportedInterfaces[type(IERC173).interfaceId] = true;
    }
}
