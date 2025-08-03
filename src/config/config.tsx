import React from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import ConfigApp from './ConfigApp'

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <MantineProvider>
        <ConfigApp />
      </MantineProvider>
    </React.StrictMode>
  )
}