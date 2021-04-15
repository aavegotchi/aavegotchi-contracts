// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibDiamond} from "../shared/libraries/LibDiamond.sol";
import {AppStorage} from "./libraries/LibAppStorage.sol";
import {IERC165} from "../shared/interfaces/IERC165.sol";
import {IDiamondCut} from "../shared/interfaces/IDiamondCut.sol";
import {IDiamondLoupe} from "../shared/interfaces/IDiamondLoupe.sol";
import {IERC173} from "../shared/interfaces/IERC173.sol";
import {IERC721} from "../shared/interfaces/IERC721.sol";

contract InitDiamond {
    AppStorage internal s;

    function init(address _rootChainManager) external {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        s.itemsBaseUri = "https://aavegotchi.com/metadata/items/";
        s.rootChainManager = _rootChainManager;         

        // adding ERC165 data
        ds.supportedInterfaces[type(IERC165).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;
        ds.supportedInterfaces[type(IERC173).interfaceId] = true;
        ds.supportedInterfaces[type(IERC721).interfaceId] = true;        
    }

    function filler() external {
        
    }
}
