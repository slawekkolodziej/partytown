import { definePrototypePropertyDescriptor } from '../utils';
import { getEnv } from './worker-environment';
import { getInstanceStateValue, setInstanceStateValue } from './worker-state';
import { getter, setter } from './worker-proxy';
import { HTMLSrcElementDescriptorMap } from './worker-src-element';
import { resolveUrl } from './worker-exec';
import { StateProp, WorkerNode } from '../types';

export const patchHTMLScriptElement = (WorkerHTMLScriptElement: any) => {
  const HTMLScriptDescriptorMap: PropertyDescriptorMap & ThisType<WorkerNode> = {
    innerHTML: innerHTMLDescriptor,
    innerText: innerHTMLDescriptor,

    src: {
      get() {
        return getInstanceStateValue<string>(this, StateProp.url) || '';
      },
      set(url: string) {
        const env = getEnv(this);
        const orgUrl = resolveUrl(env, url, true);
        url = resolveUrl(env, url);
        setInstanceStateValue(this, StateProp.url, url);
        setter(this, ['src'], url);
        if (orgUrl !== url) {
          setter(this, ['dataset', 'ptsrc'], orgUrl);
        }
      },
    },

    textContent: innerHTMLDescriptor,

    type: {
      get() {
        return getter(this, ['type']);
      },
      set(type: string) {
        if (!isScriptJsType(type)) {
          setInstanceStateValue(this, StateProp.type, type);
          setter(this, ['type'], type);
        }
      },
    },

    ...HTMLSrcElementDescriptorMap,
  };

  definePrototypePropertyDescriptor(WorkerHTMLScriptElement, HTMLScriptDescriptorMap);
};

const innerHTMLDescriptor: PropertyDescriptor & ThisType<WorkerNode> = {
  get() {
    return getInstanceStateValue<string>(this, StateProp.innerHTML) || '';
  },
  set(scriptContent: string) {
    setInstanceStateValue(this, StateProp.innerHTML, scriptContent);
  },
};

export const isScriptJsType = (scriptType: string) =>
  !scriptType || scriptType === 'text/javascript';
