import type { NodeDefinitionRecord } from './types';
import button_click from "../triggers/button-click.definition";
import component_load from "../triggers/component-load.definition";
import delay from "../triggers/delay.definition";
import http_request from "../triggers/http-request-trigger.definition";
import key_press from "../triggers/key-press.definition";
import page_load from "../triggers/page-load.definition";
import popup from "../triggers/popup.definition";

export const triggers: NodeDefinitionRecord = {
  "button-click": button_click,
  "component-load": component_load,
  "delay": delay,
  "http-request": http_request,
  "key-press": key_press,
  "page-load": page_load,
  "popup": popup,
};
