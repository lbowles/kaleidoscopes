import { task } from "hardhat/config"
import { futureDateToBlock, getBlockTime } from "../common/blocktime"
import { Kaleidoscopes, Kaleidoscopes__factory } from "../types"

task("al-reset", "Set allow list mint time to start in specified number of minutes", async ({ m: minutes }, hre) => {
  const { ethers, deployments } = hre
  const [signer] = await ethers.getSigners()
  const Kaleidoscopes = await deployments.get("Kaleidoscopes")
  const kaleidoscopes = Kaleidoscopes__factory.connect(Kaleidoscopes.address, signer) as Kaleidoscopes

  const now = new Date()
  const futureDate = new Date(now.getTime() + parseInt(minutes) * 60 * 1000)
  console.log(now.getTime(), parseInt(minutes) * 60 * 1000)
  const blockTime = await getBlockTime(ethers.provider, 10)
  const targetBlock = await futureDateToBlock(ethers.provider, futureDate, blockTime)

  console.log(`Target time: ${futureDate.toTimeString()}`)
  console.log(`Target block: ${targetBlock} (current block: ${await ethers.provider.getBlockNumber()})`)

  const tx = await kaleidoscopes.setAllowListMintStartBlock(targetBlock)
  console.log("Tx hash", tx.hash)
  await tx.wait()
}).addParam<number>("m", "Minutes within allowlist should commence")
