// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibItems} from "../libraries/LibItems.sol";
import {Modifiers} from "../libraries/LibAppStorage.sol";
import {LibERC1155Marketplace} from "../libraries/LibERC1155Marketplace.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";
import {LibDiamond} from "../../shared/libraries/LibDiamond.sol";

contract PeripheryFacet is Modifiers {
    //WRITE

    function peripherySetApprovalForAll(
        address _operator,
        bool _approved,
        address _onBehalfOf
    ) external onlyPeriphery {
        s.operators[_onBehalfOf][_operator] = _approved;
    }

    function peripherySetBaseURI(string memory _value) external onlyPeriphery returns (uint256 _itemsLength) {
        s.itemsBaseUri = _value;
        _itemsLength = s.itemTypes.length;
    }

    function peripherySafeTransferFrom(
        address _operator,
        address _from,
        address _to,
        uint256 _id,
        uint256 _value,
        bytes calldata _data
    ) external onlyPeriphery {
        require(_to != address(0), "ItemsTransfer: Can't transfer to 0 address");
        require(
            _operator == _from || s.operators[_from][_operator] || _operator == address(this),
            "ItemsTransfer: Not owner and not approved to transfer"
        );
        LibItems.removeFromOwner(_from, _id, _value);
        LibItems.addToOwner(_to, _id, _value);
        LibERC1155Marketplace.updateERC1155Listing(address(this), _id, _from);
        LibERC1155.onERC1155Received(_operator, _from, _to, _id, _value, _data);
    }

    function peripherySafeBatchTransferFrom(
        address _operator,
        address _from,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes calldata _data
    ) external onlyPeriphery {
        require(_to != address(0), "ItemsTransfer: Can't transfer to 0 address");
        require(_ids.length == _values.length, "ItemsTransfer: ids not same length as values");
        require(_operator == _from || s.operators[_from][_operator], "ItemsTransfer: Not owner and not approved to transfer");
        for (uint256 i; i < _ids.length; i++) {
            uint256 id = _ids[i];
            uint256 value = _values[i];
            LibItems.removeFromOwner(_from, id, value);
            LibItems.addToOwner(_to, id, value);
            LibERC1155Marketplace.updateERC1155Listing(address(this), id, _from);
        }

        LibERC1155.onERC1155BatchReceived(_operator, _from, _to, _ids, _values, _data);
    }

    function removeInterface() external onlyOwner {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        ds.supportedInterfaces[0xd9b67a26] = false; //erc1155
    }

    function setPeriphery(address _periphery) external onlyOwner {
        s.wearableDiamond = _periphery;
    }
}
