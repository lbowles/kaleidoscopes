import { ConnectButton, useAddRecentTransaction } from "@rainbow-me/rainbowkit"
import { BigNumber, ethers } from "ethers"
import { formatEther } from "ethers/lib/utils.js"
import MerkleTree from "merkletreejs"
import { useEffect, useState } from "react"
import useSound from "use-sound"
import {
  useAccount,
  useBlockNumber,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useProvider,
  useSigner,
  useWaitForTransaction,
} from "wagmi"
import { getMerkleProof, getTree } from "../../../backend/common/merkle"
import allowlistAddresses from "../../../backend/common/snapshot.json"
import { Kaleidoscopes__factory } from "../../../backend/types"
import deployments from "../../src/deployments.json"
import loading from ".././img/loading.svg"
import kaleidoscopePlaceholder from ".././img/testKaleidoscope.svg"
import generalClickSound from ".././sounds/generalClickSound.mp3"
import mintClickSound from ".././sounds/mintClickSound.mp3"
import smallClickSound from ".././sounds/smallClick.mp3"
import successSound from ".././sounds/success.mp3"
import { Countdown } from "../components/Countdown/Countdown"
import { FAQ } from "../components/FAQ/FAQ"
import { Footer } from "../components/Footer/Footer"
import { Links } from "../components/Links/Links"
import { Traits } from "../components/Traits/Traits"
import style from "./LandingPage.module.css"

const kaleidoscopesConfig = {
  address: deployments.contracts.Kaleidoscopes.address,
  abi: deployments.contracts.Kaleidoscopes.abi,
}

const rendererConfig = {
  address: deployments.contracts.Renderer.address,
  abi: deployments.contracts.Renderer.abi,
}

function getEtherscanBaseURL(chainId: string) {
  return `https://${chainId !== "1" ? "goerli." : ""}etherscan.io`
}

function getOpenSeaLink(tokenId: string | number) {
  const development = process.env.NODE_ENV === "development"
  return `https://${development ? "testnets." : ""}opensea.io/assets/${development ? "goerli/" : ""}${
    deployments.contracts.Kaleidoscopes.address
  }/${tokenId}`
}

async function getBlockTime(provider: ethers.providers.BaseProvider, samples: number = 100): Promise<number> {
  const block = await provider.getBlock("latest")
  const previousBlock = await provider.getBlock(block.number - samples)
  return (block.timestamp - previousBlock.timestamp) / samples
}
async function futureBlockToDate(
  provider: ethers.providers.BaseProvider,
  blockNumber: number,
  blockTime: number = 12,
): Promise<Date> {
  const latestBlock = await provider.getBlock("latest")
  const { number: latestBlockNumber } = latestBlock
  const blocksUntilTarget = blockNumber - latestBlockNumber
  const targetBlockTimestamp = latestBlock.timestamp + blocksUntilTarget * blockTime
  return new Date(targetBlockTimestamp * 1000)
}

const etherscanBaseURL = getEtherscanBaseURL(deployments.chainId)

