import { NOID } from 'src/defaults'
import * as Utils from 'src/utils'
import { Containers } from './containers'
import { Settings } from './settings'
import { Tabs } from './tabs.fg'
import { Tab, TabColorRuleConfig } from 'src/types'

const CONTAINER_COLORS: Record<string, string> = {
  blue: '#37adff',
  turquoise: '#00c79a',
  green: '#51cd00',
  yellow: '#ffcb00',
  orange: '#ff9f00',
  red: '#ff613d',
  pink: '#ff4bda',
  purple: '#af51f5',
}

export function colorizeTabs(): void {
  const colorRules = Settings.state.colorizeTabsRules
  for (const tab of Tabs.list) {
    colorizeTab(tab.id, colorRules)
  }
}

const colorizeTabTimeouts: Record<ID, number> = {}
export function colorizeTabDebounced(tabId: ID, delayMS = 500): void {
  clearTimeout(colorizeTabTimeouts[tabId])
  colorizeTabTimeouts[tabId] = setTimeout(() => {
    delete colorizeTabTimeouts[tabId]
    colorizeTab(tabId, Settings.state.colorizeTabsRules)
  }, delayMS)
}

function checkUrl(url: string, matchString: string): boolean {
  matchString = matchString.trim()

  if (matchString.startsWith('/') && matchString.endsWith('/')) {
    try {
      const re = new RegExp(matchString.slice(1, -1))
      return re.test(url)
    } catch {
      return false
    }
  } else {
    return url.includes(matchString)
  }
}

export function colorizeTab(tabId: ID, colorRules?: TabColorRuleConfig[]): void {
  const tab = Tabs.byId[tabId]
  if (!tab) return

  const colorFromRules = (tab: Tab): string | null => {
    if (!colorRules) return null
    for (const rule of colorRules) {
      console.debug("check", tab.url, rule.url)
      if (checkUrl(tab.url, rule.url)) {
        return rule.color
      }
    }
    return null
  }

  let srcStr, color
  if (Settings.state.colorizeTabsSrc === 'domain') {
    srcStr = Utils.getDomainOf(tab.url)
    color = Utils.colorFromString(srcStr, 60)
  } else if (Settings.state.colorizeTabsSrc === 'color-rules') {
    color = colorFromRules(tab)
  } else {
    const container = Containers.reactive.byId[tab.cookieStoreId]
    if (container) {
      color = CONTAINER_COLORS[container.color]
    } else {
      color = null
    }
  }

  tab.reactive.color = color
}

export function colorizeBranches(): void {
  for (const tab of Tabs.list) {
    if (tab.isParent && tab.lvl === 0) colorizeBranch(tab.id)
  }
}

export function colorizeBranch(rootId: ID): void {
  const rootTab = Tabs.byId[rootId]
  if (!rootTab || rootTab.lvl > 0) return

  let srcStr
  if (Settings.state.colorizeTabsBranchesSrc === 'url') {
    srcStr = rootTab.url
  } else {
    srcStr = Utils.getDomainOf(rootTab.url)
  }

  const color = Utils.colorFromString(srcStr, 60)
  rootTab.reactive.branchColor = color

  for (let i = rootTab.index + 1; i < Tabs.list.length; i++) {
    const tab = Tabs.list[i]
    if (tab.lvl === 0) break

    tab.reactive.branchColor = color
  }
}

export function setBranchColor(tabId: ID): void {
  const tab = Tabs.byId[tabId]
  if (!tab) return
  if (tab.parentId === NOID) {
    if (tab.isParent) Tabs.colorizeBranch(tab.id)
    else {
      if (tab.reactive.branchColor) tab.reactive.branchColor = null
    }
    return
  }

  let parent = Tabs.byId[tab.parentId]
  while (parent && parent.lvl > 0) {
    parent = Tabs.byId[parent.parentId]
  }
  if (!parent) return

  if (parent.reactive.branchColor) {
    tab.reactive.branchColor = parent.reactive.branchColor
  } else {
    Tabs.colorizeBranch(parent.id)
  }
}

export function setCustomColor(tabIds: ID[], color: string): void {
  Tabs.sortTabIds(tabIds)

  for (const id of tabIds) {
    const tab = Tabs.byId[id]
    if (!tab) continue

    tab.customColor = color !== 'toolbar' ? color : undefined
    tab.reactive.customColor = tab.customColor ?? null

    Tabs.saveTabData(tab.id)
  }

  Tabs.cacheTabsData()
}
