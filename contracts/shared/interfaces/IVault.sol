interface IVault {
    function getDepositor(address _tokenAddress, uint256 _tokenId) external view returns (address);
}
