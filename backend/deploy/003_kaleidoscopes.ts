import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { ethers } from "hardhat"
import readline from "readline"
import * as fs from "fs"
import MerkleTree from "merkletreejs"
import { getMerkleRoot } from "../common/merkle"

function userInput(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close()
      resolve(ans)
    }),
  )
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  let name = "Kaleidoscopes"
  let symbol = "KLDSCP"

  if (hre.network.name !== "mainnet") {
    name = "Test"
    symbol = "TEST"
  }

  const filePath = "./common/holders-snapshot-6-jan-2022.csv"

  // Read the file contents into a string
  const fileContents = fs.readFileSync(filePath, "utf8")

  // Split the string into an array of lines
  const addresses = fileContents.split("\n").map((line) => line.trim())

  // Create a Merkle tree from the array of addresses
  const tree = new MerkleTree(addresses.map(ethers.utils.keccak256), ethers.utils.keccak256, {
    sortPairs: true,
  })

  // Get the Merkle root
  const merkleRoot = "0x" + getMerkleRoot(tree)

  // Prompt user to confirm if network, name, symbol are correct each on its own line
  console.log(`\nDeploying to ${hre.network.name}`)
  console.log(`Name: ${name}`)
  console.log(`Symbol: ${symbol}`)
  console.log(`Merkle root: ${merkleRoot} (${addresses.length} addresses)`)
  if (hre.network.name !== "hardhat") {
    const confirm = await userInput("Continue? (y/n)\n> ")
    if (confirm !== "y") {
      console.log("Aborting deployment")
      return
    }
  }

  const utilities = await deployments.get("utils")
  const trigonometry = await deployments.get("Trigonometry")
  const renderer = await deployments.get("Renderer")

  await deploy("Kaleidoscopes", {
    from: deployer,
    log: true,
    libraries: {
      utils: utilities.address,
      Trigonometry: trigonometry.address,
    },
    args: [name, symbol, ethers.utils.parseEther("0.01"), 1000, merkleRoot, renderer.address],
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  })
}
export default func
func.tags = ["Kaleidoscopes"]
func.dependencies = ["Renderer", "Libraries"]
