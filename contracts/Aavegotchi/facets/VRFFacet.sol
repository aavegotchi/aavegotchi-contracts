//SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "../libraries/LibVrf.sol";
import "../interfaces/ILink.sol";
import "../../shared/libraries/LibDiamond.sol";

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

contract VrfFacet {
    event VrfBatchRandomNumber(uint256 indexed batchId, uint256 randomNumber, uint256 _vrfTimeSet);
    ILink internal immutable im_link;
    address internal immutable im_vrfCoordinator;

    constructor(address _vrfCoordinator, address _link) {
        im_vrfCoordinator = _vrfCoordinator;
        im_link = ILink(_link);
    }

    function drawRandomNumber() external {
        LibVrf.Storage storage vrf_ds = LibVrf.diamondStorage();
        require(block.timestamp >= vrf_ds.nextVrfCallTime, "VrfFacet: Waiting period to call VRF not over yet");
        require(vrf_ds.vrfPending == false, "VrfFacet: VRF call is pending");
        vrf_ds.vrfPending = true;
        // Use Chainlink VRF to generate random number
        require(im_link.balanceOf(address(this)) >= vrf_ds.fee, "Not enough LINK");
        im_link.transferAndCall(im_vrfCoordinator, vrf_ds.fee, abi.encode(vrf_ds.keyHash, 0));
    }

    function vrfInfo()
        external
        view
        returns (
            uint256 nextBatchId_,
            uint256 nextVrfCallTime_,
            bool vrfPending_
        )
    {
        LibVrf.Storage storage vrf_ds = LibVrf.diamondStorage();
        nextBatchId_ = vrf_ds.nextBatchId;
        nextVrfCallTime_ = vrf_ds.nextVrfCallTime;
        vrfPending_ = vrf_ds.vrfPending;
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
        _requestId; // mentioned here to remove unused variable warning
        require(msg.sender == im_vrfCoordinator, "Only VRFCoordinator can fulfill");
        LibVrf.Storage storage vrf_ds = LibVrf.diamondStorage();
        require(vrf_ds.vrfPending == true, "VrfFacet: VRF is not pending");
        vrf_ds.vrfPending = false;
        uint256 currentBatchId = vrf_ds.nextBatchId;
        vrf_ds.batchIdToRandomNumber[currentBatchId] = _randomNumber;
        vrf_ds.nextBatchId = uint32(currentBatchId + 1);
        vrf_ds.nextVrfCallTime = uint40(block.timestamp + 18 hours);
        emit VrfBatchRandomNumber(currentBatchId, _randomNumber, block.timestamp);
    }

    // Change the fee amount that is paid for VRF random numbers
    function changeVRFFee(uint256 _newFee, bytes32 _keyHash) external {
        require(msg.sender == LibDiamond.contractOwner(), "VrfFacet: Must be contract owner");
        LibVrf.Storage storage vrf_ds = LibVrf.diamondStorage();
        vrf_ds.fee = uint96(_newFee);
        vrf_ds.keyHash = _keyHash;
    }

    // Remove the LINK tokens from this contract that are used to pay for VRF random number fees
    function removeLinkTokens(address _to, uint256 _value) external {
        require(msg.sender == LibDiamond.contractOwner(), "VrfFacet: Must be contract owner");
        im_link.transfer(_to, _value);
    }

    function linkBalance() external view returns (uint256 linkBalance_) {
        linkBalance_ = im_link.balanceOf(address(this));
    }
}
