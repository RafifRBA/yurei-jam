'use client'
import { Component, type ReactNode } from 'react'
import { FallbackNotice } from './FallbackNotice'

interface State {
  failed: boolean
}

/** Catches runtime errors from the 3D scene so the rest of the page keeps working. */
export class SceneBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  render() {
    if (this.state.failed) return <FallbackNotice reason="error" />
    return this.props.children
  }
}
