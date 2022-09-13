// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "../libraries/LibItems.sol";
import "../libraries/LibAppStorage.sol";
import "../libraries/LibERC1155Marketplace.sol";
import "../../shared/libraries/LibStrings.sol";

contract PeripheryFacet is Modifiers {
    ///READ FUNCTIONS

    function peripheryBalanceOf(address _owner, uint256 _id) external view returns (uint256 balance_) {
        balance_ = s.ownerItemBalances[_owner][_id];
    }

    function peripheryBalanceOfBatch(address[] calldata _owners, uint256[] calldata _ids) external view returns (uint256[] memory bals_) {
        require(_owners.length == _ids.length, "ItemsFacet: _owners length not same as _ids length");
        bals_ = new uint256[](_owners.length);
        for (uint256 i; i < _owners.length; i++) {
            uint256 id = _ids[i];
            address owner = _owners[i];
            bals_[i] = s.ownerItemBalances[owner][id];
        }
    }

    function peripheryUri(uint256 _id) external view returns (string memory) {
        require(_id < s.itemTypes.length, "ItemsFacet: Item _id not found");
        return LibStrings.strWithUint(s.itemsBaseUri, _id);
    }

    function peripheryIsApprovedForAll(address _owner, address _operator) external view returns (bool approved_) {
        approved_ = s.operators[_owner][_operator];
    }

    //WRITE

    function peripherySetApprovalForAll(address _operator, bool _approved) external {
        address sender = tx.origin;
        s.operators[sender][_operator] = _approved;
    }

    function peripherySetBaseURI(string memory _value) external onlyPeriphery returns (uint256 _itemsLength) {
        s.itemsBaseUri = _value;
        _itemsLength = s.itemTypes.length;
    }

    function peripherySafeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _value,
        bytes calldata _data
    ) external onlyPeriphery {
        require(_to != address(0), "ItemsTransfer: Can't transfer to 0 address");
        address sender = tx.origin;
        require(sender == _from || s.operators[_from][sender] || sender == address(this), "ItemsTransfer: Not owner and not approved to transfer");
        LibItems.removeFromOwner(_from, _id, _value);
        LibItems.addToOwner(_to, _id, _value);
        LibERC1155Marketplace.updateERC1155Listing(address(this), _id, _from);
        LibERC1155.onERC1155Received(sender, _from, _to, _id, _value, _data);
    }

    function peripherySafeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes calldata _data
    ) external onlyPeriphery {
        require(_to != address(0), "ItemsTransfer: Can't transfer to 0 address");
        require(_ids.length == _values.length, "ItemsTransfer: ids not same length as values");
        address sender = tx.origin;
        require(sender == _from || s.operators[_from][sender], "ItemsTransfer: Not owner and not approved to transfer");
        for (uint256 i; i < _ids.length; i++) {
            uint256 id = _ids[i];
            uint256 value = _values[i];
            LibItems.removeFromOwner(_from, id, value);
            LibItems.addToOwner(_to, id, value);
            LibERC1155Marketplace.updateERC1155Listing(address(this), id, _from);
        }
        //delegate to periphery
        //   IEventHandlerFacet(s.wearableDiamond).emitTransferSingleEvent(sender, _from, _to, _ids, _values);
        LibERC1155.onERC1155BatchReceived(sender, _from, _to, _ids, _values, _data);
    }
}
