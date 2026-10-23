const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('g4',Object.freeze({run:(action,id)=>ipcRenderer.invoke('library',action,id)}));
