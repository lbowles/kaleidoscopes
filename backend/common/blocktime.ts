import { ethers } from "ethers"

export async function getBlockTime(provider: ethers.providers.Provider, samples: number = 100): Promise<number> {
  const block = await provider.getBlock("latest")
  const previousBlock = await provider.getBlock(block.number - samples)
  return (block.timestamp - previousBlock.timestamp) / samples
}
export async function futureBlockToDate(
  provider: ethers.providers.Provider,
  blockNumber: number,
  blockTime: number = 12,
): Promise<Date> {
  const latestBlock = await provider.getBlock("latest")
  const { number: latestBlockNumber } = latestBlock
  const blocksUntilTarget = blockNumber - latestBlockNumber
  const targetBlockTimestamp = latestBlock.timestamp + blocksUntilTarget * blockTime
  return new Date(targetBlockTimestamp * 1000)
}

export async function futureDateToBlock(
  provider: ethers.providers.Provider,
  date: Date,
  blockTime: number = 12,
): Promise<number> {
  const latestBlock = await provider.getBlock("latest")
  const { number: latestBlockNumber, timestamp: latestBlockTimestamp } = latestBlock
  const blocksUntilTarget = Math.ceil((date.getTime() / 1000 - latestBlockTimestamp) / blockTime)
  return latestBlockNumber + blocksUntilTarget
}
