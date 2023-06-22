// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {Modifiers} from "../libraries/LibAppStorage.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibERC721Marketplace} from "../libraries/LibERC721Marketplace.sol";
import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
import {ILink} from "../interfaces/ILink.sol";

//import "hardhat/console.sol";

/** ****************************************************************************
 * @notice Interface for contracts using VRF randomness
 * *****************************************************************************
 * @dev PURPOSE
 *
 * @dev Reggie the Random Oracle (not his real job) wants to provide randomness
 * @dev to Vera the verifier in such a way that Vera can be sure he's not
 * @dev making his output up to suit himself. Reggie provides Vera a public key
 * @dev to which he knows the secret key. Each time Vera provides a seed to
 * @dev Reggie, he gives back a value which is computed completely
 * @dev deterministically from the seed and the secret key.
 *
 * @dev Reggie provides a proof by which Vera can verify that the output was
 * @dev correctly computed once Reggie tells it to her, but without that proof,
 * @dev the output is indistinguishable to her from a uniform random sample
 * @dev from the output space.
 *
 * @dev The purpose of this contract is to make it easy for unrelated contracts
 * @dev to talk to Vera the verifier about the work Reggie is doing, to provide
 * @dev simple access to a verifiable source of randomness.
 * *****************************************************************************
 * @dev USAGE
 *
 * @dev Calling contracts must inherit from VRFConsumerInterface, and can
 * @dev initialize VRFConsumerInterface's attributes in their constructor as
 * @dev shown:
 *
 * @dev   contract VRFConsumer {
 * @dev     constuctor(<other arguments>, address _vrfCoordinator, address _link)
 * @dev       VRFConsumerBase(_vrfCoordinator, _link) public {
 * @dev         <initialization with other arguments goes here>
 * @dev       }
 * @dev   }
 *
 * @dev The oracle will have given you an ID for the VRF keypair they have
 * @dev committed to (let's call it keyHash), and have told you the minimum LINK
 * @dev price for VRF service. Make sure your contract has sufficient LINK, and
 * @dev call requestRandomness(keyHash, fee, seed), where seed is the input you
 * @dev want to generate randomness from.
 *
 * @dev Once the VRFCoordinator has received and validated the oracle's response
 * @dev to your request, it will call your contract's fulfillRandomness method.
 *
 * @dev The randomness argument to fulfillRandomness is the actual random value
 * @dev generated from your seed.
 *
 * @dev The requestId argument is generated from the keyHash and the seed by
 * @dev makeRequestId(keyHash, seed). If your contract could have concurrent
 * @dev requests open, you can use the requestId to track which seed is
 * @dev associated with which randomness. See VRFRequestIDBase.sol for more
 * @dev details.
 *
 * @dev Colliding `requestId`s are cryptographically impossible as long as seeds
 * @dev differ. (Which is critical to making unpredictable randomness! See the
 * @dev next section.)
 *
 * *****************************************************************************
 * @dev SECURITY CONSIDERATIONS
 *
 * @dev Since the ultimate input to the VRF is mixed with the block hash of the
 * @dev block in which the request is made, user-provided seeds have no impact
 * @dev on its economic security properties. They are only included for API
 * @dev compatability with previous versions of this contract.
 *
 * @dev Since the block hash of the block which contains the requestRandomness()
 * @dev call is mixed into the input to the VRF *last*, a sufficiently powerful
 * @dev miner could, in principle, fork the blockchain to evict the block
 * @dev containing the request, forcing the request to be included in a
 * @dev different block with a different hash, and therefore a different input
 * @dev to the VRF. However, such an attack would incur a substantial economic
 * @dev cost. This cost scales with the number of blocks the VRF oracle waits
 * @dev until it calls fulfillRandomness().
 */

