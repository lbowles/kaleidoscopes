import { task } from "hardhat/config"
import { Kaleidoscopes, Kaleidoscopes__factory } from "../types"

task("token", "Get tokenURI for token id", async ({ id }, hre) => {
  const { ethers, deployments } = hre
  const [signer] = await ethers.getSigners()
  const Kaleidoscopes = await deployments.get("Kaleidoscopes")
  const kaleidoscopes = Kaleidoscopes__factory.connect(Kaleidoscopes.address, signer) as Kaleidoscopes

  const uri = await kaleidoscopes.tokenURI(id)
  console.log(`Token URI: ${uri}`)
}).addParam<number>("id", "ID of token to get URI for")
