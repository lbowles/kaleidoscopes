import { BigNumber } from "ethers"

type IFAQ = {
  etherscanBaseURL: string
  deployAddress: string
  playGeneralClick: () => void
  allowlistMintBlock: BigNumber | undefined
}

export function FAQ({ etherscanBaseURL, deployAddress, playGeneralClick, allowlistMintBlock }: IFAQ) {
  return (
    <div className="flex justify-center  mt-10 z-1 pl-5 pr-5 relative">
      <div className="block  bg-zinc-900 border border-zinc-800 rounded-lg w-[800px]">
        <div className="p-5">
          <p className="font-medium text-xl pb-4 text-gray-100">FAQ</p>
          <div className=" ">
            <div className="block bg-zinc-800 px-3 py-2 rounded-lg w-100 text-sm text-gray-100 ">
              <span>What is Kaleidoscopes?</span>
            </div>
            <p className="text-sm text-zinc-500 px-3 pt-3 pb-5">
              Kaleidoscopes is the second instalment of fully on-chain collectibles by the team that brought you{" "}
              <a href="https://onchainsolar.systems" target="_blank" rel="noopener noreferrer" className="underline">
                Solar Systems
              </a>
              . This new collection features fully on-chain, procedurally generated, animated kaleidoscopes. They are
              available for a minting price of 0.01 ETH with a maximum supply of 1,000 on the Ethereum blockchain.
              Wallets can mint up to 20 each.
            </p>
          </div>

          <div className="block bg-zinc-800 px-3 py-2 rounded-lg w-100 text-sm text-gray-100 ">
            <span>Features</span>
          </div>
          <div className="grid grid-cols- md:grid-cols-2 pb-5">
            <div className="text-sm text-zinc-500 px-3 pt-3 col-span-1">
              Each Kaleidescope is
              <ul className="space-y-2 mt-2  list-disc list-inside ml-3">
                <li>
                  <a
                    target="_blank"
                    href={`${etherscanBaseURL}/address/${deployAddress}`}
                    onClick={() => {
                      playGeneralClick()
                    }}
                  >
                    <span className=" font-bold underline">Fully on-chain</span>
                  </a>
                  . This means that your NFT will exist for as long as the Ethereum blockchain is around.
                </li>
                <li>
                  <span className="font-bold">Animated.</span> Each Kaleidescope has a base pattern containing
                  procedurally generated moving shapes repeated in a circle up to 20 times to produce a mezmerising
                  animation with traits unique to that specific token.
                </li>
              </ul>
            </div>
            <div className="text-sm text-zinc-500 px-3 pt-3 ">
              <ul className="space-y-2  md:mt-7  list-disc list-inside ml-3">
                <li>
                  <span className=" font-bold">Procedurally generated.</span> Traits for each Kaleidescope are generated
                  using a set of procedures to produce stunning visuals, rather than being created manually or
                  pre-designed. This makes each Kaleidescope fully unique.
                </li>
              </ul>
            </div>
          </div>

          <div className=" ">
            <div className="block bg-zinc-800 px-3 py-2 rounded-lg w-100 text-sm text-gray-100 ">
              <span>What is the mint schedule?</span>
            </div>
            <p className="text-sm text-zinc-500 px-3 pt-3 pb-5" id="allowlist-anchor">
              Allowlisted addresses can mint from{" "}
              <a
                href="https://etherscan.io/block/countdown/16399100"
                target="_blank"
                className="underline"
                rel="noopener noreferrer"
                onClick={() => {
                  playGeneralClick()
                }}
              >
                block {allowlistMintBlock?.toString()}
              </a>{" "}
              (approximately 4pm UTC on Friday, 13 January 2023). The allowlist mint will last{" "}
              <a
                href="https://etherscan.io/block/countdown/16399400"
                target="_blank"
                className="underline"
                rel="noopener noreferrer"
                onClick={() => {
                  playGeneralClick()
                }}
              >
                300 blocks
              </a>{" "}
              (approximately 1 hour) after which the public mint will be open and anyone can mint.
            </p>
          </div>

          <div className=" ">
            <div className="block bg-zinc-800 px-3 py-2 rounded-lg w-100 text-sm text-gray-100 ">
              <span>Who is on the allowlist?</span>
            </div>
            <p className="text-sm text-zinc-500 px-3 pt-3 pb-5" id="allowlist-anchor">
              The allowlist consists of holders of Solar Systems collection as of 1:50pm UTC on Tuesday, 10 January
              2023. The list of eligible addresses can be found{" "}
              <a
                href="https://raw.githubusercontent.com/lbowles/kaleidoscopes/main/backend/common/snapshot.csv"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                onClick={() => {
                  playGeneralClick()
                }}
              >
                here
              </a>
              .
            </p>
          </div>

          <div className=" ">
            <div className="block bg-zinc-800 px-3 py-2 rounded-lg w-100 text-sm text-gray-100 ">
              <span>Roadmap?</span>
            </div>
            <p className="text-sm text-zinc-500 px-3 pt-3 pb-5">There is no roadmap.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
