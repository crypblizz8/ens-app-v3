"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const func = async function (hre) {
    const { getNamedAccounts, deployments, network } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const registrar = await hardhat_1.ethers.getContract('BaseRegistrarImplementation');
    const priceOracle = await hardhat_1.ethers.getContract('StablePriceOracle');
    const reverseRegistrar = await hardhat_1.ethers.getContract('ReverseRegistrar');
    const nameWrapper = await hardhat_1.ethers.getContract('NameWrapper');
    const controller = await deploy('ETHRegistrarController', {
        from: deployer,
        args: [
            registrar.address,
            priceOracle.address,
            60,
            86400,
            reverseRegistrar.address,
            nameWrapper.address,
        ],
        log: true,
    });
    const tx1 = await registrar.addController(controller.address, {
        from: deployer,
    });
    console.log(`Adding controller as controller on registrar (tx: ${tx1.hash})...`);
    await tx1.wait();
    const tx2 = await nameWrapper.setController(controller.address, {
        from: deployer,
    });
    console.log(`Setting controller of NameWrapper to controller (tx: ${tx2.hash})...`);
    await tx2.wait();
    const tx3 = await reverseRegistrar.setController(controller.address, {
        from: deployer,
    });
    console.log(`Setting controller of ReverseRegistrar to controller (tx: ${tx3.hash})...`);
    await tx3.wait();
};
func.tags = ['ethregistrar', 'ETHRegistrarController'];
func.dependencies = ['registry', 'wrapper', 'BaseRegistrarImplementation'];
exports.default = func;
