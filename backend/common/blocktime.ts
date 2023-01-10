import { ethers } from "hardhat"

export async function getBlockTime(samples: number = 100): Promise<number> {
  const block = await ethers.provider.getBlock("latest")
  const previousBlock = await ethers.provider.getBlock(block.number - samples)
  return (block.timestamp - previousBlock.timestamp) / samples
}
export async function futureBlockToDate(blockNumber: number, blockTime: number = 12): Promise<Date> {
  const latestBlock = await ethers.provider.getBlock("latest")
  const { number: latestBlockNumber } = latestBlock
  const blocksUntilTarget = blockNumber - latestBlockNumber
  const targetBlockTimestamp = latestBlock.timestamp + blocksUntilTarget * blockTime
  return new Date(targetBlockTimestamp * 1000)
}

export async function futureDateToBlock(date: Date, blockTime: number = 12): Promise<number> {
  const latestBlock = await ethers.provider.getBlock("latest")
  const { number: latestBlockNumber, timestamp: latestBlockTimestamp } = latestBlock
  const blocksUntilTarget = Math.ceil((date.getTime() / 1000 - latestBlockTimestamp) / blockTime)
  return latestBlockNumber + blocksUntilTarget
}
