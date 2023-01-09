import { ConnectButton, useAddRecentTransaction } from "@rainbow-me/rainbowkit"
import { BigNumber } from "ethers"
import { formatEther } from "ethers/lib/utils.js"
import { useEffect, useState } from "react"
import useSound from "use-sound"
import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useSigner,
  useWaitForTransaction,
} from "wagmi"
import { Kaleidoscopes__factory } from "../../../backend/types"
import deployments from "../../src/deployments.json"
import loading from ".././img/loading.svg"
import kaleidoscopePlaceholder from ".././img/testKaleidoscope.svg"
import generalClickSound from ".././sounds/generalClickSound.mp3"
import mintClickSound from ".././sounds/mintClickSound.mp3"
import smallClickSound from ".././sounds/smallClick.mp3"
import successSound from ".././sounds/success.mp3"
import style from "./LandingPage.module.css"
import { getMerkleProof, getTree } from "../../../backend/common/merkle"
import allowlistAddresses from "../../../backend/common/snapshot.json"
import MerkleTree from "merkletreejs"
import { Countdown } from "../components/Countdown/Countdown"
import { Links } from "../components/Links/Links"
import { FAQ } from "../components/FAQ/FAQ"
import { Traits } from "../components/Traits/Traits"
import { Footer } from "../components/Footer/Footer"

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

const etherscanBaseURL = getEtherscanBaseURL(deployments.chainId)

export function LandingPage() {
  const [mintCount, setMintCount] = useState<number>(1)
  const [mintedTokens, setMintedTokens] = useState<number[]>([])

  const [hasAllowListStarted, setHasAllowListStarted] = useState(false)

  const { data: signer } = useSigner()
  const { address } = useAccount()
  const addRecentTransaction = useAddRecentTransaction()

  const [merkleTree, setMerkleTree] = useState<MerkleTree>()
  const [merkleProof, setMerkleProof] = useState<`0x${string}`[]>()

  // TODO: add time
  const awaitListDate = new Date("2023-01-09T12:00:00Z").getTime()
  const publicDate = new Date("2023-01-09T13:22:00Z").getTime()

  const [playbackRate, setPlaybackRate] = useState(0.75)
  const [playSuccess] = useSound(successSound)
  const [playGeneralClick] = useSound(generalClickSound)
  const [playMintClick] = useSound(mintClickSound)
  const [playSmallClick] = useSound(smallClickSound, {
    playbackRate,
    interrupt: true,
  })

  function listenPlayGeneralClick() {
    playGeneralClick()
  }

  const handleAmountClickUp = () => {
    setPlaybackRate(playbackRate + 0.4)
    playSmallClick()
  }
  const handleAmountClickDown = () => {
    if (mintCount > 1) setPlaybackRate(playbackRate - 0.4)
    playSmallClick()
  }

  const [randomTokenId, setRandomTokenId] = useState<number>(Math.round(Math.random() * 10000) + 1001)

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

  const { data: hasPublicSaleStarted } = useContractRead({
    ...kaleidoscopesConfig,
    functionName: "hasPublicSaleStarted",
  })

  const { data: totalSupply } = useContractRead({
    ...kaleidoscopesConfig,
    functionName: "totalSupply",
    watch: true,
  })

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

  const mint = hasPublicSaleStarted ? mintPublic : mintAllowList
  const mintSignResult = hasPublicSaleStarted ? mintPublicSignResult : mintAllowListSignResult
  const isMintSignLoading = hasPublicSaleStarted ? isMintPublicSignLoading : isMintAllowListSignLoading
  const isMintSignSuccess = hasPublicSaleStarted ? isMintPublicSignSuccess : isMintAllowListSignSuccess

  const { data: mintTx, isLoading: isMintTxLoading } = useWaitForTransaction({
    hash: mintSignResult?.hash,
    confirmations: 1,
  })

  // Initialization
  useEffect(() => {
    const tree = getTree(allowlistAddresses)
    console.log("allowed addresses", allowlistAddresses)
    setMerkleTree(tree)
  }, [])

  useEffect(() => {
    if (address && merkleTree) {
      setMerkleProof(undefined)
      const proof = getMerkleProof(merkleTree, address)
      if (proof.length > 0) {
        setMerkleProof(proof as `0x${string}`[])
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

  useEffect(() => {
    if (mintedTokens.length > 0) {
      setHasAllowListStarted(false)
    } else {
      setHasAllowListStarted(true)
    }
  }, [merkleProof])

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
                disabled={
                  !signer ||
                  !maxSupply ||
                  !totalSupply ||
                  !maxSupply.gt(totalSupply) ||
                  !((!hasPublicSaleStarted && merkleProof) || hasPublicSaleStarted)
                    ? true
                    : false
                }
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
      {/* ADD ! */}
      {hasPublicSaleStarted && (
        <Countdown
          targetDateA={awaitListDate}
          targetDateP={publicDate}
          playGeneralClick={listenPlayGeneralClick}
          hasPublicSaleStarted={hasPublicSaleStarted}
          hasAllowListStarted={!hasAllowListStarted}
        />
      )}
      <div className="flex justify-center  mt-[90px] z-1 pl-10 pr-10 z-10 relative ">
        <p className="font-medium text-gray-100 text-center text-xl w-[360px] min-w-[360px]">
          Fully on-chain, procedurally generated, animated kaleidoscopes.
        </p>
      </div>
      <Links
        etherscanBaseURL={etherscanBaseURL}
        deployAddress={deployments.contracts.Kaleidoscopes.address}
        playGeneralClick={listenPlayGeneralClick}
      />
      <FAQ
        etherscanBaseURL={etherscanBaseURL}
        deployAddress={deployments.contracts.Kaleidoscopes.address}
        playGeneralClick={listenPlayGeneralClick}
      />
      <Traits />
      <Footer playGeneralClick={listenPlayGeneralClick} />
    </div>
  )
}
