var ethAccounts = artifacts.require("./ethAccounts.sol");

module.exports = function(deployer) {
  deployer.deploy(ethAccounts);
};
