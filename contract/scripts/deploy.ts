import { ethers } from "hardhat";

async function main() {
  const Rewardify = await ethers.getContractFactory("Rewardify");
  const contract = await Rewardify.deploy();
  await contract.waitForDeployment();
  console.log("Contract deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});