// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {AppStorage, Modifiers, ItemType} from "../libraries/LibAppStorage.sol";
import {LibItems} from "../libraries/LibItems.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";

import "../WearableDiamond/interfaces/IEventHandlerFacet.sol";

contract VoucherMigrationFacet is Modifiers {
    event MigrateVouchers(address indexed _owner, uint256[] _ids, uint256[] _values);

    struct VouchersOwner {
        address owner;
        uint256[] ids;
        uint256[] values;
    }

    ///@notice Allow the aavegotchi diamond owner to convert vouchers to items and send them to respective owners
    ///@param _vouchersOwners An array of structs, each struct containing details about a voucher, like the owner, identifiers of items and corresponding values
    function migrateVouchers(VouchersOwner[] calldata _vouchersOwners) external onlyOwner {
        address sender = LibMeta.msgSender();
        for (uint256 i; i < _vouchersOwners.length; i++) {
            address owner = _vouchersOwners[i].owner;
            for (uint256 j; j < _vouchersOwners[i].ids.length; j++) {
                uint256 id = _vouchersOwners[i].ids[j];
                uint256 value = _vouchersOwners[i].values[j];
                ItemType storage itemType = s.itemTypes[id];
                uint256 totalQuantity = itemType.totalQuantity + value;
                require(totalQuantity <= itemType.maxQuantity, "ShopFacet: Total item type quantity exceeds max quantity");
                itemType.totalQuantity = totalQuantity;
                LibItems.addToOwner(owner, id, value);
            }
            IEventHandlerFacet(s.wearableDiamond).emitTransferBatchEvent(
                sender,
                address(0),
                owner,
                _vouchersOwners[i].ids,
                _vouchersOwners[i].values
            );
            emit MigrateVouchers(owner, _vouchersOwners[i].ids, _vouchersOwners[i].values);
            LibERC1155.onERC1155BatchReceived(sender, address(0), owner, _vouchersOwners[i].ids, _vouchersOwners[i].values, "");
        }
    }
}
