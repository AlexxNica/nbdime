// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import * as alertify from 'alertify.js';

import {
  NotifyUserError
} from 'nbdime/lib/common/exceptions';

/**
 * Global config data for the Nbdime application.
 */
let configData: any = null;

/**
 * Global  config data for jupyter.
 */
let jupyterConfigData: any = null;

// Ensure error messages stay open until dismissed.
alertify.delay(0).closeLogOnClick(true);

/**
 *  Make an object fully immutable by freezing each object in it.
 */
function deepFreeze(obj: any): any {

  // Freeze properties before freezing self
  Object.getOwnPropertyNames(obj).forEach(function(name) {
    let prop = obj[name];

    // Freeze prop if it is an object
    if (typeof prop === 'object' && prop !== null && !Object.isFrozen(prop)) {
      deepFreeze(prop);
    }
  });

  // Freeze self
  return Object.freeze(obj);
}

/**
 * Retrive a config option
 */
export
function getConfigOption(name: string, defaultValue?: any): any {
  if (configData) {
    let ret = configData[name];
    if (ret === undefined) {
      return defaultValue;
    }
    return ret;
  }
  if (typeof document !== 'undefined') {
    let el = document.getElementById('nbdime-config-data');
    if (el && el.textContent) {
      configData = JSON.parse(el.textContent);
    } else {
      configData = {};
    }
  }
  configData = deepFreeze(configData);
  let ret = configData[name];
  if (ret === undefined) {
    return defaultValue;
  }
  return ret;
}

/**
 * Get the base url.
 */
export
function getBaseUrl(): string {
  if (jupyterConfigData) {
    return jupyterConfigData['baseUrl'];
  }
  if (typeof document !== 'undefined') {
    let el = document.getElementById('jupyter-config-data');
    if (el && el.textContent) {
      jupyterConfigData = JSON.parse(el.textContent);
    } else {
      jupyterConfigData = {};
    }
  }
  jupyterConfigData = deepFreeze(jupyterConfigData);
  return jupyterConfigData['baseUrl'];
}

const spinner = document.createElement('div');
spinner.className = 'nbdime-spinner';
/**
 * Turn spinner (loading indicator) on/off
 */
export
function toggleSpinner(state?: boolean) {
  let header = document.getElementById('nbdime-header-buttonrow')!;
  // Figure out current state
  let current = header.contains(spinner);
  if (state === undefined) {
    state = !current;
  } else if (state === current) {
    return;  // Nothing to do
  }
  if (state) {
    header.appendChild(spinner);
  } else {
    header.removeChild(spinner);
  }
}


export let toolClosed = false;
/**
 * POSTs to the server that it should shut down if it was launched as a
 * difftool/mergetool.
 *
 * Used to indicate that the tool has finished its operation, and that the tool
 * should return to its caller.
 */
export
function closeTool(exitCode=0) {
  if (!toolClosed) {
    toolClosed = true;
    let xhttp = new XMLHttpRequest();
    let url = '/api/closetool';
    xhttp.open('POST', url, false);
    xhttp.setRequestHeader('exit_code', exitCode.toString());
    xhttp.send();
    window.close();
  }
}


function showError(error: NotifyUserError, url: string, line: number, column: number) {
  let message = error.message.replace('\n', '</br>');
  switch (error.severity) {
  case 'warning':
    alertify.log(message);
    break;
  case 'error':
    alertify.error(message);
    break;
  default:
    alertify.error(message);
  }
}

export
function handleError(msg: string, url: string, line: number, col?: number, error?: Error): boolean {
  try {
    if (error instanceof NotifyUserError) {
      showError(error, url, line, col || 0);
      return false;  // Suppress error alert
    }
  } catch (e) {
    // Not something that user should care about
    console.log(e.stack);
  }
  return false;  // Do not suppress default error alert
}
