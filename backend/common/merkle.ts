import { MerkleTree } from "merkletreejs"
import { utils } from "ethers"

export function getMerkleRoot(tree: MerkleTree) {
  return tree.getRoot().toString("hex")
}

export function getMerkleProof(tree: MerkleTree, address: string) {
  const hashedAddress = utils.keccak256(address)
  return tree.getHexProof(hashedAddress)
}

export function getTree(addresses: string[]) {
  // Create a Merkle tree from the array of addresses
  const tree = new MerkleTree(addresses.map(utils.keccak256), utils.keccak256, {
    sortPairs: true,
  })
  return tree
}
