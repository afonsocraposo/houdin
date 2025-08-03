import React from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { HashRouter, Routes, Route } from 'react-router-dom'
import '@mantine/core/styles.css'
import ConfigApp from './ConfigApp'

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <MantineProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<ConfigApp />} />
            <Route path="/designer" element={<ConfigApp />} />
            <Route path="/designer/:workflowId" element={<ConfigApp />} />
          </Routes>
        </HashRouter>
      </MantineProvider>
    </React.StrictMode>
  )
}