type IFooter = {
  playGeneralClick: () => void
}

export function Footer({ playGeneralClick }: IFooter) {
  return (
    <div className="flex justify-center  mt-24 z-1 pl-10 pr-10 z-10 relative">
      <footer className="sticky w-full py-4  bottom-0 text-center text-gray-700 text-sm">
        Made by{" "}
        <a
          href="https://twitter.com/npm_luko"
          className="font-bold text-gray-500"
          target="_blank"
          onClick={() => {
            playGeneralClick()
          }}
        >
          @npm_luko
        </a>{" "}
        and{" "}
        <a
          href="https://twitter.com/stephancill"
          className="font-bold text-gray-500"
          target="_blank"
          onClick={() => {
            playGeneralClick()
          }}
        >
          @stephancill
        </a>
      </footer>
    </div>
  )
}
