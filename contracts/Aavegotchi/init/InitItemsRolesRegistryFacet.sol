// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;
import {LibItemRolesRegistry} from "../libraries/LibItemRolesRegistry.sol";

contract InitItemsRolesRegistryFacet {
    function init() public {
        LibItemRolesRegistry.addSupportedInterface();
    }
}
