const { Address } = require("ethereumjs-util")
const { Transaction } = require("@ethereumjs/tx")
const linker = require("solc/linker")

// async function deployAll(vm, pk, compileResult, targetContract) {
//   const ordered = Object.entries(compileResult.sources).sort(([, a], [, b]) => {
//     return b.id - a.id
//   })
//   ordered.pop()
//   const libraries = {}
//   console.log("hellooo", compileResult)
//   await Promise.all(
//     ordered.map(async ([name]) => {
//       const [contractName, contract] = Object.entries(compileResult.contracts[name])[0]
//       const bytecode = contract.evm.bytecode.object
//       const address = await deploy(vm, pk, bytecode)
//       libraries[contractName] = address.toString()
//     }),
//   )
//   console.log(libraries)

//   // Deploy target with linked libraries
//   const target = Object.values(compileResult.contracts[targetContract])[0]
//   console.log("linkReferences", target.evm.bytecode.linkReferences)
//   const bytecode = linker.linkBytecode(target.evm.bytecode.object, libraries)
//   console.log(bytecode)
//   const address = await deploy(vm, pk, bytecode)
//   return address
// }

async function deploy(vm, pk, bytecode, compileResult) {
  // Dependencies
  const libraries = {}
  await Promise.all(
    Object.entries(bytecode.linkReferences).map(async ([name]) => {
      const contractData = compileResult.contracts[name]
      const [contractName, contract] = Object.entries(contractData)[0]
      console.log(name)
      const bytecode = contract.evm.bytecode
      const address = await deploy(vm, pk, bytecode, compileResult)
      libraries[`${name}:${contractName}`] = address.toString()
    }),
  )
  const linkedBytecode = linker.linkBytecode(bytecode.object, libraries)

  const address = Address.fromPrivateKey(pk)
  const account = await vm.stateManager.getAccount(address)

  const txData = {
    value: 0,
    gasLimit: 200_000_000_000,
    gasPrice: 1,
    data: "0x" + linkedBytecode,
    nonce: account.nonce,
  }

  console.log("deploying")

  const tx = Transaction.fromTxData(txData).sign(pk)

  const deploymentResult = await vm.runTx({ tx })

  console.log(deploymentResult.gasUsed.toString())

  if (deploymentResult.execResult.exceptionError) {
    throw deploymentResult.execResult.exceptionError
  }

  return deploymentResult.createdAddress
}

module.exports = { deploy }
