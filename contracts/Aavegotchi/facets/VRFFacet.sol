// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "../libraries/LibVrf.sol";
import "../../shared/libraries/LibDiamond.sol";
import "../libraries/LibAppStorage.sol";
import "../../shared/libraries/LibMeta.sol";
import "../libraries/LibERC721Marketplace.sol";
import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";

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

contract VrfFacet is LibAppStorageModifiers {
    event VrfRandomNumber(uint256 indexed tokenId, uint256 randomNumber, uint256 _vrfTimeSet);
    event OpenPortals(uint256[] _tokenIds);
    event PortalOpened(uint256 indexed tokenId);

    /***********************************|
   |            Read Functions          |
   |__________________________________*/

    /*  function vrfInfo()
        external
        view
        returns (
            // uint256 nextBatchId_,
            // uint256 nextVrfCallTime_,
            bool vrfPending_
        )
    // uint256 batchCount_
    {
        LibVrf.Storage storage vrf_ds = LibVrf.diamondStorage();
        //  nextBatchId_ = vrf_ds.nextBatchId;
        //  nextVrfCallTime_ = vrf_ds.nextVrfCallTime;
        vrfPending_ = vrf_ds;
        //  batchCount_ = vrf_ds.batchCount;
    }
    */

    function linkBalance() external view returns (uint256 linkBalance_) {
        LibVrf.Storage storage vrf_ds = LibVrf.diamondStorage();
        linkBalance_ = vrf_ds.link.balanceOf(address(this));
    }

    /***********************************|
   |            Write Functions        |
   |__________________________________*/

    function drawRandomNumbers(uint256[] calldata _tokenIds) external {
        for (uint256 i; i < _tokenIds.length; i++) {
            drawRandomNumber(_tokenIds[i]);
        }
    }

    function openPortals(uint256[] calldata _tokenIds) external {
        address owner = LibMeta.msgSender();
        for (uint256 i; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            require(s.aavegotchis[tokenId].status == LibAavegotchi.STATUS_CLOSED_PORTAL, "AavegotchiFacet: Portal is not closed");
            require(owner == s.aavegotchis[tokenId].owner, "AavegotchiFacet: Only aavegotchi owner can open a portal");
            s.aavegotchis[tokenId].status = LibAavegotchi.STATUS_VRF_PENDING;
            drawRandomNumber(tokenId);
            LibERC721Marketplace.cancelERC721Listing(address(this), tokenId, owner);
        }
        emit OpenPortals(_tokenIds);
    }

    function drawRandomNumber(uint256 _tokenId) internal {
        LibVrf.Storage storage vrf_ds = LibVrf.diamondStorage();
        require(!vrf_ds.tokenIdToVrfPending[_tokenId], "VrfFacet: VRF call is pending");
        vrf_ds.tokenIdToVrfPending[_tokenId] = true;
        require(vrf_ds.link.balanceOf(address(this)) >= vrf_ds.fee, "VrfFacet: Not enough LINK");
        bytes32 requestId = requestRandomness(vrf_ds.keyHash, vrf_ds.fee, 0);
        vrf_ds.vrfRequestIdToTokenId[requestId] = _tokenId;
        // for testing
        tempFulfillRandomness(requestId, uint256(keccak256(abi.encodePacked(block.number, _tokenId))));
    }

    function requestRandomness(
        bytes32 _keyHash,
        uint256 _fee,
        uint256 _seed
    ) internal returns (bytes32 requestId) {
        LibVrf.Storage storage vrf_ds = LibVrf.diamondStorage();
        require(vrf_ds.link.transferAndCall(vrf_ds.vrfCoordinator, _fee, abi.encode(_keyHash, _seed)), "VrfFacet: link transfer failed");
        // This is the seed passed to VRFCoordinator. The oracle will mix this with
        // the hash of the block containing this request to obtain the seed/input
        // which is finally passed to the VRF cryptographic machinery.
        // So the seed doesn't actually do anything and is left over from an old API.
        uint256 vRFSeed = makeVRFInputSeed(_keyHash, _seed, address(this), vrf_ds.nonces[_keyHash]);
        // nonces[_keyHash] must stay in sync with
        // VRFCoordinator.nonces[_keyHash][this], which was incremented by the above
        // successful Link.transferAndCall (in VRFCoordinator.randomnessRequest).
        // This provides protection against the user repeating their input
        // seed, which would result in a predictable/duplicate output.
        vrf_ds.nonces[_keyHash]++;
        return makeRequestId(_keyHash, vRFSeed);
    }

    function makeRequestId(bytes32 _keyHash, uint256 _vRFInputSeed) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_keyHash, _vRFInputSeed));
    }

    function makeVRFInputSeed(
        bytes32 _keyHash,
        uint256 _userSeed,
        address _requester,
        uint256 _nonce
    ) internal pure returns (uint256) {
        return uint256(keccak256(abi.encode(_keyHash, _userSeed, _requester, _nonce)));
    }

    // for testing purpose only
    function tempFulfillRandomness(bytes32 _requestId, uint256 _randomNumber) internal {
        // console.log("bytes");
        // console.logBytes32(_requestId);
        //_requestId; // mentioned here to remove unused variable warning
        LibVrf.Storage storage vrf_ds = LibVrf.diamondStorage();
        uint256 tokenId = vrf_ds.vrfRequestIdToTokenId[_requestId];

        // console.log("token id:", tokenId);

        // require(LibMeta.msgSender() == im_vrfCoordinator, "Only VRFCoordinator can fulfill");

        require(vrf_ds.tokenIdToVrfPending[tokenId], "VrfFacet: VRF is not pending");
        vrf_ds.tokenIdToVrfPending[tokenId] = false;

        s.tokenIdToRandomNumber[tokenId] = _randomNumber;
        s.aavegotchis[tokenId].status = LibAavegotchi.STATUS_OPEN_PORTAL;

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
        // console.log("bytes");
        // console.logBytes32(_requestId);
        //_requestId; // mentioned here to remove unused variable warning
        LibVrf.Storage storage vrf_ds = LibVrf.diamondStorage();
        uint256 tokenId = vrf_ds.vrfRequestIdToTokenId[_requestId];

        // console.log("token id:", tokenId);

        require(LibMeta.msgSender() == vrf_ds.vrfCoordinator, "Only VRFCoordinator can fulfill");

        require(vrf_ds.tokenIdToVrfPending[tokenId], "VrfFacet: VRF is not pending");
        vrf_ds.tokenIdToVrfPending[tokenId] = false;

        s.tokenIdToRandomNumber[tokenId] = _randomNumber;
        s.aavegotchis[tokenId].status = LibAavegotchi.STATUS_OPEN_PORTAL;

        emit PortalOpened(tokenId);
        emit VrfRandomNumber(tokenId, _randomNumber, block.timestamp);
    }

    // Change the fee amount that is paid for VRF random numbers
    function changeVRFFee(uint256 _newFee, bytes32 _keyHash) external onlyOwner {
        LibVrf.Storage storage vrf_ds = LibVrf.diamondStorage();
        vrf_ds.fee = uint96(_newFee);
        vrf_ds.keyHash = _keyHash;
    }

    // Remove the LINK tokens from this contract that are used to pay for VRF random number fees
    function removeLinkTokens(address _to, uint256 _value) external onlyOwner {
        LibVrf.Storage storage vrf_ds = LibVrf.diamondStorage();
        vrf_ds.link.transfer(_to, _value);
    }
}