export function LandingPage() {
  // Blockchain

  const { data: signer } = useSigner()
  const { address } = useAccount()

  const provider = useProvider()
  const { data: latestBlockNumber } = useBlockNumber()
  const addRecentTransaction = useAddRecentTransaction()

  // Sound

  const [playbackRate, setPlaybackRate] = useState(0.75)
  const [playSuccess] = useSound(successSound)
  const [playGeneralClick] = useSound(generalClickSound)
  const [playMintClick] = useSound(mintClickSound)
  const [playSmallClick] = useSound(smallClickSound, {
    playbackRate,
    interrupt: true,
  })

  // State variables

  const [mintCount, setMintCount] = useState<number>(1)
  const [mintedTokens, setMintedTokens] = useState<number[]>([])

  const [merkleTree, setMerkleTree] = useState<MerkleTree>()
  const [merkleProof, setMerkleProof] = useState<`0x${string}`[]>()

  const [allowListDate, setAllowListDate] = useState<Date>()
  const [publicDate, setPublicDate] = useState<Date>()

  const [canMint, setCanMint] = useState<boolean>(false)

  const handleAmountClickUp = () => {
    setPlaybackRate(playbackRate + 0.4)
    playSmallClick()
  }
  const handleAmountClickDown = () => {
    if (mintCount > 1) setPlaybackRate(playbackRate - 0.4)
    playSmallClick()
  }

  const [randomTokenId, setRandomTokenId] = useState<number>(Math.round(Math.random() * 10000) + 1001)

  // Contract reads

  const { data: sampleSvg, isLoading: sampleSvgLoading } = useContractRead({
    ...rendererConfig,
    functionName: "render",
    // Random number
    args: [BigNumber.from(`${randomTokenId}`)],
  })

  const { data: mintPrice } = useContractRead({
    ...kaleidoscopesConfig,
    functionName: "price",
  })

  const { data: maxSupply } = useContractRead({
    ...kaleidoscopesConfig,
    functionName: "maxSupply",
  })

  const { data: totalSupply } = useContractRead({
    ...kaleidoscopesConfig,
    functionName: "totalSupply",
    watch: true,
  })

  const { data: allowlistMintBlock } = useContractRead({
    ...kaleidoscopesConfig,
    functionName: "allowListMintStartBlock",
  })

  const { data: publicMintBlockOffset } = useContractRead({
    ...kaleidoscopesConfig,
    functionName: "publicMintOffsetBlocks",
  })

  const hasAllowListStarted =
    allowlistMintBlock !== undefined &&
    latestBlockNumber !== undefined &&
    latestBlockNumber > allowlistMintBlock?.toNumber()
  const hasPublicSaleStarted =
    allowlistMintBlock !== undefined &&
    publicMintBlockOffset !== undefined &&
    latestBlockNumber !== undefined &&
    latestBlockNumber > allowlistMintBlock.add(publicMintBlockOffset).toNumber()

  // const hasAllowListStarted = true
  // const hasPublicSaleStarted = true

  // Contract writes

  const { config: mintAllowListConfig, error: mintError } = usePrepareContractWrite({
    ...kaleidoscopesConfig,
    functionName: "mintAllowList",
    args: [BigNumber.from(`${mintCount}`), merkleProof || []],
    overrides: {
      value: mintPrice?.mul(mintCount!),
    },
    enabled: !hasPublicSaleStarted && (merkleProof?.length || 0) > 0,
  })
  const {
    write: mintAllowList,
    data: mintAllowListSignResult,
    isLoading: isMintAllowListSignLoading,
    isSuccess: isMintAllowListSignSuccess,
  } = useContractWrite(mintAllowListConfig)

  const { config: mintPublicConfig, error: mintPublicError } = usePrepareContractWrite({
    ...kaleidoscopesConfig,
    functionName: "mintPublic",
    args: [BigNumber.from(`${mintCount}`)],
    overrides: {
      value: mintPrice?.mul(mintCount!),
    },
    enabled: hasPublicSaleStarted,
  })
  const {
    write: mintPublic,
    data: mintPublicSignResult,
    isLoading: isMintPublicSignLoading,
    isSuccess: isMintPublicSignSuccess,
  } = useContractWrite(mintPublicConfig)

  const mint = merkleProof ? mintAllowList : mintPublic
  const mintSignResult = hasPublicSaleStarted ? mintPublicSignResult : mintAllowListSignResult
  const isMintSignLoading = hasPublicSaleStarted ? isMintPublicSignLoading : isMintAllowListSignLoading
  const isMintSignSuccess = hasPublicSaleStarted ? isMintPublicSignSuccess : isMintAllowListSignSuccess

  const { data: mintTx, isLoading: isMintTxLoading } = useWaitForTransaction({
    hash: mintSignResult?.hash,
    confirmations: 1,
  })

  // Effects
  useEffect(() => {
    // Allowlist
    const tree = getTree(allowlistAddresses)
    // console.log("allowed addresses", allowlistAddresses)
    setMerkleTree(tree)
  }, [])

  useEffect(() => {
    ;(async () => {
      // Convert allowlist block to Date
      if (!allowlistMintBlock || !publicMintBlockOffset) {
        return
      }

      const blockTime = await getBlockTime(provider)
      const allowlistDate = await futureBlockToDate(provider, allowlistMintBlock.toNumber(), blockTime)
      const publicDate = await futureBlockToDate(
        provider,
        allowlistMintBlock.add(publicMintBlockOffset).toNumber(),
        blockTime,
      )

      setAllowListDate(allowlistDate)
      setPublicDate(publicDate)
    })()
  }, [allowlistMintBlock, publicMintBlockOffset])

  useEffect(() => {
    if (address && merkleTree) {
      setMerkleProof(undefined)
      const proof = getMerkleProof(merkleTree, address)
      if (proof.length > 0) {
        setMerkleProof(proof as `0x${string}`[])
        console.log("proof", proof)
      }
    }
  }, [address, merkleTree])

  useEffect(() => {
    if (mintSignResult) {
      addRecentTransaction({
        hash: mintSignResult.hash,
        description: "Mint Kaleidoscope",
      })
    }
  }, [mintSignResult])

  useEffect(() => {
    if (isMintSignSuccess) {
      playMintClick()
    }
  }, [isMintSignSuccess])

  useEffect(() => {
    if (mintTx) {
      playSuccess()
      const tokenIds = mintTx.logs.map((log) => {
        const events = Kaleidoscopes__factory.createInterface().decodeEventLog("Transfer", log.data, log.topics)
        return events.tokenId.toString()
      })
      setMintedTokens(tokenIds)
    }
  }, [mintTx])

  // useEffect(() => {
  //   if (mintedTokens.length > 0) {
  //     setHasAllowListStarted(false)
  //   } else {
  //     setHasAllowListStarted(true)
  //   }
  // }, [merkleProof])

  useEffect(() => {
    let _canMint = true
    if (!signer || !maxSupply || !totalSupply) {
      // Variables not loaded yet
      _canMint = false
      console.log("variables not loaded yet")
    } else if (maxSupply.lte(totalSupply)) {
      _canMint = false
      console.log("max supply reached")
    }

    if (_canMint) {
      _canMint = false
      if (hasAllowListStarted && merkleProof) {
        _canMint = true
        console.log("allowlist started and wallet eligible")
      } else if (hasPublicSaleStarted) {
        _canMint = true
      }
      setCanMint(_canMint)
    } else {
      setCanMint(_canMint)
    }
  }, [signer, maxSupply, totalSupply, hasAllowListStarted, merkleProof, hasPublicSaleStarted])

  return (
    <div>
      <div className="flex justify-center w-screen max-w-screen ">
        <img src={kaleidoscopePlaceholder} className="mt-[220px] w-[300px]"></img>
      </div>
      <div className="flex justify-between p-5  absolute w-full top-12  md:top-2 ">
        <h3 className="text-base font-bold text-gray-50">Kaleidoscopes</h3>
        <ConnectButton />
      </div>

      {/* TODO : Update with actual details  remove !*/}
      <div className="flex justify-center  mt-[65px] z-1 pl-10 pr-10 z-10 relative text-gray-200">
        <p className="text-size-sm">{`${totalSupply}/${maxSupply}`} minted</p>
      </div>
      <div className="flex justify-center z-1 pl-10 pr-10 z-10 relative text-gray-200">
        <p className="text-size-xs">{hasPublicSaleStarted ? "Public sale" : "Allow list sale"}</p>
      </div>
      {mintPrice && maxSupply && totalSupply && (
        <div className="flex justify-center  mt-6 z-1 pl-10 pr-10 z-10 relative">
          {isMintSignLoading ? (
            <button className={style.claimBtn}>
              <div className="flex flex-row">
                <img src={loading} className="animate-spin w-4"></img>‎ Confirm in wallet
              </div>
            </button>
          ) : isMintTxLoading ? (
            <a
              href={`${etherscanBaseURL}/tx/${mintSignResult?.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-center"
              onClick={() => {
                playGeneralClick()
              }}
            >
              <button className={style.claimBtn}>
                <div className="flex flex-row">
                  <img src={loading} className="animate-spin w-4"></img>‎ Transaction pending
                </div>
              </button>
            </a>
          ) : (
            <div>
              <button
                className="text-xl font-bold  hover:scale-125 duration-100 ease-in-out text-[#c697b4]"
                onClick={() => {
                  setMintCount(Math.max(mintCount - 1, 1))
                  handleAmountClickDown()
                }}
              >
                –
              </button>
              <button
                className={style.claimBtn}
                disabled={!canMint}
                onClick={() => {
                  mint?.()
                  playGeneralClick()
                }}
              >
                {maxSupply.gt(totalSupply)
                  ? `Mint ${mintCount} for ${formatEther(mintPrice.mul(mintCount))} Ξ`
                  : "Sold out"}
              </button>
              <button
                className="text-xl font-bold hover:scale-125 duration-100 ease-in-out text-[#c697b4]"
                onClick={() => {
                  setMintCount(mintCount + 1)
                  handleAmountClickUp()
                }}
              >
                +
              </button>
            </div>
          )}
        </div>
      )}
      {mintTx && mintTx.status && (
        <div className="-mb-[62px] h-[50px] text-gray-100">
          <div className="flex justify-center  mt-3 z-1 pl-10 pr-10 z-10 relative  h-4">
            <div>
              <a
                href={`${etherscanBaseURL}/tx/${mintTx.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-center text-xs"
                onClick={() => {
                  playGeneralClick()
                }}
              >
                View transaction
              </a>
            </div>
          </div>
          <div className="flex justify-center  mt-2 z-1 pl-10 pr-10 z-10 relative h-4">
            <div className="text-xs">
              Minted tokens: [{" "}
              {mintedTokens.map((tokenId) => {
                return (
                  <span key={tokenId}>
                    <a
                      href={getOpenSeaLink(tokenId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        playGeneralClick()
                      }}
                    >
                      {tokenId}
                    </a>
                    &nbsp;
                  </span>
                )
              })}
              ]
            </div>
          </div>
        </div>
      )}
      {allowListDate && publicDate && (
        <Countdown allowlistTime={allowListDate} publicTime={publicDate} playGeneralClick={playGeneralClick} />
      )}
      <div className="flex justify-center z-1 pl-10 pr-10 z-10 relative ">
        <p className="font-medium text-gray-100 text-center text-xl w-[360px] min-w-[360px]">
          Fully on-chain, procedurally generated, animated kaleidoscopes.
        </p>
      </div>
      <Links
        etherscanBaseURL={etherscanBaseURL}
        deployAddress={deployments.contracts.Kaleidoscopes.address}
        playGeneralClick={playGeneralClick}
      />
      <FAQ
        etherscanBaseURL={etherscanBaseURL}
        deployAddress={deployments.contracts.Kaleidoscopes.address}
        playGeneralClick={playGeneralClick}
      />
      <Traits />
      <Footer playGeneralClick={playGeneralClick} />
    </div>
  )
}
