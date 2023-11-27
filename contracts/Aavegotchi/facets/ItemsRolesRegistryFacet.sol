// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {IERC1155} from "../../shared/interfaces/IERC1155.sol";
import {IERC165} from '../../shared/interfaces/IERC165.sol';
import {ISftRolesRegistry} from '../../shared/interfaces/ISftRolesRegistry.sol';

import {LibItems} from "../libraries/LibItems.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibERC1155Marketplace} from "../libraries/LibERC1155Marketplace.sol";

import {Modifiers, ItemType} from "../libraries/LibAppStorage.sol";
import {IERC1155Receiver} from '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';
import {ERC1155Holder, ERC1155Receiver} from '@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol';
import {LinkedLists} from '../libraries/LibLinkedLists.sol';
import{IEventHandlerFacet} from "../WearableDiamond/interfaces/IEventHandlerFacet.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";

contract ItemsRolesRegistryFacet is Modifiers, ISftRolesRegistry, ERC1155Holder {
    using LinkedLists for LinkedLists.Lists;
    using LinkedLists for LinkedLists.ListItem;
    
    /** Modifiers **/

    modifier onlyWearables(address _tokenAddress, uint256 _tokenId) {
        require(_tokenAddress == s.wearableDiamond, "ItemsRolesRegistryFacet: Only Item NFTs are supported");
        require(
            s.itemTypes[_tokenId].category == LibItems.ITEM_CATEGORY_WEARABLE,
            "ItemsRolesRegistryFacet: Only Items of type Wearable are supported"
        );
        _;
    }

    modifier validExpirationDate(uint64 _expirationDate) {
        require(_expirationDate > block.timestamp, 'ItemsRolesRegistryFacet: expiration date must be in the future');
        _;
    }

    modifier onlyOwnerOrApprovedWithBalance(
        address _account,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _tokenAmount
    ) {
        require(_tokenAmount > 0, 'ItemsRolesRegistryFacet: tokenAmount must be greater than zero');
        require(
            _account == msg.sender || isRoleApprovedForAll(_tokenAddress, _account, msg.sender),
            'ItemsRolesRegistryFacet: account not approved'
        );
        _;
    }

    /** External Functions **/

    function grantRoleFrom(
        RoleAssignment calldata _roleAssignment
    )
        external
        override
        validExpirationDate(_roleAssignment.expirationDate)
        onlyOwnerOrApprovedWithBalance(
            _roleAssignment.grantor,
            _roleAssignment.tokenAddress,
            _roleAssignment.tokenId,
            _roleAssignment.tokenAmount
        )
        onlyWearables(_roleAssignment.tokenAddress, _roleAssignment.tokenId)
    {
        bytes32 hash = _hashRoleData(
            _roleAssignment.nonce,
            _roleAssignment.role,
            _roleAssignment.tokenAddress,
            _roleAssignment.tokenId,
            _roleAssignment.grantor
        );
        bytes32 rootKey = _getHeadKey(
            _roleAssignment.grantee,
            _roleAssignment.role,
            _roleAssignment.tokenAddress,
            _roleAssignment.tokenId
        );
        LinkedLists.ListItem storage item = s.itemsLists.items[_roleAssignment.nonce];
        if (item.data.expirationDate == 0) {
            // nonce is not being used

            _transferFrom(
                _roleAssignment.grantor,
                address(this),
                _roleAssignment.tokenAddress,
                _roleAssignment.tokenId,
                _roleAssignment.tokenAmount
            );
        } else {
            // nonce is being used
            require(item.data.hash == hash, 'ItemsRolesRegistryFacet: nonce exist, but data mismatch'); // validates nonce, role, tokenAddress, tokenId, grantor
            require(
                item.data.expirationDate < block.timestamp || item.data.revocable,
                'ItemsRolesRegistryFacet: nonce is not expired or is not revocable'
            );

            // deposit or withdraw tokens
            _depositOrWithdrawTokens(
                _roleAssignment.tokenAddress,
                _roleAssignment.tokenId,
                _roleAssignment.grantor,
                item.data.tokenAmount,
                _roleAssignment.tokenAmount
            );

            // remove from the list
            if (item.data.grantee != _roleAssignment.grantee) {
                bytes32 oldRootKey = _getHeadKey(
                    item.data.grantee,
                    _roleAssignment.role,
                    _roleAssignment.tokenAddress,
                    _roleAssignment.tokenId
                );
                s.itemsLists.remove(oldRootKey, _roleAssignment.nonce);
            } else {
                s.itemsLists.remove(rootKey, _roleAssignment.nonce);
            }
        }

        // insert on the list
        _insert(hash, rootKey, _roleAssignment);
    }

    function _depositOrWithdrawTokens(
        address _tokenAddress,
        uint256 _tokenId,
        address _account,
        uint256 _depositedAmount,
        uint256 _amountRequired
    ) internal {
        if (_depositedAmount > _amountRequired) {
            // return leftover tokens
            uint256 tokensToReturn = _depositedAmount - _amountRequired;
            _transferFrom(address(this), _account, _tokenAddress, _tokenId, tokensToReturn);
        } else if (_amountRequired > _depositedAmount) {
            // deposit missing tokens
            uint256 tokensToDeposit = _amountRequired - _depositedAmount;
            _transferFrom(_account, address(this), _tokenAddress, _tokenId, tokensToDeposit);
        }
    }

    function _insert(bytes32 _hash, bytes32 _rootKey, RoleAssignment calldata _roleAssignment) internal {
        RoleData memory data = RoleData(
            _hash,
            _roleAssignment.grantee,
            _roleAssignment.tokenAmount,
            _roleAssignment.expirationDate,
            _roleAssignment.revocable,
            _roleAssignment.data
        );

        s.itemsLists.insert(_rootKey, _roleAssignment.nonce, data);

        emit RoleGranted(
            _roleAssignment.nonce,
            _roleAssignment.role,
            _roleAssignment.tokenAddress,
            _roleAssignment.tokenId,
            _roleAssignment.tokenAmount,
            _roleAssignment.grantor,
            _roleAssignment.grantee,
            _roleAssignment.expirationDate,
            _roleAssignment.revocable,
            _roleAssignment.data
        );
    }

    function revokeRoleFrom(RevokeRoleData calldata _revokeRoleData) external override {
        LinkedLists.ListItem storage item = s.itemsLists.items[_revokeRoleData.nonce];
        address _grantee = item.data.grantee;
        require(item.data.hash == _hashRoleData(_revokeRoleData), 'ItemsRolesRegistryFacet: could not find role assignment');

        address caller = _findCaller(_revokeRoleData, _grantee);
        if (item.data.expirationDate > block.timestamp && !item.data.revocable) {
            // if role is not expired and is not revocable, only the grantee can revoke it
            require(caller == _grantee, 'ItemsRolesRegistryFacet: role is not revocable or caller is not the approved');
        }

        uint256 tokensToReturn = item.data.tokenAmount;

        bytes32 rootKey = _getHeadKey(
            _grantee,
            _revokeRoleData.role,
            _revokeRoleData.tokenAddress,
            _revokeRoleData.tokenId
        );

        // remove from the list
        s.itemsLists.remove(rootKey, _revokeRoleData.nonce);

        emit RoleRevoked(
            _revokeRoleData.nonce,
            _revokeRoleData.role,
            _revokeRoleData.tokenAddress,
            _revokeRoleData.tokenId,
            tokensToReturn,
            _revokeRoleData.revoker,
            _grantee
        );

        if(s.itemIdToDelegationIdToGotchiId[_revokeRoleData.nonce][_revokeRoleData.tokenId] != 0) {
            uint256 _gotchiId = s.itemIdToDelegationIdToGotchiId[_revokeRoleData.nonce][_revokeRoleData.tokenId];
            LibItems.removeFromParent(address(this), _gotchiId, _revokeRoleData.tokenId, 1);
            IEventHandlerFacet(s.wearableDiamond).emitTransferSingleEvent(msg.sender, address(this), msg.sender, _revokeRoleData.tokenId, 1);
            emit LibERC1155.TransferFromParent(address(this), _gotchiId, _revokeRoleData.tokenId, 1);
            delete s.itemIdToDelegationIdToGotchiId[_revokeRoleData.nonce][_revokeRoleData.tokenId];
        }

        _transferFrom(
            address(this),
            _revokeRoleData.revoker,
            _revokeRoleData.tokenAddress,
            _revokeRoleData.tokenId,
            tokensToReturn
        );
    }

    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _isApproved) external override {
        s.itemsTokenApprovals[msg.sender][_tokenAddress][_operator] = _isApproved;
        emit RoleApprovalForAll(_tokenAddress, _operator, _isApproved);
    }

    /** View Functions **/

    function roleData(uint256 _nonce) override external view returns (RoleData memory) {
        return s.itemsLists.items[_nonce].data;
    }

    function roleExpirationDate(uint256 _nonce) override external view returns (uint64 expirationDate_) {
        return s.itemsLists.items[_nonce].data.expirationDate;
    }

    function isRoleApprovedForAll(
        address _tokenAddress,
        address _grantor,
        address _operator
    ) public view override returns (bool) {
        return s.itemsTokenApprovals[_grantor][_tokenAddress][_operator];
    }

    function roleBalanceOf(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantee
    ) external override view returns (uint256 balance_) {
        bytes32 rootKey = _getHeadKey(_grantee, _role, _tokenAddress, _tokenId);
        uint256 currentNonce = s.itemsLists.heads[rootKey];
        if (currentNonce == 0) {
            return 0;
        }

        balance_ = 0;
        LinkedLists.ListItem storage currentItem;
        uint256 count = 0;
        while (currentNonce != 0) {
            currentItem = s.itemsLists.items[currentNonce];
            if (currentItem.data.expirationDate < block.timestamp) {
                return balance_;
            }
            balance_ += currentItem.data.tokenAmount;
            currentNonce = currentItem.next;
            count++;
        }
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155Receiver, IERC165) returns (bool) {
        return interfaceId == type(ISftRolesRegistry).interfaceId || interfaceId == type(IERC1155Receiver).interfaceId;
    }

    /** Helper Functions **/

    function _transferFrom(
        address _from,
        address _to,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _tokenAmount
    ) internal {
        LibItems.removeFromOwner(_from, _tokenId, _tokenAmount);
        LibItems.addToOwner(_to, _tokenId, _tokenAmount);
        IEventHandlerFacet(_tokenAddress).emitTransferSingleEvent(LibMeta.msgSender(), _from, _to, _tokenId, _tokenAmount);
        LibERC1155Marketplace.updateERC1155Listing(address(this), _tokenId, _to);
    }

    function _hashRoleData(RevokeRoleData calldata _revokeRoleData) internal pure returns (bytes32) {
        return
            _hashRoleData(
                _revokeRoleData.nonce,
                _revokeRoleData.role,
                _revokeRoleData.tokenAddress,
                _revokeRoleData.tokenId,
                _revokeRoleData.revoker
            );
    }

    function _hashRoleData(
        uint256 _nonce,
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(_nonce, _role, _tokenAddress, _tokenId, _grantor));
    }

    function _findCaller(RevokeRoleData calldata _revokeRoleData, address _grantee) internal view returns (address) {
        if (
            _revokeRoleData.revoker == msg.sender ||
            isRoleApprovedForAll(_revokeRoleData.tokenAddress, _revokeRoleData.revoker, msg.sender)
        ) {
            return _revokeRoleData.revoker;
        }

        if (_grantee == msg.sender || isRoleApprovedForAll(_revokeRoleData.tokenAddress, _grantee, msg.sender)) {
            return _grantee;
        }

        revert('ItemsRolesRegistryFacet: sender must be approved');
    }

    function _getHeadKey(
        address _grantee,
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId
    ) internal pure returns (bytes32 rootKey_) {
        return keccak256(abi.encodePacked(_grantee, _role, _tokenAddress, _tokenId));
    }
}
