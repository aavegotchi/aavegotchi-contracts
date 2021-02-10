// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "./libraries/LibAppStorage.sol";
import "../shared/interfaces/IERC165.sol";
import "../shared/interfaces/IDiamondLoupe.sol";
import "../shared/interfaces/IERC173.sol";

contract InitDiamond {
    AppStorage internal s;

    function init(address _rootChainManager) external {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        s.itemsBaseUri = "https://aavegotchi.com/metadata/items/";
        s.rootChainManager = _rootChainManager; //0x0D29aDA4c818A9f089107201eaCc6300e56E0d5c;

        // adding ERC165 data
        ds.supportedInterfaces[type(IERC165).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;
        ds.supportedInterfaces[type(IERC173).interfaceId] = true;
    }
}
