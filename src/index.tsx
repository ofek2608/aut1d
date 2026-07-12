/* @refresh reload */
import { render } from 'solid-js/web'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './index.css'
import App from './App.tsx'
import { startUrlRuleSync } from './urlRule.ts'

startUrlRuleSync()

const root = document.getElementById('root')

render(() => <App />, root!)
