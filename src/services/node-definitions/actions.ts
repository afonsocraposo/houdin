import type { NodeDefinitionRecord } from './types';
import ai from "../actions/ai.definition";
import click_element from "../actions/click-element.definition";
import cookies from "../actions/cookies.definition";
import copy_content from "../actions/copy-content.definition";
import create_variable from "../actions/create-variable.definition";
import custom_script from "../actions/custom-script.definition";
import fill_form from "../actions/fill-form.definition";
import form from "../actions/form.definition";
import get_element_content from "../actions/get-element-content.definition";
import http_request from "../actions/http-request.action.definition";
import ifNode from "../actions/if.definition";
import inject_component from "../actions/inject-component.definition";
import inject_style from "../actions/inject-style.definition";
import input from "../actions/input.definition";
import llm_openai from "../actions/llm-openai.definition";
import local_storage from "../actions/local-storage.definition";
import navigate_url from "../actions/navigate-url.definition";
import open_url from "../actions/open-url.definition";
import paste_clipboard from "../actions/paste-clipboard.definition";
import press_key from "../actions/press-key.definition";
import remove_element from "../actions/remove-element.definition";
import replace_element_content from "../actions/replace-element-content.definition";
import replace_text from "../actions/replace-text.definition";
import session_storage from "../actions/session-storage.definition";
import select_element from "../actions/select-element.definition";
import show_modal from "../actions/show-modal.definition";
import show_notification from "../actions/show-notification.definition";
import type_text from "../actions/type-text.definition";
import wait from "../actions/wait.definition";
import write_clipboard from "../actions/write-clipboard.definition";

export const actions: NodeDefinitionRecord = {
  "ai": ai,
  "click-element": click_element,
  "cookies": cookies,
  "copy-content": copy_content,
  "create-variable": create_variable,
  "custom-script": custom_script,
  "fill-form": fill_form,
  "form": form,
  "get-element-content": get_element_content,
  "http-request": http_request,
  "if": ifNode,
  "inject-component": inject_component,
  "inject-style": inject_style,
  "input": input,
  "llm-openai": llm_openai,
  "local-storage": local_storage,
  "navigate-url": navigate_url,
  "open-url": open_url,
  "paste-clipboard": paste_clipboard,
  "press-key": press_key,
  "remove-element": remove_element,
  "replace-element-content": replace_element_content,
  "replace-text": replace_text,
  "session-storage": session_storage,
  "select-element": select_element,
  "show-modal": show_modal,
  "show-notification": show_notification,
  "type-text": type_text,
  "wait": wait,
  "write-clipboard": write_clipboard,
};
