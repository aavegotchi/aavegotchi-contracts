// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibDiamond} from "../../shared/libraries/LibDiamond.sol";

library LibItemRolesRegistry {

  function addSupportedInterface() public {
    LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
    ds.supportedInterfaces[0xd4ba61d5] = true;
  }
}