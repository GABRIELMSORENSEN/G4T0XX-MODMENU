if (document.location.href.startsWith('https://api.recurly.com/')) {
    window.opener = window.opener || {
        postMessage: (message, targetOrigin, transfer) => require('electron')
            .ipcRenderer.send('EVENT_RECURLY_MESSAGE', { message, targetOrigin, transfer }),
    };
}
