<template lang="pug">
.TabMoveRulesPopup.popup-container(@mousedown.stop.self="onCancel" @mouseup.stop)
  .popup(v-if="Popups.reactive.tabColorRulesPopup")
    h2(v-if="rules.length") {{translate('popup.tab_color_rules.title')}}
    .rules(v-if="rules.length")
      .rule(
        v-for="rule of rules"
        :key="rule.id"
        :data-edit="rule.id === editing"
        :data-active="rule.active"
        @click="editRule(rule)")
        .url-box(v-if="rule.url")
          .url {{rule.name || rule.url}}
          .controls-box(v-if="!editing")
            .btn-up(@click.stop="shortcutUp(rule)"): svg: use(xlink:href="#icon_expand")
            .btn-down(@click.stop="shortcutDown(rule)"): svg: use(xlink:href="#icon_expand")
            .btn-rm(@click.stop="removeRule(rule)"): svg: use(xlink:href="#icon_remove")
    .space
    h2 {{editing ? translate('popup.tab_color_rules.editor_title.edit') : translate('popup.tab_color_rules.editor_title.new')}}
    TextField.-no-separator.-compact(
      label="popup.tab_color_rules.rule_name_label"
      v-model:value="newRuleName"
      :or="'...'"
      :line="true")
    TextField.-compact(
      label="popup.tab_color_rules.rule_url_label"
      v-model:value="newRuleURL"
      :or="'Any URL'"
      :line="true")
    TextField.-compact(
      label="popup.tab_color_rules.rule_color_label"
      v-model:value="newColor"
      :or="'Hex'"
      :line="true")
    ToggleField.-compact(
      label="popup.tab_color_rules.rule_top_lvl_label"
      v-model:value="newRuleTopLvl")

    .ctrls(v-if="editing")
      .btn(:class="{ '-inactive': !addBtnActive }" @click="onSave").
        {{translate('popup.tab_color_rules.edit_rule_btn.save')}}
      .btn(@click="onEditCancel").
        {{translate('popup.tab_color_rules.edit_rule_btn.cancel')}}
    .ctrls(v-else)
      .btn.-wide(:class="{ '-inactive': !addBtnActive }" @click="onAdd").
        {{translate('popup.tab_color_rules.add_rule_btn')}}
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { translate } from 'src/dict'
import { TabColorRuleConfig } from 'src/types'
import * as Utils from 'src/utils'
import * as Popups from 'src/services/popups'
import TextField from './text-field.vue'
import ToggleField from './toggle-field.vue'
import { Settings } from 'src/services/settings'

interface ColorRulePreview {
  id: ID
  active: boolean
  name?: string
  url: string
  color: string
  urlIcon?: string
  topLvlOnly?: boolean
}

const rules = ref<ColorRulePreview[]>([])
const newRuleName = ref('')
const newRuleURL = ref('')
const newColor = ref('')
const newRuleTopLvl = ref(false)
const editing = ref<ID | null>(null)

const addBtnActive = computed<boolean>(() => {
  const urlIsValid = !!newRuleURL.value
  const colorIsValid = !!newColor.value
  return urlIsValid && colorIsValid
})

onMounted(() => {
  initPopupState()
})

function initPopupState() {
  if (!Popups.reactive.tabColorRulesPopup) return []

  const output: ColorRulePreview[] = []
  const ruleConfigs = Popups.reactive.tabColorRulesPopup

  if (ruleConfigs.global) {
    const colorRules = Settings.state.colorizeTabsRules
    if (colorRules) {
      for (const conf of colorRules) {
        output.push(createRulePreview(conf))
      }
    }
  }

  rules.value = output
}

function createRulePreview(ruleConfig: TabColorRuleConfig): ColorRulePreview {
  const rule: ColorRulePreview = {
    id: ruleConfig.id,
    active: ruleConfig.active,
    url: ruleConfig.url,
    color: ruleConfig.color
  }

  if (ruleConfig.url) {
    rule.url = ruleConfig.url
    rule.urlIcon = '#icon_ff'
  }

  rule.topLvlOnly = !!ruleConfig.topLvlOnly
  if (ruleConfig.name) rule.name = ruleConfig.name

  return rule
}

function onAdd(): void {
  if (!Popups.reactive.tabColorRulesPopup) return
  if (!addBtnActive.value) return
  if (!newRuleURL.value) return
  if (!newColor.value) return

  console.log("TODO: onAdd")

  const name = newRuleName.value.trim()

  let colorRules = Settings.state.colorizeTabsRules

  if (!colorRules) {
    colorRules = []
  }

  // Remove duplicate (disabled)

  // const newURL = newRuleURL.value ? newRuleURL.value : undefined
  // const sameRuleIndex = colorRules.findIndex(r => newURL == r.url)
  // if (sameRuleIndex !== -1) {
  //   colorRules.splice(sameRuleIndex, 1)
  // }

  // Add new rule

  const ruleConfig: TabColorRuleConfig = {
    id: Utils.uid(),
    active: true,
    url: newRuleURL.value,
    color: newColor.value,
  }

  if (name) ruleConfig.name = name

  colorRules.push(ruleConfig)
  rules.value.push(ruleConfig)

  Settings.saveDebounced(1000)

  // Reset inputs
  newRuleName.value = ''
  newRuleURL.value = ''
  newColor.value = ''
}

