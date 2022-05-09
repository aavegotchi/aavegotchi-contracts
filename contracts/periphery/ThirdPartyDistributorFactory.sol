pragma solidity 0.8.13;
import "./ThirdPartyDistributor.sol";

contract ThirdPartyDistributorFactory {
    event ContractDeployed(address owner, address distributor);

    function deploy(
        address _owner,
        ThirdPartyDistributor.Distribution[] memory _distributions,
        ThirdPartyDistributor.ReleaseAccess _releaseAccess
    ) public returns (address) {
        ThirdPartyDistributor distributor = new ThirdPartyDistributor(_owner, _distributions, _releaseAccess);
        emit ContractDeployed(_owner, address(distributor));
        return address(distributor);
    }
}
