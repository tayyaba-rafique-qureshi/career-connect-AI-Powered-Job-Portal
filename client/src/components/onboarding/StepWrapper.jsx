export default function StepWrapper({ step, totalSteps, title, subtitle, onBack, onContinue, continueLabel = 'Continue', continueDisabled = false, children }) {
  const progress = (step / totalSteps) * 100

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top progress bar */}
      <div className="h-1 bg-gray-200 w-full fixed top-0 left-0 z-50">
        <div
          className="h-1 bg-indeed-blue transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="pt-8 px-6 md:px-16 pb-4 border-b border-gray-100">
        <span className="text-sm text-gray-400 font-medium">Step {step} of {totalSteps}</span>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-1 text-sm md:text-base">{subtitle}</p>}
      </div>

      {/* Content */}
      <div className="flex-1 px-6 md:px-16 py-8 max-w-2xl w-full mx-auto animate-fade-in">
        {children}
      </div>

      {/* Footer nav */}
      <div className="px-6 md:px-16 py-6 border-t border-gray-100 flex items-center justify-between max-w-2xl w-full mx-auto">
        {step > 1
          ? <button onClick={onBack} className="text-indeed-blue font-medium hover:underline text-sm">← Back</button>
          : <div />
        }
        <button
          onClick={onContinue}
          disabled={continueDisabled}
          className="bg-indeed-blue hover:bg-indeed-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded text-sm transition-colors"
        >
          {continueLabel}
        </button>
      </div>
    </div>
  )
}
