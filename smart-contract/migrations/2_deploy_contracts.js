// migrations/2_deploy_contracts.js
const PaymiInvoice = artifacts.require('PaymiInvoice');
const PaymiInvoiceProxy = artifacts.require('PaymiInvoiceProxy');

module.exports = async function(deployer, network, accounts) {
  // Get USDT address from config or use default
  const usdtAddress = process.env.USDT_ADDRESS;

  // Deploy implementation with USDT address
  await deployer.deploy(PaymiInvoice, usdtAddress);
  const implementationInstance = await PaymiInvoice.deployed();

  // Deploy proxy with implementation address
  const proxyInstance = await deployer.deploy(
    PaymiInvoiceProxy, 
    implementationInstance.address
  );

  console.log('USDT Token Address:', usdtAddress);
  console.log('PaymiInvoice Implementation deployed at:', implementationInstance.address);
  console.log('PaymiInvoice Proxy deployed at:', proxyInstance.address);
};