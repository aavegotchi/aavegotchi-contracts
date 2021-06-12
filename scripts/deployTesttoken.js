async function main() {
  // We get the contract to deploy
  const Token = await ethers.getContractFactory("ERC20Token");
  const token = await Token.deploy();

  console.log("Token deployed to:", token.address);
  const name= await token.name()
  console.log(name)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

  exports.deployToken= main