function onCancel(): void {
  if (!Popups.reactive.tabColorRulesPopup) return

  Popups.closeTabColorRulesPopup()
}

function shortcutUp(rule: ColorRulePreview): void {
  if (!Popups.reactive.tabColorRulesPopup) return
  console.log("TODO: shortcutUp", rule)

  let colorRules = Settings.state.colorizeTabsRules
  if (!colorRules) return

  const index = colorRules.findIndex(r => r.id === rule.id)
  if (index !== -1 && index > 0) {
    const ruleConfig = colorRules.splice(index, 1)[0]
    if (ruleConfig) colorRules.splice(index - 1, 0, ruleConfig)
  }

  Settings.saveDebounced(1000)

  const localIndex = rules.value.findIndex(r => r.id === rule.id)
  if (localIndex !== -1 && localIndex > 0) {
    rules.value.splice(localIndex, 1)
    rules.value.splice(localIndex - 1, 0, rule)
  }
}

function shortcutDown(rule: ColorRulePreview): void {
  if (!Popups.reactive.tabColorRulesPopup) return
  console.log("TODO: shortcutDown", rule)

  let colorRules = Settings.state.colorizeTabsRules
  if (!colorRules) return

  const index = colorRules.findIndex(r => r.id === rule.id)
  if (index !== -1 && index < colorRules.length - 1) {
    const ruleConfig = colorRules.splice(index, 1)[0]
    if (ruleConfig) colorRules.splice(index + 1, 0, ruleConfig)
  }

  Settings.saveDebounced(1000)

  const localIndex = rules.value.findIndex(r => r.id === rule.id)
  if (localIndex !== -1 && localIndex < colorRules.length - 1) {
    rules.value.splice(localIndex, 1)
    rules.value.splice(localIndex + 1, 0, rule)
  }
}

function removeRule(rule: ColorRulePreview): void {
  if (!Popups.reactive.tabColorRulesPopup) return
  console.log("TODO: removeRule", rule)

  let colorRules = Settings.state.colorizeTabsRules
  if (!colorRules) return

  // Remove rule from config
  const index = colorRules.findIndex(r => r.id === rule.id)
  if (index !== -1) colorRules.splice(index, 1)

  Settings.saveDebounced(1000)

  // Remove rule from local list
  const localIndex = rules.value.findIndex(r => r.id === rule.id)
  if (localIndex !== -1) rules.value.splice(localIndex, 1)

}

function editRule(rule: ColorRulePreview) {
  if (editing.value === rule.id) {
    return onEditCancel()
  }

  editing.value = rule.id

  newRuleURL.value = rule.url
  newColor.value = rule.color
  newRuleTopLvl.value = !!rule.topLvlOnly

  if (rule.name) newRuleName.value = rule.name
  else newRuleName.value = ''
}

function onEditCancel() {
  editing.value = null

  // Reset inputs
  newRuleName.value = ''
  newRuleURL.value = ''
  newColor.value = ''
  newRuleTopLvl.value = true
}

function onSave() {
  if (!editing.value) return

  if (!Popups.reactive.tabColorRulesPopup) return

  let colorRules = Settings.state.colorizeTabsRules
  if (!colorRules) return

  const rule = rules.value.find(r => r.id === editing.value)
  if (!rule) return

  const name = newRuleName.value.trim()

  // Remove possible duplicate (disabled)

  // const newURL = newRuleURL.value ? newRuleURL.value : undefined
  // const sameRuleIndex = colorRules.findIndex(r => {
  //   if (rule.id === r.id) return false
  //   return newURL === r.url
  // })
  // if (sameRuleIndex !== -1) {
  //   colorRules.splice(sameRuleIndex, 1)
  // }

  // Update rule in panel config
  const ruleConfig = colorRules.find(r => r.id === rule.id)
  if (ruleConfig) {
    ruleConfig.active = true
    ruleConfig.url = newRuleURL.value
    ruleConfig.color = newColor.value
    ruleConfig.topLvlOnly = newRuleTopLvl.value
    if (name) ruleConfig.name = name
    else delete ruleConfig.name
  }

  Settings.saveDebounced(1000)

  // Update rule in local list
  rule.active = true
  rule.name = name || undefined
  rule.url = newRuleURL.value
  rule.color = newColor.value
  rule.topLvlOnly = newRuleTopLvl.value

  // Reset inputs
  newRuleName.value = ''
  newRuleURL.value = ''
  newColor.value = ''
  newRuleTopLvl.value = true
  editing.value = null

}
</script>
