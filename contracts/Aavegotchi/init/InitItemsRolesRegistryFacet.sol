// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibDiamond} from "../../shared/libraries/LibDiamond.sol";
import {ISftRolesRegistry} from "../../shared/interfaces/ISftRolesRegistry.sol";
import {Modifiers} from "../libraries/LibAppStorage.sol";
import "hardhat/console.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

contract InitItemsRolesRegistryFacet is Modifiers {
    function init() external {

        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        console.log("Supports ISftRolesRegistry before? %s", ds.supportedInterfaces[type(ISftRolesRegistry).interfaceId]);
        console.logBytes4(type(ISftRolesRegistry).interfaceId);

        console.log("Supports ERC1155Receiver before? %s", ds.supportedInterfaces[type(IERC1155Receiver).interfaceId]);
        console.logBytes4(type(IERC1155Receiver).interfaceId);

        ds.supportedInterfaces[type(ISftRolesRegistry).interfaceId] = true;
        ds.supportedInterfaces[type(IERC1155Receiver).interfaceId] = false;
        
        console.log("Supports IERC1155Receiver? %s", ds.supportedInterfaces[type(IERC1155Receiver).interfaceId]);
        console.logBytes4(type(IERC1155Receiver).interfaceId);

        console.log("Supports ISftRolesRegistry? %s", ds.supportedInterfaces[0xd4ba61d5]);
        console.logBytes4(type(ISftRolesRegistry).interfaceId);
    }
}
