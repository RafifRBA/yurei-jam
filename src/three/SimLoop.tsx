'use client'
import { useSimLoop } from './useSimLoop'

/** Renders nothing; exists so the hook can run inside the Canvas. */
export function SimLoop() {
  useSimLoop()
  return null
}
