'use client'
import { useId } from 'react'
import { useRunStore } from '@/store/run.store'
import { Icon } from './Icon'

/** FR-CTL-3: what you are looking at, in three sentences, dismissible. */
export function Onboarding({ className = '' }: { className?: string }) {
  const titleId = useId()
  const dismissed = useRunStore((s) => s.onboardingDismissed)
  const dismiss = useRunStore((s) => s.dismissOnboarding)
  if (dismissed) return null
  return (
    <section
      aria-labelledby={titleId}
      className={`sign-panel p-3.5 text-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 id={titleId} className="text-base font-semibold">
          What am I looking at?
        </h2>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss this explanation"
          className="-m-2 flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md hover:bg-sign-deep"
        >
          <Icon name="close" size={18} />
        </button>
      </div>
      <p className="mt-1 leading-snug">
        Each block is a car on a ring road, coloured by speed: red is stopped,
        green is full speed. Every driver acts alone, and now and then one
        brakes suddenly, shown by a white ring. Press Add car: with enough cars,
        one small brake grows into a jam that travels backward.
      </p>
    </section>
  )
}
