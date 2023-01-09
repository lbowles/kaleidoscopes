import * as fs from "fs"
import { ethers } from "hardhat"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import readline from "readline"
import { getMerkleRoot, getTree } from "../common/merkle"
import { waitForBlocks } from "../test/helpers"
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

async function getBlockTime(n: number = 100): Promise<number> {
  const block = await ethers.provider.getBlock("latest")
  const previousBlock = await ethers.provider.getBlock(block.number - n)
  return (block.timestamp - previousBlock.timestamp) / n
}

async function futureBlockToDate(blockNumber: number, blockTime: number = 12): Promise<Date> {
  const latestBlock = await ethers.provider.getBlock("latest")
  const { number: latestBlockNumber } = latestBlock
  const blocksUntilTarget = blockNumber - latestBlockNumber
  const targetBlockTimestamp = latestBlock.timestamp + blocksUntilTarget * blockTime
  return new Date(targetBlockTimestamp * 1000)
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()
  const signers = await ethers.getSigners()

  const blockTime = await getBlockTime()

  let name = "Kaleidoscopes"
  let symbol = "KLDSCP"
  let merkleRoot: string
  let addresses: string[] = signers.slice(0, 2).map((signer) => signer.address)
  let allowListStartBlockNumber = 16399100 // 6pm UTC+2, 13 January 2023
  let publicMintOffsetBlocks = (3 * 60 * 60) / blockTime // 3 hours

  const currentBlock = await ethers.provider.getBlockNumber()

  if (hre.network.name !== "mainnet") {
    name = "Test"
    symbol = "TEST"
    allowListStartBlockNumber = currentBlock
    publicMintOffsetBlocks = Math.ceil((1 * 60) / blockTime) // 1 minute
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

  console.log(`Current block: ${currentBlock}`)
  console.log(`Block time: ${blockTime}s`)
  console.log(`Allowlist start block: ${allowListStartBlockNumber}`)
  console.log(`Public mint offset blocks: ${publicMintOffsetBlocks}`)

  const allowListSaleBlockDate = await futureBlockToDate(allowListStartBlockNumber, blockTime)
  const publicSaleBlockDate = await futureBlockToDate(allowListStartBlockNumber + publicMintOffsetBlocks, blockTime)

  // Prompt user to confirm if network, name, symbol are correct each on its own line
  console.log(`\nDeploying to ${hre.network.name}`)
  console.log(`Name: ${name}`)
  console.log(`Symbol: ${symbol}`)
  console.log(`Merkle root: ${merkleRoot} (${addresses.length} addresses)`)
  console.log(
    `Allowlist sale block date: ${allowListSaleBlockDate.toDateString()}, ${allowListSaleBlockDate.toTimeString()} @ ${blockTime}s block time`,
  )
  console.log(
    `Public sale block date: ${publicSaleBlockDate.toDateString()}, ${publicSaleBlockDate.toTimeString()} @ ${blockTime}s block time`,
  )
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
    args: [
      name,
      symbol,
      ethers.utils.parseEther("0.01"),
      1000,
      merkleRoot,
      allowListStartBlockNumber,
      publicMintOffsetBlocks, // 3 hours
      renderer.address,
    ],
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  })

  if (hre.network.name === "hardhat") {
    const Kaleidoscopes = await deployments.get("Kaleidoscopes")
    const kaleidoscopes = Kaleidoscopes__factory.connect(Kaleidoscopes.address, signers[0])

    const blocksUntilPublicSale = await kaleidoscopes.publicMintOffsetBlocks()
    await waitForBlocks(blocksUntilPublicSale)
    console.log("Public sale opened")
  }
}
export default func
func.tags = ["Kaleidoscopes"]
func.dependencies = ["Renderer", "Libraries"]
