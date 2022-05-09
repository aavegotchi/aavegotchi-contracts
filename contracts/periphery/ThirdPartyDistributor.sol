// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**********************************************************************************************************************************************
The Third Party Distributor contract is a simple escrow contract that releases tokens proportionally to distribution targets. 

To start out, follow these steps:

1. Deploy the Third Party Distributor contract with constructor arguments in the format:
(address _owner, [(address beneficiary1, uint32 proportion1), (address beneficiary2, uint32 proportion2)], uint256 _releaseAccess)

	a. address _owner - address of the owner of the contract
	b. Distributions[] _distributions - an array of structs of the format (address beneficiary, uint32 proportion)
		i. beneficiary - address of distribution receiver
		ii. proportion - uint32 between 0 and 100. The percent the beneficiary is entitled to of any balance in the escrow contract. Needs to add up to 100.
	c. ReleaseAccess (uint256) _releaseAccess - This variable decides who can call the release functions. Does not affect the amount beneficiaries receive.
		i. 0 - Public, no restriction
		ii. 1 - Contract owner only
		iii. 2 - Beneficiaries only
		iv. 3 - Contract owner or beneficiaries
        Other values are invalid and will revert.

2. Set the third party distributor contract address as the third party in lending

3. Call release in one of four flavors:
	a. partialReleaseToken(address token, address amount) - releases "amount" of "token"
	b. releaseToken(address token) - releases all of "token"
	c. partialReleaseTokens([(address token1, uint256 amount1), (address token2, uint256 amount2)]) - releases "amount" of each "token"
	d. releaseTokens(address[] tokens) - releases all of each "token"


The owner has access to update the distributions and release access with updateDistributions and updateReleaseAccess.
***********************************************************************************************************************************************/

contract ThirdPartyDistributor is Ownable {
    using SafeERC20 for IERC20;

    enum ReleaseAccess {
        Public,
        Owner,
        Beneficiaries,
        OwnerAndBeneficiaries
    }

    struct Distribution {
        address beneficiary;
        uint32 proportion; // Sum of all proportions should add up to 100
    }

    Distribution[] public distributions;
    ReleaseAccess public releaseAccess;

    event TokensReleased(address token, uint256 amount);
    event DistributionsUpdated();

    error ZeroAddress();
    error SumOfDistributionsNot100(uint256 sum);
    error NotEnoughBalance(address token, uint256 amount);
    error ImproperAccess(address sender, ReleaseAccess access);
    error BeneficiaryDoesNotExist(address beneficiary);
    error Unknown();

    modifier checkReleaseAccess() {
        bool senderIsBeneficiary = isBeneficiary(msg.sender);
        bool senderIsOwner = msg.sender == owner();
        if (releaseAccess == ReleaseAccess.Public) {
            _;
        } else if (releaseAccess == ReleaseAccess.Owner) {
            if (!senderIsOwner) revert ImproperAccess(msg.sender, releaseAccess);
            _;
        } else if (releaseAccess == ReleaseAccess.Beneficiaries) {
            if (!senderIsBeneficiary) revert ImproperAccess(msg.sender, releaseAccess);
            _;
        } else if (releaseAccess == ReleaseAccess.OwnerAndBeneficiaries) {
            if (!senderIsOwner && !senderIsBeneficiary) revert ImproperAccess(msg.sender, releaseAccess);
            _;
        } else {
            revert Unknown();
        }
    }

    constructor(
        address _owner,
        Distribution[] memory _distributions,
        ReleaseAccess _releaseAccess
    ) {
        _transferOwnership(_owner);
        _updateDistributions(_distributions);
        releaseAccess = _releaseAccess;
    }

    function partialReleaseToken(address _token, uint256 _amount) external checkReleaseAccess {
        _partialReleaseToken(_token, _amount);
    }

    function releaseToken(address _token) external checkReleaseAccess {
        _releaseToken(_token);
    }

    struct ReleaseParams {
        address token;
        uint256 amount;
    }

    function partialReleaseTokens(ReleaseParams[] memory _params) external checkReleaseAccess {
        for (uint256 i = 0; i < _params.length; ) {
            _partialReleaseToken(_params[i].token, _params[i].amount);
            unchecked {
                ++i;
            }
        }
    }

    function releaseTokens(address[] calldata _tokens) external checkReleaseAccess {
        for (uint256 i = 0; i < _tokens.length; ) {
            _releaseToken(_tokens[i]);
            unchecked {
                ++i;
            }
        }
    }

    function isBeneficiary(address _beneficiary) public view returns (bool) {
        for (uint256 i = 0; i < distributions.length; ) {
            if (distributions[i].beneficiary == _beneficiary) return true;
            unchecked {
                ++i;
            }
        }
        return false;
    }

    function beneficiaryDistribution(address _beneficiary) external view returns (Distribution memory distribution) {
        for (uint256 i = 0; i < distributions.length; ) {
            if (distributions[i].beneficiary == _beneficiary) {
                return distributions[i];
            }
            unchecked {
                ++i;
            }
        }
        revert BeneficiaryDoesNotExist(_beneficiary);
    }

    function numBeneficiaries() external view returns (uint256) {
        return distributions.length;
    }

    /*********************************************************************************************
     ************************************ OWNER FUNCTIONS ****************************************
     *********************************************************************************************/

    function updateDistribution(Distribution[] memory _distributions) external onlyOwner {
        _deleteDistributions();
        _updateDistributions(_distributions);
        emit DistributionsUpdated();
    }

    function updateReleaseAccess(ReleaseAccess _releaseAccess) external onlyOwner {
        releaseAccess = _releaseAccess;
    }

    /********************************************************************************************
     ********************************** INTERNAL FUNCTIONS **************************************
     ********************************************************************************************/
    function _partialReleaseToken(address _token, uint256 _amount) internal {
        IERC20 token = IERC20(_token);

        if (_amount > token.balanceOf(address(this))) revert NotEnoughBalance(_token, _amount);

        for (uint256 i = 0; i < distributions.length; ) {
            uint256 amount = (distributions[i].proportion * _amount) / 100;
            token.safeTransfer(distributions[i].beneficiary, amount);
            unchecked {
                ++i;
            }
        }
        emit TokensReleased(_token, _amount);
    }

    function _releaseToken(address _token) internal {
        _partialReleaseToken(_token, IERC20(_token).balanceOf(address(this)));
    }

    function _deleteDistributions() internal {
        uint256 length = distributions.length;
        for (uint256 i = 0; i < length; ) {
            distributions.pop();
            unchecked {
                ++i;
            }
        }
    }

    function _updateDistributions(Distribution[] memory _distributions) internal {
        uint256 sum;
        for (uint256 i = 0; i < _distributions.length; ) {
            if (_distributions[i].beneficiary == address(0)) revert ZeroAddress();
            sum += _distributions[i].proportion;
            distributions.push(_distributions[i]);
            unchecked {
                ++i;
            }
        }
        if (sum != 100) revert SumOfDistributionsNot100(sum);
    }
}
