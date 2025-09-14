import { useState } from "react"

export default function BestPracticesPopup() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        className="text-xs px-3 py-1 border border-white text-white bg-black/60 hover:bg-black transition rounded"
        onClick={() => setOpen(true)}
      >
        Best Practices
      </button>

      {open && (
        <div className="absolute bottom-10 left-0 w-[320px] max-w-[90vw] bg-[#111] text-white border border-[#333] rounded-xl p-4 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold">Best Results Guide</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white text-sm"
            >
              Close
            </button>
          </div>
          <div className="text-xs space-y-3">
            <div>
              <p className="font-semibold">1. Use a clear, high-quality photo</p>
              <p>Face should be visible and in focus. Avoid filters, shadows, or blur.</p>
            </div>

            <div>
              <p className="font-semibold">2. Center yourself</p>
              <p>Keep head and shoulders visible. Plain backgrounds work best.</p>
            </div>

            <div>
              <p className="font-semibold">3. Keep a relaxed expression</p>
              <p>Neutral faces work better. Reaction modes will enhance automatically.</p>
            </div>

            <div>
              <p className="font-semibold">About Neo Tokyo Glitch</p>
              <p>This mode does not preserve identity. It may change appearance or style completely. Built for surreal expression.</p>
            </div>

            <div>
              <p className="font-semibold">More tips</p>
              <p>• Magic Wand enhances prompts
                <br />• Unreal Reflection is best for alternate-reality realism</p>
            </div>

            <p className="text-gray-400 italic">Every mode is different. Experiment, enjoy the process, and make it yours.</p>
          </div>
        </div>
      )}
    </div>
  )
}
