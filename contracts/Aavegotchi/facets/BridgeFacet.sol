// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "../libraries/LibAppStorage.sol";

interface IMaretplaceFacet {
    // needed by the marketplace facet to update listings
    function updateERC1155Listing(bytes32 _listingId) external;
}

contract BridgeFacet is LibAppStorageModifiers {
    event WithdrawnBatch(address indexed owner, uint256[] tokenIds);
    event AddedAavegotchiBatch(address indexed owner, uint256[] tokenIds);
    event AddedItemsBatch(address indexed owner, uint256[] ids, uint256[] values);
    event WithdrawnItems(address indexed owner, uint256[] ids, uint256[] values);
    event TransferBatch(address indexed _operator, address indexed _from, address indexed _to, uint256[] _ids, uint256[] _values);
    event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);
    event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);
    uint256 internal constant ERC721_TOKEN_TYPE = 721;
    uint256 internal constant ERC1155_TOKEN_TYPE = 1155;

    function setChildChainManager(address _newChildChainManager) external onlyDaoOrOwner {
        s.childChainManager = _newChildChainManager;
    }

    function childChainManager() external view returns (address) {
        return s.childChainManager;
    }

    function withdrawItemsBatch(uint256[] calldata _ids, uint256[] calldata _values) external {
        require(_ids.length == _values.length, "Items: ids not same length as values");
        require(_ids.length <= 20, "Items: exceeded max number of ids for single transaction");
        address owner = LibMeta.msgSender();
        for (uint256 i; i < _ids.length; i++) {
            uint256 id = _ids[i];
            uint256 value = _values[i];
            uint256 bal = s.items[owner][id];
            require(value <= bal, "Items: Doesn't have that many to transfer");
            s.items[owner][id] = bal - value;
            bytes32 listingId = keccak256(abi.encodePacked(address(this), id, owner));
            IMaretplaceFacet(address(this)).updateERC1155Listing(listingId);
        }
        emit TransferBatch(owner, owner, address(0), _ids, _values);
        emit WithdrawnItems(owner, _ids, _values);
    }

    function withdrawAavegotchiBatch(uint256[] calldata _tokenIds) external {
        address owner = LibMeta.msgSender();
        require(_tokenIds.length <= 20, "AavegotchiFacet: exceeds withdraw limit for single transaction");
        for (uint256 i; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            require(owner == s.aavegotchis[tokenId].owner, "BridgeFacet: Not owner of token");
            s.aavegotchis[tokenId].owner = address(this);
            s.aavegotchiBalance[owner]--;
            s.aavegotchiBalance[address(this)]++;
            if (s.approved[tokenId] != address(0)) {
                delete s.approved[tokenId];
                emit Approval(owner, address(0), tokenId);
            }
            // unlock if locked
            if (s.aavegotchis[tokenId].unlockTime >= block.timestamp) {
                s.aavegotchis[tokenId].unlockTime = block.timestamp - 1;
            }
            emit Transfer(owner, address(this), tokenId);
        }
        emit WithdrawnBatch(owner, _tokenIds);
    }

    /**
     * @notice called when token is deposited on root chain
     * @dev Should be callable only by ChildChainManager
     * Should handle deposit by minting or unlocking the required tokenId for user
     * Make sure minting is done only by this function
     * @param user user address for whom deposit is being done
     * @param depositData abi encoded tokenId
     */
    function deposit(address user, bytes calldata depositData) external {
        require(msg.sender == s.childChainManager, "BridgeFacet: only childChainManager can call this function");
        (uint256 tokenType, bytes memory tokenDepositData) = abi.decode(depositData, (uint256, bytes));
        if (tokenType == ERC1155_TOKEN_TYPE) {
            (uint256[] memory ids, uint256[] memory values) = abi.decode(tokenDepositData, (uint256[], uint256[]));
            require(ids.length == values.length, "Bridge: ids length not equal to values length");
            for (uint256 i; i < ids.length; i++) {
                uint256 id = ids[i];
                uint256 value = values[i];
                s.items[user][id] += value;
            }
            emit TransferBatch(msg.sender, address(0), user, ids, values);
            emit AddedItemsBatch(user, ids, values);
        } else if (tokenType == ERC721_TOKEN_TYPE) {
            uint256[] memory tokenIds = abi.decode(tokenDepositData, (uint256[]));
            for (uint256 i; i < tokenIds.length; i++) {
                uint256 tokenId = tokenIds[i];
                require(address(this) == s.aavegotchis[tokenId].owner, "BridgeFacet: Not owner of token");
                s.aavegotchis[tokenId].owner = user;
                s.aavegotchiBalance[address(this)]--;
                s.aavegotchiBalance[user]++;
                emit Transfer(address(this), user, tokenId);
            }
            emit AddedAavegotchiBatch(user, tokenIds);
        }
    }
}
