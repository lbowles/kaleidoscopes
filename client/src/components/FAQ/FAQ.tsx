type IFAQ = {
  etherscanBaseURL: string
  deployAddress: string
  playGeneralClick: () => void
}

export function FAQ({ etherscanBaseURL, deployAddress, playGeneralClick }: IFAQ) {
  return (
    <div className="flex justify-center  mt-10 z-1 pl-5 pr-5 relative">
      <div className="block  bg-zinc-900 border border-zinc-800 rounded-lg w-[800px]">
        <div className="p-5">
          <p className="font-medium text-xl pb-4 text-gray-100">FAQ</p>
          <div className=" ">
            <div className="block bg-zinc-800 px-3 py-2 rounded-lg w-100 text-sm text-gray-100 ">
              <span>What are Solar Kaleidoscopes?</span>
            </div>
            <p className="text-sm text-zinc-500 px-3 pt-3 pb-5" id="allowlist-anchor">
              Solar Systems is a fully on-chain NFT collection which features procedurally generated planets orbiting
              around a star. Each Solar System is unique and can be minted for the price of 0.01 ETH. The collection is
              limited to 1,000 Solar Systems.
            </p>
          </div>

          <div className="block bg-zinc-800 px-3 py-2 rounded-lg w-100 text-sm text-gray-100 ">
            <span>Features</span>
          </div>
          <div className="grid grid-cols- md:grid-cols-2">
            <div className="text-sm text-zinc-500 px-3 pt-3 col-span-1">
              Each Solar System is
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
                  <span className="font-bold">Animated.</span> Planets orbit around a star which adds to a dynamic and
                  lively viewing experience.
                </li>
              </ul>
            </div>
            <div className="text-sm text-zinc-500 px-3 pt-3 ">
              <ul className="space-y-2  md:mt-7  list-disc list-inside ml-3">
                <li>
                  <span className=" font-bold">Procedurally generated.</span> This means that the solar systems are
                  generated using a set of rules or procedures, rather than being created manually or pre-designed. This
                  makes each solar system fully unique.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
