// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {AppStorage} from "../libraries/LibAppStorage.sol";
import {LibDiamond} from "../../shared/libraries/LibDiamond.sol";
import {LibStrings} from "../../shared/libraries/LibStrings.sol";
import {RLPReader} from "../../shared/libraries/RLPReader.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";
import {LibERC721} from "../../shared/libraries/LibERC721.sol";

// tokenType is keccak256(abi.encodePacked("AAVEGOTCHI")) == 0x79828ff8b1cfa00f403edd7ec403b29946552bf9b1ad51da3af53c3557d8da26
// tokenType is used to find the predicate contract for the token.

contract BridgeFacet {
    AppStorage internal s;
    using RLPReader for bytes;
    using RLPReader for RLPReader.RLPItem;

    function rootChainManager() public view returns (address) {
        return s.rootChainManager;
    }

    function setRootChainManager(address _newRootChainManager) external {
        LibDiamond.enforceIsContractOwner();
        s.rootChainManager = _newRootChainManager;
    }

    event ERC1155SendToBridge(address indexed depositor, address indexed receiver, uint256[] ids, uint256[] values);
    event ERC721SendToBridge(address indexed depositor, address indexed receiver, uint256[] ids);
    uint256 internal constant ERC721_TOKEN_TYPE = 721;
    uint256 internal constant ERC1155_TOKEN_TYPE = 1155;

    bytes32 public constant WITHDRAW_ERC721_BATCH_EVENT_SIG = 0xf871896b17e9cb7a64941c62c188a4f5c621b86800e3d15452ece01ce56073df;

    bytes32 public constant TRANSFER_ERC1155_BATCH_EVENT_SIG = 0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb;

    /**
     * @notice Lock ERC1155 tokens for deposit, callable only by manager
     * @param depositor Address who wants to deposit tokens
     * @param depositReceiver Address (address) who wants to receive tokens on child chain
     * @param rootToken Token which gets deposited
     * @param depositData ABI encoded id array and amount array
     */
    function lockTokens(
        address depositor,
        address depositReceiver,
        address rootToken,
        bytes calldata depositData
    ) external {
        require(msg.sender == rootChainManager(), "BridgeFacet: not rootChainManager");
        require(rootToken == address(this), "BridgeFacet: wrong rootToken address");
        (uint256 tokenType, bytes memory tokenDepositData) = abi.decode(depositData, (uint256, bytes));
        if (tokenType == ERC1155_TOKEN_TYPE) {
            (uint256[] memory ids, uint256[] memory values) = abi.decode(tokenDepositData, (uint256[], uint256[]));
            require(ids.length == values.length, "Bridge: ids length not equal to values length");
            require(ids.length <= 20, "Bridge: exceeded max number (20) of ids for single transaction");
            for (uint256 i; i < ids.length; i++) {
                uint256 id = ids[i];
                uint256 value = values[i];
                uint256 bal = s.items[depositor][id];
                require(value <= bal, "Bridge: Doesn't have that many to transfer");
                s.items[depositor][id] = bal - value;
            }
            emit LibERC1155.TransferBatch(msg.sender, depositor, address(0), ids, values);
            emit ERC1155SendToBridge(depositor, depositReceiver, ids, values);
        // } else if (tokenType == ERC721_TOKEN_TYPE) {
        //     uint256[] memory tokenIds = abi.decode(tokenDepositData, (uint256[]));
        //     require(tokenIds.length <= 20, "Bridge: exceeds 20 deposit limit for single transaction");
        //     for (uint256 i; i < tokenIds.length; i++) {
        //         uint256 tokenId = tokenIds[i];
        //         require(s.aavegotchis[tokenId].owner == depositor, "BridgeFacet: depositor does not own the token");
        //         s.aavegotchis[tokenId].owner = address(0);
        //         s.aavegotchiBalance[depositor]--;
        //         if (s.approved[tokenId] != address(0)) {
        //             delete s.approved[tokenId];
        //             emit LibERC721.Approval(depositor, address(0), tokenId);
        //         }
        //         emit LibERC721.Transfer(depositor, address(0), tokenId);
                
        //         uint256 lastIndex = s.tokenIds.length - 1;
        //         uint256 index = s.tokenIdIndexes[tokenId];
        //         if(lastIndex != index) {
        //             uint256 lastTokenId = s.tokenIds[lastIndex];
        //             s.tokenIds[index] = uint32(lastTokenId);
        //             s.tokenIdIndexes[lastTokenId] = index;
        //         }
        //         delete s.tokenIdIndexes[tokenId];
        //         s.tokenIds.pop();
        //     }            
        //     emit ERC721SendToBridge(depositor, depositReceiver, tokenIds);
        } else {
            revert("Token deposit type is incorrect");
        }
    }

    /**
     * @notice Validates log signature, from and to address
     * then sends the correct tokenId, amount to withdrawer
     * callable only by manager
     * @param rootToken Token which gets withdrawn
     * @param log Valid ERC1155 TransferSingle burn or TransferBatch burn log from child chain
     */
    function exitTokens(
        address,
        address rootToken,
        bytes calldata log
    ) external {
        require(msg.sender == rootChainManager(), "BridgeFacet: not rootChainManager");
        require(rootToken == address(this), "BridgeFacet: incorrect rootToken");
        RLPReader.RLPItem[] memory logRLPList = log.toRlpItem().toList();
        RLPReader.RLPItem[] memory logTopicRLPList = logRLPList[1].toList(); // topics
        bytes memory logData = logRLPList[2].toBytes();

        if (bytes32(logTopicRLPList[0].toUint()) == TRANSFER_ERC1155_BATCH_EVENT_SIG) {            
            address withdrawer = address(uint160(logTopicRLPList[2].toUint())); // topic2 is from address
            require(
                address(uint160(logTopicRLPList[3].toUint())) == address(0), // topic3 is to address
                "ERC1155Predicate: INVALID_RECEIVER"
            );
            (uint256[] memory ids, uint256[] memory values) = abi.decode(logData, (uint256[], uint256[]));
            require(ids.length == values.length, "BridgeFacet: ids different length than values");
            for (uint256 i; i < ids.length; i++) {
                uint256 id = ids[i];
                uint256 value = values[i];
                s.items[withdrawer][id] += value;
                if (s.itemTypeExists[id] == false) {
                    s.itemTypeExists[id] = true;
                    s.itemTypes.push(id);
                    emit LibERC1155.URI(LibStrings.strWithUint(s.itemsBaseUri, id), id);
                }
            }
            emit LibERC1155.TransferBatch(msg.sender, address(0), withdrawer, ids, values);
        // } else if (bytes32(logTopicRLPList[0].toUint()) == WITHDRAW_ERC721_BATCH_EVENT_SIG) {
        //     address withdrawer = address(uint160(logTopicRLPList[1].toUint())); // topic1 is from address
        //     uint256[] memory tokenIds = abi.decode(logData, (uint256[])); // data is tokenId list
        //     uint256 length = tokenIds.length;
        //     for (uint256 i; i < length; i++) {
        //         uint256 tokenId = tokenIds[i];
        //         s.aavegotchis[tokenId].owner = withdrawer;
        //         s.aavegotchiBalance[withdrawer]++;
        //         s.tokenIdIndexes[tokenId] = s.tokenIds.length;
        //         s.tokenIds.push(uint32(tokenId));
        //         emit LibERC721.Transfer(address(0), withdrawer, tokenId);
        //     }            
        } else {
            revert("BridgeFacet: INVALID_WITHDRAW_SIG");
        }
    }
}
