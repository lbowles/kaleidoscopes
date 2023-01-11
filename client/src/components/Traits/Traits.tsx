import maxSaturation from "../.././img/maxSaturation.png"
import noReflections from "../.././img/noReflections.svg"
import inputShapes from "../.././img/inputShapes.svg"
import halo from "../.././img/halo.svg"
import animation from "../.././img/animation.svg"
import andMore from "../.././img/andMore.svg"

export function Traits() {
  return (
    <div className="block  bg-zinc-900 border border-zinc-800 rounded-lg w-full">
      <div className="p-5">
        <p className="font- text-xl pb-4 text-gray-100">Traits</p>
        <div className="grid  gap-4 grid-cols-1 sm:grid-cols-1  ">
          <div>
            <div className=" bg-zinc-800 px-3 py-4 rounded-lg w-100 text-sm text-gray-100 flex  items-center ">
              <img src={noReflections} alt="Number Of Reflections" className="h-5 mr-3"></img>
              <span>Number of reflections</span>
            </div>
          </div>
          <div>
            <div className=" bg-zinc-800 px-3 py-4 rounded-lg w-100 text-sm text-gray-100 flex  items-center min-h-20">
              <img src={maxSaturation} alt="Max Saturation" className="h-5 mr-3"></img>
              <span>Color palette</span>
            </div>
          </div>
          <div>
            <div className=" bg-zinc-800 px-3 py-4 rounded-lg w-100 text-sm text-gray-100 flex  items-center">
              <img src={inputShapes} alt="Number Of Reflections" className="h-5 mr-3"></img>
              <span>Number of shapes</span>
            </div>
          </div>
          <div>
            <div className=" bg-zinc-800 px-3 py-4 rounded-lg w-100 text-sm text-gray-100 flex  items-center">
              <img src={halo} alt="Number Of Reflections" className="h-5 mr-3"></img>
              <span>Halo effect for first 50 tokens</span>
            </div>
          </div>
          <div>
            <div className=" bg-zinc-800 px-3 py-4 rounded-lg w-100 text-sm text-gray-100 flex  items-center">
              <img src={animation} alt="Number Of Reflections" className="h-4 mr-2"></img>
              <span>Unique animations</span>
            </div>
          </div>
          <div>
            <div className=" bg-zinc-800 px-3 py-4 rounded-lg w-100 text-sm text-gray-100 flex  items-center">
              <img src={andMore} alt="Number Of Reflections" className="w-[20px] mr-2"></img>
              <span>and more...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
