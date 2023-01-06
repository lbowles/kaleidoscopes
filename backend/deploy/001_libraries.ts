import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { ethers } from "hardhat"
import readline from "readline"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  await deploy("utils", {
    from: deployer,
    log: true,
  })

  await deploy("Trigonometry", {
    from: deployer,
    log: true,
  })
}
export default func
func.tags = ["Libraries"]
func.dependencies = []
