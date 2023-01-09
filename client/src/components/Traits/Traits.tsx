import maxSaturation from "../.././img/maxSaturation.svg"
import noReflections from "../.././img/noReflections.svg"
import inputShapes from "../.././img/inputShapes.svg"

export function Traits() {
  return (
    <div className="flex justify-center  mt-10 z-1 pl-5 pr-5 relative">
      <div className="block  bg-zinc-900 border border-zinc-800 rounded-lg w-[800px]">
        <div className="p-5">
          <p className="font- text-xl pb-4 text-gray-100">Traits</p>
          <div className="grid  gap-4 grid-cols-1 sm:grid-cols-3  ">
            <div>
              <div className=" bg-zinc-800 px-3 py-4 rounded-lg w-100 text-sm text-gray-100 flex  items-center ">
                <img src={noReflections} alt="Number Of Reflections" className="h-5 mr-3"></img>
                <span>Number Of Reflections</span>
              </div>
            </div>
            <div>
              <div className=" bg-zinc-800 px-3 py-4 rounded-lg w-100 text-sm text-gray-100 flex  items-center min-h-20">
                <img src={maxSaturation} alt="Max Saturation" className="h-5 mr-3"></img>
                <span>Colour/Gradients</span>
              </div>
            </div>
            <div>
              <div className=" bg-zinc-800 px-3 py-4 rounded-lg w-100 text-sm text-gray-100 flex  items-center">
                <img src={inputShapes} alt="Number Of Reflections" className="h-5 mr-3"></img>
                <span>Input Shape Complexity</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
