'use client'

import { ReactFlowProvider } from 'reactflow'
import 'reactflow/dist/style.css'
import { AutomationBuilder } from '@/components/automation/AutomationBuilder'

export default function NewAutomationPage() {
  return (
    <ReactFlowProvider>
      <AutomationBuilder overrideId="new" />
    </ReactFlowProvider>
  )
}
