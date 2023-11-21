// SPDX-License-Identifier: CC0-1.0

pragma solidity 0.8.1;

import { ISftRolesRegistry } from '../../shared/interfaces/ISftRolesRegistry.sol';

/// LinkedLists allow developers to manage multiple linked lists at once.
/// all lists are identified by a head key (bytes32)
/// each list item is identified by a nonce
/// the list is sorted by the expiration date in decreasing order
library LinkedLists {
    uint256 public constant EMPTY = 0;
    uint16 public constant LIST_LIMIT = 1000;

    struct Lists {
        mapping(bytes32 => uint256) heads;
        mapping(uint256 => ListItem) items;
        mapping(bytes32 => uint256) sizes;
    }

    struct ListItem {
        ISftRolesRegistry.RoleData data;
        uint256 previous;
        uint256 next;
    }

    function insert(Lists storage _self, bytes32 _headKey, uint256 _nonce, ISftRolesRegistry.RoleData memory _data) internal {
        require(_nonce != EMPTY, 'LinkedLists: invalid nonce');
        require(_self.sizes[_headKey] < LIST_LIMIT, 'LinkedLists: list limit reached');

        uint256 headNonce = _self.heads[_headKey];
        if (headNonce == EMPTY) {
            // if list is empty
            // insert as head
            _self.heads[_headKey] = _nonce;
            _self.items[_nonce] = ListItem(_data, EMPTY, EMPTY);
            _self.sizes[_headKey]++;
            return;
        }

        ListItem storage headItem = _self.items[headNonce];
        if (_data.expirationDate > headItem.data.expirationDate) {
            // if expirationDate is greater than head's expirationDate
            // update current head
            headItem.previous = _nonce;

            // insert as head
            _self.heads[_headKey] = _nonce;
            _self.items[_nonce] = ListItem(_data, EMPTY, headNonce);
            _self.sizes[_headKey]++;
            return;
        }

        // search where to insert
        uint256 currentNonce = headNonce;
        while (
            _self.items[currentNonce].next != EMPTY &&
            _data.expirationDate < _self.items[_self.items[currentNonce].next].data.expirationDate
        ) {
            currentNonce = _self.items[currentNonce].next;
        }
        _insertAt(_self, currentNonce, _nonce, _data);
        _self.sizes[_headKey]++;
    }

    function _insertAt(
        Lists storage _self,
        uint256 _previousNonce,
        uint256 _dataNonce,
        ISftRolesRegistry.RoleData memory _data
    ) internal {
        ListItem storage previousItem = _self.items[_previousNonce];
        if (previousItem.next == EMPTY) {
            // insert as last item
            _self.items[_dataNonce] = ListItem(_data, _previousNonce, EMPTY);
        } else {
            // insert in the middle
            _self.items[_dataNonce] = ListItem(_data, _previousNonce, previousItem.next);
            // modify next item
            _self.items[previousItem.next].previous = _dataNonce;
        }
        // modify previous item
        previousItem.next = _dataNonce;
    }

    function remove(Lists storage _self, bytes32 _headKey, uint256 _nonce) internal {
        uint256 headNonce = _self.heads[_headKey];
        require(
            headNonce != EMPTY && _self.items[_nonce].data.expirationDate != 0,
            'LinkedLists: empty list or invalid nonce'
        );

        // only the head has previous as empty
        if (_self.items[_nonce].previous == EMPTY) {
            // if item is the head
            // check if correct headKey was provided
            require(headNonce == _nonce, 'LinkedLists: invalid headKey provided');
            // remove head
            if (_self.items[_nonce].next == EMPTY) {
                // list contains only one item
                delete _self.heads[_headKey];
            } else {
                // list contains more than one item
                // set new head
                uint256 newHeadNonce = _self.items[_nonce].next;
                _self.heads[_headKey] = newHeadNonce;
                // remove previous item of new head
                _self.items[newHeadNonce].previous = EMPTY;
            }
        } else {
            // remove non-head item
            ListItem storage itemToRemove = _self.items[_nonce];
            // update previous item
            _self.items[itemToRemove.previous].next = itemToRemove.next;
            if (itemToRemove.next != EMPTY) {
                // if item is not the last one
                // update next item
                _self.items[itemToRemove.next].previous = itemToRemove.previous;
            }
        }

        // delete item from storage
        delete _self.items[_nonce];
        _self.sizes[_headKey]--;
    }
}
