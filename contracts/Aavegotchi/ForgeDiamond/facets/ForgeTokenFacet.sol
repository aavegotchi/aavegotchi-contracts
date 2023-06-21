import "../libraries/LibAppStorage.sol";
import {LibToken} from "../libraries/LibToken.sol";

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {IERC1155MetadataURI} from "@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol";
import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import {LibMeta} from "../../../shared/libraries/LibMeta.sol";
import {LibStrings} from "../../../shared/libraries/LibStrings.sol";
import {LibERC1155Marketplace} from "../../libraries/LibERC1155Marketplace.sol";

contract ForgeTokenFacet is Modifiers {
    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
    event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values);
    event ApprovalForAll(address indexed account, address indexed operator, bool approved);
    event URI(string value, uint256 indexed id);

    //    /**
    //     * @dev See {IERC165-supportsInterface}.
    //     */
    //    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
    //        return
    //        interfaceId == type(IERC1155).interfaceId ||
    //        interfaceId == type(IERC1155MetadataURI).interfaceId ||
    //        super.supportsInterface(interfaceId);
    //    }

    function name() external pure returns (string memory) {
        return "Aavegotchi Forge";
    }

    function symbol() external pure returns (string memory) {
        return "FORGE";
    }

    function uri(uint256 _id) external view returns (string memory) {
        return LibStrings.strWithUint(s._baseUri, _id);
    }

    function setBaseURI(string memory _value) external onlyDaoOrOwner {
        s._baseUri = _value;
    }

    function totalSupply(uint256 id) public view virtual returns (uint256) {
        return s._totalSupply[id];
    }

    /**
     * @dev See {IERC1155-balanceOf}.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     */
    function balanceOf(address account, uint256 id) public view returns (uint256) {
        require(account != address(0), "ForgeTokenFacet: address zero is not a valid owner");
        return s._balances[id][account];
    }

    /**
     * @dev See {IERC1155-balanceOfBatch}.
     *
     * Requirements:
     *
     * - `accounts` and `ids` must have the same length.
     */
    function balanceOfBatch(address[] memory accounts, uint256[] memory ids) public view returns (uint256[] memory) {
        require(accounts.length == ids.length, "ForgeTokenFacet: accounts and ids length mismatch");

        uint256[] memory batchBalances = new uint256[](accounts.length);

        for (uint256 i = 0; i < accounts.length; ++i) {
            batchBalances[i] = balanceOf(accounts[i], ids[i]);
        }

        return batchBalances;
    }

    // @notice return users balance of all tokens
    function balanceOfOwner(address account) public view returns (ItemBalancesIO[] memory output_) {
        uint256 count = s.ownerItems[account].length;
        output_ = new ItemBalancesIO[](count);
        for (uint256 i; i < count; i++) {
            uint256 tokenId = s.ownerItems[account][i];
            output_[i].balance = s.ownerItemBalances[account][tokenId];
            output_[i].tokenId = tokenId;
        }
    }

    /**
     * @dev See {IERC1155-setApprovalForAll}.
     */
    function setApprovalForAll(address operator, bool approved) public {
        _setApprovalForAll(LibMeta.msgSender(), operator, approved);
    }

    /**
     * @dev See {IERC1155-isApprovedForAll}.
     */
    function isApprovedForAll(address account, address operator) public view returns (bool) {
        return s._operatorApprovals[account][operator];
    }

    /**
     * @dev See {IERC1155-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public {
        require(from == msg.sender || isApprovedForAll(from, msg.sender), "ForgeTokenFacet: caller is not token owner or approved");
        _safeTransferFrom(from, to, id, amount, data);
    }

    /**
     * @dev See {IERC1155-safeBatchTransferFrom}.
     */
    function safeBatchTransferFrom(address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public {
        require(from == msg.sender || isApprovedForAll(from, msg.sender), "ForgeTokenFacet: caller is not token owner or approved");
        _safeBatchTransferFrom(from, to, ids, amounts, data);
    }

    /**
     * @dev Transfers `amount` tokens of token type `id` from `from` to `to`.
     *
     * Emits a {TransferSingle} event.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - `from` must have a balance of tokens of type `id` of at least `amount`.
     * - If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
     * acceptance magic value.
     */
    function _safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal {
        require(to != address(0), "ForgeTokenFacet: transfer to the zero address");

        LibToken.removeFromOwner(from, id, amount);
        LibToken.addToOwner(to, id, amount);
        LibERC1155Marketplace.updateERC1155Listing(s.aavegotchiDiamond, id, from);

        emit TransferSingle(LibMeta.msgSender(), from, to, id, amount);

        _doSafeTransferAcceptanceCheck(LibMeta.msgSender(), from, to, id, amount, data);
    }

    /**
     * @dev xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {_safeTransferFrom}.
     *
     * Emits a {TransferBatch} event.
     *
     * Requirements:
     *
     * - If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155BatchReceived} and return the
     * acceptance magic value.
     */
    function _safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal {
        require(ids.length == amounts.length, "ForgeTokenFacet: ids and amounts length mismatch");
        require(to != address(0), "ForgeTokenFacet: transfer to the zero address");

        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];

            LibToken.removeFromOwner(from, id, amount);
            LibToken.addToOwner(to, id, amount);
            LibERC1155Marketplace.updateERC1155Listing(s.aavegotchiDiamond, id, from);
        }

        emit TransferBatch(LibMeta.msgSender(), from, to, ids, amounts);

        _doSafeBatchTransferAcceptanceCheck(LibMeta.msgSender(), from, to, ids, amounts, data);
    }

    /**
     * @dev Approve `operator` to operate on all of `owner` tokens
     *
     * Emits an {ApprovalForAll} event.
     */
    function _setApprovalForAll(
        address owner,
        address operator,
        bool approved
    ) internal virtual {
        require(owner != operator, "ForgeTokenFacet: setting approval status for self");
        s._operatorApprovals[owner][operator] = approved;
        emit ApprovalForAll(owner, operator, approved);
    }

    function _doSafeTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) private {
        if (isContract(to)) {
            try IERC1155Receiver(to).onERC1155Received(operator, from, id, amount, data) returns (bytes4 response) {
                if (response != IERC1155Receiver.onERC1155Received.selector) {
                    revert("ForgeTokenFacet: ERC1155Receiver rejected tokens");
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert("ForgeTokenFacet: transfer to non-ERC1155Receiver implementer");
            }
        }
    }

    function _doSafeBatchTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) private {
        if (isContract(to)) {
            try IERC1155Receiver(to).onERC1155BatchReceived(operator, from, ids, amounts, data) returns (bytes4 response) {
                if (response != IERC1155Receiver.onERC1155BatchReceived.selector) {
                    revert("ForgeTokenFacet: ERC1155Receiver rejected tokens");
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert("ForgeTokenFacet: transfer to non-ERC1155Receiver implementer");
            }
        }
    }

    // from @openzeppelin/contracts/utils/Address.sol
    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize/address.code.length, which returns 0
        // for contracts in construction, since the code is only stored at the end
        // of the constructor execution.

        return account.code.length > 0;
    }

    // @dev Add support for receiving ERC1155 tokens.
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) external returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) external returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}
