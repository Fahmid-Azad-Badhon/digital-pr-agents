'use client'

/**
 * HandoverPanel Component
 * Displays stage-to-stage handoff information
 */

import { useState } from 'react'
import { 
  ArrowRightLeft, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export interface HandoffItem {
  sourceStage: string
  destinationStage: string
  requiredData: string[]
  validation: 'passed' | 'failed' | 'pending'
  validationMessage?: string
  canProceed: boolean
}

interface HandoverPanelProps {
  handoffs: HandoffItem[]
  currentStage?: string
  onValidate?: (handoffIndex: number) => void
  onProceed?: (handoffIndex: number) => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function HandoverPanel({
  handoffs,
  currentStage,
  onValidate,
  onProceed
}: HandoverPanelProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const getValidationConfig = (validation: string) => {
    switch (validation) {
      case 'passed':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
          label: 'Passed'
        }
      case 'failed':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          icon: <AlertCircle className="w-4 h-4 text-red-400" />,
          label: 'Failed'
        }
      default:
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          icon: <Clock className="w-4 h-4 text-amber-400" />,
          label: 'Pending'
        }
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-4">
      {handoffs.map((handoff, index) => {
        const isExpanded = expandedIndex === index
        const isCurrent = handoff.sourceStage === currentStage
        const validation = getValidationConfig(handoff.validation)

        return (
          <div 
            key={index}
            className={`
              rounded-xl border overflow-hidden transition-all
              ${isCurrent ? 'border-cyan-500/50' : 'border-slate-700'}
              ${isExpanded ? 'bg-slate-800/50' : 'bg-slate-800/30'}
            `}
          >
            {/* Header */}
            <button
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Stage Icons */}
                <div className="flex items-center gap-2">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium
                    ${isCurrent ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'}
                  `}>
                    {index + 1}
                  </div>
                  <ArrowRightLeft className="w-4 h-4 text-slate-500" />
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-400">
                    {index + 2}
                  </div>
                </div>

                {/* Stage Names */}
                <div className="text-left">
                  <p className="font-medium text-slate-200">
                    {handoff.sourceStage} → {handoff.destinationStage}
                  </p>
                  <p className="text-xs text-slate-500">
                    {handoff.requiredData.length} data packages required
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Validation Status */}
                <div className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs
                  ${validation.bg} ${validation.border}
                `}>
                  {validation.icon}
                  <span className={validation.label === 'Passed' ? 'text-emerald-400' : validation.label === 'Failed' ? 'text-red-400' : 'text-amber-400'}>
                    {validation.label}
                  </span>
                </div>

                {/* Expand Icon */}
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-slate-700/50">
                {/* Required Data */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Required Data Packages</h4>
                  <div className="space-y-2">
                    {handoff.requiredData.map((data, i) => (
                      <div 
                        key={i}
                        className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-300">{data}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(data)}
                          className="p-1 hover:bg-slate-600 rounded"
                        >
                          <Copy className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Validation Message */}
                {handoff.validationMessage && (
                  <div className={`mt-4 p-3 rounded-lg ${validation.bg}`}>
                    <p className="text-sm text-slate-300">{handoff.validationMessage}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  {handoff.validation === 'pending' && onValidate && (
                    <button
                      onClick={() => onValidate(index)}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium"
                    >
                      Validate
                    </button>
                  )}
                  
                  {handoff.canProceed && onProceed && (
                    <button
                      onClick={() => onProceed(index)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      Proceed
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}

                  {!handoff.canProceed && handoff.validation === 'failed' && (
                    <button
                      className="px-4 py-2 bg-slate-700 text-slate-400 rounded-lg text-sm font-medium cursor-not-allowed"
                      disabled
                    >
                      Fix Issues First
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}