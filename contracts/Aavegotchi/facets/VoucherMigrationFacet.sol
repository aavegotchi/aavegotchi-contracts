// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {AppStorage, Modifiers, ItemType} from "../libraries/LibAppStorage.sol";
import {LibItems} from "../libraries/LibItems.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";

contract VoucherMigrationFacet is Modifiers {
    event MigrateVouchers(address indexed _owner, uint256[] _ids, uint256[] _values);

    struct VouchersOwner {
        address owner;
        uint256[] ids;
        uint256[] values;
    }

    function migrateVouchers(VouchersOwner[] calldata _vouchersOwners) external onlyOwner {
        address sender = LibMeta.msgSender();
        for (uint256 i; i < _vouchersOwners.length; i++) {
            address owner = _vouchersOwners[i].owner;
            uint256[] calldata ids = _vouchersOwners[i].ids;
            uint256[] calldata values = _vouchersOwners[i].values;
            for (uint256 j; j < ids.length; j++) {
                uint256 id = ids[j];
                uint256 value = values[j];
                ItemType storage itemType = s.itemTypes[id];
                uint256 totalQuantity = itemType.totalQuantity + value;
                require(totalQuantity <= itemType.maxQuantity, "ShopFacet: Total item type quantity exceeds max quantity");
                itemType.totalQuantity = totalQuantity;
                LibItems.addToOwner(owner, id, value);
            }
            emit LibERC1155.TransferBatch(sender, address(0), owner, ids, values);
            emit MigrateVouchers(owner, ids, values);
            LibERC1155.onERC1155BatchReceived(sender, address(0), owner, ids, values, "");
        }
    }
}
