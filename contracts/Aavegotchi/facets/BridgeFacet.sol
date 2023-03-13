// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {Modifiers} from "../libraries/LibAppStorage.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibERC1155Marketplace} from "../libraries/LibERC1155Marketplace.sol";
import {LibItems} from "../libraries/LibItems.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";
import {LibERC721} from "../../shared/libraries/LibERC721.sol";
import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";

import "../WearableDiamond/interfaces/IEventHandlerFacet.sol";

contract BridgeFacet is Modifiers {
    event WithdrawnBatch(address indexed owner, uint256[] tokenIds);
    event AddedAavegotchiBatch(address indexed owner, uint256[] tokenIds);
    event AddedItemsBatch(address indexed owner, uint256[] ids, uint256[] values);
    event WithdrawnItems(address indexed owner, uint256[] ids, uint256[] values);
    uint256 internal constant ERC721_TOKEN_TYPE = 721;
    uint256 internal constant ERC1155_TOKEN_TYPE = 1155;

///@notice Allow the Aavegotchi Diamond owner or Dao to change the childChain manager address
///@param _newChildChainManager Address of the new childChain manager
    function setChildChainManager(address _newChildChainManager) external onlyDaoOrOwner {
        s.childChainManager = _newChildChainManager;
    }

///@notice Query the current address of the childChain Manager
///@return The current address of the childChain Manager
    function childChainManager() external view returns (address) {
        return s.childChainManager;
    }

///@notice Allows abatch withdrawal of ERC1155 NFTs/items by the owner
///@dev Only 20 items can be withdrawn in a single transaction, will throw if more than that
///@param _ids An array containing the identifiers of the items to withdraw
///@param _values An array containing the value/number of each item to withdraw
    function withdrawItemsBatch(uint256[] calldata _ids, uint256[] calldata _values) external {
        require(_ids.length == _values.length, "Bridge: ids not same length as values");
        require(_ids.length <= 20, "Items: exceeded max number of ids for single transaction");
        address owner = LibMeta.msgSender();
        for (uint256 i; i < _ids.length; i++) {
            uint256 id = _ids[i];
            uint256 value = _values[i];
            LibItems.removeFromOwner(owner, id, value);
            LibERC1155Marketplace.updateERC1155Listing(address(this), id, owner);
        }
        IEventHandlerFacet(s.wearableDiamond).emitTransferBatchEvent(owner, owner, address(0), _ids, _values);
        emit WithdrawnItems(owner, _ids, _values);
    }

///@notice Allows abatch withdrawal of ERC721 NFTs by the owner
///@dev Only 20 NFTs can be withdrawn in a single transaction, will throw if more than that
///@param _tokenIds An array containing the identifiers of the NFTs to withdraw
    function withdrawAavegotchiBatch(uint256[] calldata _tokenIds) external {
        address owner = LibMeta.msgSender();
        require(_tokenIds.length <= 20, "Bridge: exceeds withdraw limit for single transaction");
        for (uint256 i; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            require(owner == s.aavegotchis[tokenId].owner, "BridgeFacet: Not owner of token");
            require(s.aavegotchis[tokenId].locked == false, "BridgeFacet: Can't withdraw locked token");
            LibAavegotchi.transfer(owner, address(this), tokenId);
        }
        emit WithdrawnBatch(owner, _tokenIds);
    }

    /**
     * @notice called when token is deposited on root chain
     * @dev Should be callable only by ChildChainManager
     * Should handle deposit by minting or unlocking the required tokenId for user
     * Make sure minting is done only by this function
     * @param _user user address for whom deposit is being done
     * @param _depositData abi encoded tokenId
     */
    function deposit(address _user, bytes calldata _depositData) external {
        require(msg.sender == s.childChainManager, "Bridge: only childChainManager can call this function");
        (uint256 tokenType, bytes memory tokenDepositData) = abi.decode(_depositData, (uint256, bytes));
        if (tokenType == ERC1155_TOKEN_TYPE) {
            (uint256[] memory ids, uint256[] memory values) = abi.decode(tokenDepositData, (uint256[], uint256[]));
            require(ids.length == values.length, "Bridge: ids length not equal to values length");
            for (uint256 i; i < ids.length; i++) {
                uint256 id = ids[i];
                uint256 value = values[i];
                LibItems.addToOwner(_user, id, value);
            }
            IEventHandlerFacet(s.wearableDiamond).emitTransferBatchEvent(msg.sender, address(0), _user, ids, values);
            emit AddedItemsBatch(_user, ids, values);
        } else if (tokenType == ERC721_TOKEN_TYPE) {
            uint256[] memory tokenIds = abi.decode(tokenDepositData, (uint256[]));
            for (uint256 i; i < tokenIds.length; i++) {
                uint256 tokenId = tokenIds[i];
                require(address(this) == s.aavegotchis[tokenId].owner, "Bridge: Not owner of token");
                LibAavegotchi.transfer(address(this), _user, tokenId);
            }
            emit AddedAavegotchiBatch(_user, tokenIds);
        }
    }
}
