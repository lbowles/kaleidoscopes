import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { ethers } from "hardhat"
import readline from "readline"
import * as fs from "fs"
import MerkleTree from "merkletreejs"
import { getMerkleRoot, getTree } from "../common/merkle"
import { Kaleidoscopes__factory } from "../types"

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
  const { deployments, getNamedAccounts, ethers } = hre
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()
  const signers = await ethers.getSigners()

  let name = "Kaleidoscopes"
  let symbol = "KLDSCP"
  let merkleRoot: string
  let addresses: string[] = signers.slice(0, 2).map((signer) => signer.address)

  if (hre.network.name !== "mainnet") {
    name = "Test"
    symbol = "TEST"
  }

  if (hre.network.name !== "hardhat") {
    const filePath = "./common/snapshot.csv"

    // Read the file contents into a string
    const fileContents = fs.readFileSync(filePath, "utf8")

    // Split the string into an array of lines
    addresses = fileContents.split("\n").map((line) => line.trim())
  }

  // Write the addresses to a file
  fs.writeFileSync("./common/snapshot.json", JSON.stringify(addresses))

  // Create a Merkle tree from the array of addresses
  const tree = getTree(addresses)

  // Get the Merkle root
  merkleRoot = "0x" + getMerkleRoot(tree)

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

  const deployResult = await deploy("Kaleidoscopes", {
    from: deployer,
    log: true,
    libraries: {
      utils: utilities.address,
      Trigonometry: trigonometry.address,
    },
    args: [name, symbol, ethers.utils.parseEther("0.01"), 1000, merkleRoot, renderer.address],
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  })

  if (hre.network.name === "hardhat") {
    const Kaleidoscopes = await deployments.get("Kaleidoscopes")
    const kaleidoscopes = Kaleidoscopes__factory.connect(Kaleidoscopes.address, signers[0])
    await kaleidoscopes.openPublicSale()
    console.log("Public sale opened")
  }
}
export default func
func.tags = ["Kaleidoscopes"]
func.dependencies = ["Renderer", "Libraries"]