contract VrfFacet is Modifiers {
    event VrfRandomNumber(uint256 indexed tokenId, uint256 randomNumber, uint256 _vrfTimeSet);
    event OpenPortals(uint256[] _tokenIds);
    event PortalOpened(uint256 indexed tokenId);

    /***********************************|
   |            Read Functions          |
   |__________________________________*/

    function linkBalance() external view returns (uint256 linkBalance_) {
        linkBalance_ = s.link.balanceOf(address(this));
    }

    function vrfCoordinator() external view returns (address) {
        return s.vrfCoordinator;
    }

    function link() external view returns (address) {
        return address(s.link);
    }

    function keyHash() external view returns (bytes32) {
        return s.keyHash;
    }

    /***********************************|
   |            Write Functions        |
   |__________________________________*/

    // function drawRandomNumbers(uint256[] calldata _tokenIds) external {
    //     for (uint256 i; i < _tokenIds.length; i++) {
    //         drawRandomNumber(_tokenIds[i]);
    //     }
    // }

    function openPortals(uint256[] calldata _tokenIds) external {
        address owner = LibMeta.msgSender();
        for (uint256 i; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            require(s.aavegotchis[tokenId].status == LibAavegotchi.STATUS_CLOSED_PORTAL, "AavegotchiFacet: Portal is not closed");
            require(owner == s.aavegotchis[tokenId].owner, "AavegotchiFacet: Only aavegotchi owner can open a portal");
            require(s.aavegotchis[tokenId].locked == false, "AavegotchiFacet: Can't open portal when it is locked");
            drawRandomNumber(tokenId);
            // LibERC721Marketplace.cancelERC721Listing(address(this), tokenId, owner);
        }
        emit OpenPortals(_tokenIds);
    }

    function drawRandomNumber(uint256 _tokenId) internal {
        s.aavegotchis[_tokenId].status = LibAavegotchi.STATUS_VRF_PENDING;
        uint256 fee = s.fee;
        // require(s.link.balanceOf(address(this)) >= fee, "VrfFacet: Not enough LINK");
        bytes32 l_keyHash = s.keyHash;
        // require(s.link.transferAndCall(s.vrfCoordinator, fee, abi.encode(l_keyHash, 0)), "VrfFacet: link transfer failed");
        uint256 vrfSeed = uint256(keccak256(abi.encode(l_keyHash, 0, address(this), s.vrfNonces[l_keyHash])));
        s.vrfNonces[l_keyHash]++;
        bytes32 requestId = keccak256(abi.encodePacked(l_keyHash, vrfSeed));
        s.vrfRequestIdToTokenId[requestId] = _tokenId;
        // for testing
        tempFulfillRandomness(requestId, uint256(keccak256(abi.encodePacked(block.number, _tokenId))));
    }

    // for testing purpose only
    function tempFulfillRandomness(bytes32 _requestId, uint256 _randomNumber) internal {
        // console.log("bytes");
        // console.logBytes32(_requestId);
        //_requestId; // mentioned here to remove unused variable warning

        uint256 tokenId = s.vrfRequestIdToTokenId[_requestId];

        // console.log("token id:", tokenId);

        // require(LibMeta.msgSender() == im_vrfCoordinator, "Only VRFCoordinator can fulfill");
        require(s.aavegotchis[tokenId].status == LibAavegotchi.STATUS_VRF_PENDING, "VrfFacet: VRF is not pending");
        s.aavegotchis[tokenId].status = LibAavegotchi.STATUS_OPEN_PORTAL;
        s.tokenIdToRandomNumber[tokenId] = _randomNumber;

        emit PortalOpened(tokenId);
        emit VrfRandomNumber(tokenId, _randomNumber, block.timestamp);
    }

    /**
     * @notice fulfillRandomness handles the VRF response. Your contract must
     * @notice implement it.
     *
     * @dev The VRFCoordinator expects a calling contract to have a method with
     * @dev this signature, and will trigger it once it has verified the proof
     * @dev associated with the randomness (It is triggered via a call to
     * @dev rawFulfillRandomness, below.)
     *
     * @param _requestId The Id initially returned by requestRandomness
     * @param _randomNumber the VRF output
     */
    function rawFulfillRandomness(bytes32 _requestId, uint256 _randomNumber) external {
        uint256 tokenId = s.vrfRequestIdToTokenId[_requestId];

        require(LibMeta.msgSender() == s.vrfCoordinator, "Only VRFCoordinator can fulfill");

        require(s.aavegotchis[tokenId].status == LibAavegotchi.STATUS_VRF_PENDING, "VrfFacet: VRF is not pending");
        s.aavegotchis[tokenId].status = LibAavegotchi.STATUS_OPEN_PORTAL;
        s.tokenIdToRandomNumber[tokenId] = _randomNumber;

        emit PortalOpened(tokenId);
        emit VrfRandomNumber(tokenId, _randomNumber, block.timestamp);
    }

    ///@notice Allow the aavegotchi diamond owner to change the vrf details
    //@param _newFee New VRF fee (in LINK)
    //@param _keyHash New keyhash
    //@param _vrfCoordinator The new vrf coordinator address
    //@param _link New LINK token contract address
    function changeVrf(
        uint256 _newFee,
        bytes32 _keyHash,
        address _vrfCoordinator,
        address _link
    ) external onlyOwner {
        if (_newFee != 0) {
            s.fee = uint96(_newFee);
        }
        if (_keyHash != 0) {
            s.keyHash = _keyHash;
        }
        if (_vrfCoordinator != address(0)) {
            s.vrfCoordinator = _vrfCoordinator;
        }
        if (_link != address(0)) {
            s.link = ILink(_link);
        }
    }

    // Remove the LINK tokens from this contract that are used to pay for VRF random number fees
    function removeLinkTokens(address _to, uint256 _value) external onlyOwner {
        s.link.transfer(_to, _value);
    }
}
