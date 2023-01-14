import { BigNumber } from "ethers"
import { deployments, ethers } from "hardhat"
import readline from "readline"
import { Kaleidoscopes, Kaleidoscopes__factory } from "../types"
import _mintingAmounts from "./mintedToAddress.json"

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

async function getTotalMintedToAddressMap(kaleidoscopes: Kaleidoscopes) {
  // Get events for minting
  const mintEvents = await kaleidoscopes.queryFilter(
    kaleidoscopes.filters.Transfer(ethers.constants.AddressZero),
    16398922, // block of first mint -1
    16400867, // block of last mint before price reduction +1
  )

  // Build mapping of address to number of mint events
  const mintCounts = mintEvents.reduce((acc: { [address: string]: number }, event) => {
    if (acc[event.args[1]] === undefined) {
      acc[event.args[1]] = 1
    } else {
      acc[event.args[1]] += 1
    }
    return acc
  }, {})

  // Build mapping of minting amounts to addresses
  const mintingAmounts = Object.entries(mintCounts).reduce((acc: { [key: number]: string[] }, entry) => {
    if (acc[entry[1]] === undefined) {
      acc[entry[1]] = [entry[0]]
    } else {
      acc[entry[1]].push(entry[0])
    }
    return acc
  }, {})

  return mintingAmounts
}

async function main() {
  const signer = (await ethers.getSigners())[0]
  const deployment = await deployments.get("Kaleidoscopes")
  const kaleidoscopes = Kaleidoscopes__factory.connect(deployment.address, signer)

  // const mintingAmounts = await getTotalMintedToAddressMap(kaleidoscopes) // Saved to mintedToAddress.json
  let mintingAmounts = _mintingAmounts as unknown as { [key: string]: string[] }

  let totalGas = BigNumber.from("0")

  const doneAmounts: string[] = []

  // Remove amounts that have already been airdropped
  for (const amount of doneAmounts) {
    delete mintingAmounts[amount]
  }

  // For each amount, airdrop that amount to the array of addresses
  for (const amount in mintingAmounts) {
    const addresses = mintingAmounts[amount]
    const gas = await kaleidoscopes.estimateGas.airdrop(addresses, amount)
    totalGas = totalGas.add(gas)
  }

  const currentGasPrice = await ethers.provider.getGasPrice()

  console.log("Total gas:", totalGas.toString())
  console.log("Total gas cost:", ethers.utils.formatEther(totalGas.mul(currentGasPrice)), "ETH")
  console.log("Current gas price:", ethers.utils.formatUnits(currentGasPrice, "gwei"), "gwei")

  const ans = await userInput("Continue? (y/n): ")

  if (ans === "n") {
    return
  }

  for (const amount in mintingAmounts) {
    const addresses = mintingAmounts[amount]
    console.log("Airdropping", amount, "to", addresses.length, "addresses")
    const tx = await kaleidoscopes.airdrop(addresses, amount)
    await tx.wait()
  }

  // Set price to 0.005 ETH
  const tx = await kaleidoscopes.setPrice(ethers.utils.parseEther("0.005"))
}

main()
