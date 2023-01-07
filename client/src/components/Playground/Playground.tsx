import { getSVG } from "./GenerateSVG"
import { useState } from "react"

export function Playground() {
  const [svg, setSVG] = useState<string>("")

  function generateSVG() {
    console.log(getSVG(500))
    setSVG(getSVG(500))
  }

  return (
    <>
      <div className="block  bg-zinc-900 border border-zinc-800 rounded-lg w-[800px]">
        <div className="p-5">
          <p className="font- text-xl pb-4 text-gray-100">Playground</p>
          <div className="grid  gap-4 grid-cols-1 sm:grid-cols-3  ">
            <div>
              <img src={`data:image/svg+xml;base64,${btoa(svg)}`} alt="" className="rounded-lg" />
              {/* {svg} */}
            </div>
            <div>
              <button onClick={() => generateSVG()}>Generate</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
