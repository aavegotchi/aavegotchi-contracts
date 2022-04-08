// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ThirdPartyDistributor is Ownable {
    using SafeERC20 for IERC20;

    struct Distribution {
        address beneficiary;
        uint32 proportion; // Sum of all proportions should add up to 100
    }

    Distribution[] public distributions;

    error ZeroAddress();
    error SumOfDistributionsNot100(uint256 sum);
    error NotEnoughBalance(address token, uint256 amount);

    constructor(address _owner, Distribution[] memory _distributions) {
        _transferOwnership(_owner);
        _updateDistributions(_distributions);
    }

    function partialReleaseToken(address _token, uint256 _amount) public {
        IERC20 token = IERC20(_token);

        if (_amount > token.balanceOf(address(this))) revert NotEnoughBalance(_token, _amount);

        for (uint256 i = 0; i < distributions.length; ) {
            uint256 amount = (distributions[i].proportion * _amount) / 100;
            token.safeTransfer(distributions[i].beneficiary, amount);
            unchecked {
                ++i;
            }
        }
    }

    function releaseToken(address _token) public {
        partialReleaseToken(_token, IERC20(_token).balanceOf(address(this)));
    }

    function releaseTokens(address[] calldata _tokens) external {
        for (uint256 i = 0; i < _tokens.length; ) {
            releaseToken(_tokens[i]);
            unchecked {
                ++i;
            }
        }
    }

    /*********************************************************************************************
     ************************************ OWNER FUNCTIONS ****************************************
     *********************************************************************************************/

    function updateDistribution(Distribution[] memory _distributions) public onlyOwner {
        _deleteDistributions();
        _updateDistributions(_distributions);
    }

    /********************************************************************************************
     ********************************** INTERNAL FUNCTIONS **************************************
     ********************************************************************************************/

    function _deleteDistributions() internal {
        for (uint256 i = 0; i < distributions.length; ) {
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
