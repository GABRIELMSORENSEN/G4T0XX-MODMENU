const {app,BrowserWindow,ipcMain,dialog}=require('electron');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {Library}=require('./library.cjs');
app.disableHardwareAcceleration();
// Chromium AppContainer children need read/execute access to their own installation.
// Keep renderer sandboxing enabled; scope this ACL to shipped application files only.
if(process.platform==='win32'){
  const directory=path.dirname(process.execPath);
  const shipped=[process.execPath,'icudtl.dat','resources.pak','snapshot_blob.bin','v8_context_snapshot.bin','chrome_100_percent.pak','chrome_200_percent.pak','d3dcompiler_47.dll','ffmpeg.dll','libEGL.dll','libGLESv2.dll','vk_swiftshader.dll','vk_swiftshader_icd.json','vulkan-1.dll','resources','resources/app.asar','resources/elevate.exe','locales','locales/*.pak'];
  // Do not grant access to user documents or settings beside an unpacked executable.
  for(const file of [directory,...shipped.map(value=>path.isAbsolute(value)?value:path.join(directory,value))]){
    try{require('node:child_process').execFileSync('icacls.exe',[file,'/grant','*S-1-15-2-1:RX','*S-1-15-2-2:RX','/C','/Q'],{windowsHide:true,stdio:'ignore',timeout:3000});}catch{}
  }
}

let window,library;
if(app.commandLine.hasSwitch('user-data-dir'))app.setPath('userData',path.resolve(app.commandLine.getSwitchValue('user-data-dir')));
app.whenReady().then(()=>{
  try{library=new Library(path.join(app.getPath('userData'),'library'));}catch(error){dialog.showErrorBox('Biblioteca precisa de recuperação',error.message);app.quit();return;}
  window=new BrowserWindow({width:1280,height:860,minWidth:680,minHeight:540,title:'G4T0XX · Modmenu',icon:path.join(__dirname,'..','assets','icon.png'),backgroundColor:'#0b090c',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  window.removeMenu();window.webContents.setWindowOpenHandler(()=>({action:'deny'}));window.webContents.on('will-navigate',e=>e.preventDefault());window.webContents.session.setPermissionRequestHandler((_,__,callback)=>callback(false));
  ipcMain.handle('library',async(event,action,id)=>{
    if(event.sender!==window.webContents||event.senderFrame!==window.webContents.mainFrame)throw new Error('Origem inválida');
    try{
      if(action==='addGame'){const choice=await dialog.showOpenDialog(window,{title:'Escolher executável do jogo',properties:['openFile'],filters:[{name:'Executável Windows',extensions:['exe']}]});if(!choice.canceled)library.addGame(choice.filePaths[0]);}
      else if(action==='importMod'){library.game(id);const choice=await dialog.showOpenDialog(window,{title:'Pasta do mod com estrutura relativa ao jogo',properties:['openDirectory']});if(!choice.canceled)library.importMod(id,choice.filePaths[0]);}
      else if(action==='toggle')library.toggle(id);
      else if(action==='removeMod')library.removeMod(id);
      else if(action==='removeGame')library.removeGame(id);
      else if(action==='launch'){const game=library.game(id);const child=spawn(game.executable,[],{cwd:path.dirname(game.executable),detached:true,stdio:'ignore',shell:false});await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});child.unref();}
      else if(action!=='state')throw new Error('Ação inválida');
      return {ok:true,state:library.state()};
    }catch(error){return {ok:false,error:error.message};}
  });
  window.loadFile(path.join(__dirname,'index.html'));
});
app.on('window-all-closed',()=>app.quit());
