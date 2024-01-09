// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibDiamond} from "../../shared/libraries/LibDiamond.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {IERC7589} from "../../shared/interfaces/IERC7589.sol";

contract InitItemsRolesRegistryFacet {
    function init() public {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        ds.supportedInterfaces[type(IERC7589).interfaceId] = true;
        ds.supportedInterfaces[type(IERC1155Receiver).interfaceId] = true;
    }
}
