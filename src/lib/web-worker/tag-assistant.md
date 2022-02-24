# Debugging tag assistant

I spent some time trying to reverse-engineer GTM debugging. The main problem with running it through partytown is lack of shared context between main thread and worker.

There are a few things involved:
- gtm.js - main script that includes all tags
- bootstrap script - it seems to be connecting gtm.js, badge and Tag Assistance Companion together
- badge - small web app responsible for showing the small window in the bottom-right (the one with connection status)
- Tag Assistant Companion (TAC) - a browser extension, when included it adds `__TAG_ASSISTANT_API` to `window`.

Initial load works somewhat like this:
1. gtm.js detects that it has `?gtm_debug` in query string, so it includes https://www.googletagmanager.com/debug/bootstrap
1. TAC adds __TAG_ASSISTANT_API to top window object.
2. bootstrap tries to call __TAG_ASSISTANT_API.setReceiver
3. TAC exchanges messages with bootstrap script. At some point it tells it to download a different version of gtm.js



# Installation

1. Add `__tag_assistant_forwarder` to list of forwared properties, like:
  ```jsx
  <Partytown
    forward={[
      'dataLayer.push',
      '__tag_assistant_forwarder',
  ```

2. Add script below when running gtm in debug/preview mode. It has to be run with `type="text/javascript"`!

```js
const debug = true;
const gtmDebugLog = (msg, data) => {
  if (debug) {
    console.debug(
      `%cGTM Main%c${msg}`,
      `background: #c47ed1; color: white; padding: 2px 3px; border-radius: 2px; font-size: 0.8em;margin-right:5px`,
      `background: #999999; color: white; padding: 2px 3px; border-radius: 2px; font-size: 0.8em;`,
      data && data.length ? Array.from(data) : data
    )
  }
}

__partytown_gtm_debug = {
  // Used to populate dataLayer back into main thread
  dataLayerPush: function() {
    [].push.apply(dataLayer, arguments)
  },
  // Called when receiver has been set inside partytown, calls __TAG_ASSISTANT_API.setReceiver
  activate: function () {
    gtmDebugLog('activate')
    window.__TAG_ASSISTANT_API.setReceiver(function() {
      gtmDebugLog('send data', arguments)
      window.__tag_assistant_forwarder.apply(null, arguments);
    })
  },
  // Forwards calls from bootstrap
  sendMessage: function() {
    gtmDebugLog('send message', arguments)
    window.__TAG_ASSISTANT_API.sendMessage.apply(window.__TAG_ASSISTANT_API, arguments)
  },
  // Forwards calls from bootstrap
  disconnect: function() {
    gtmDebugLog('disconnect', arguments)
    window.__TAG_ASSISTANT_API.disconnect.apply(window.__TAG_ASSISTANT_API, arguments)
  },
}
```