const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const copyAtomic=(source,target)=>{const temp=target+'.g4-tmp';try{fs.copyFileSync(source,temp);fs.renameSync(temp,target);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}};
const within=(root,relative)=>{const target=path.resolve(root,relative);if(!target.startsWith(path.resolve(root)+path.sep))throw new Error('Caminho fora da pasta do jogo');return target;};
function files(root,base=root,result=[]) {
  for(const item of fs.readdirSync(base,{withFileTypes:true})) {
    if(item.isSymbolicLink())throw new Error('Links simbólicos não são aceitos em mods');
    const full=path.join(base,item.name);
    if(item.isDirectory())files(root,full,result);
    else if(item.isFile())result.push(path.relative(root,full));
    if(result.length>2000)throw new Error('Limite de 2000 arquivos por mod');
  }
  return result;
}
function safeTarget(root,relative) {
  const target=within(root,relative);
  let current=path.resolve(root);
  if(fs.lstatSync(current).isSymbolicLink())throw new Error('A pasta do jogo não pode ser um link');
  for(const segment of path.relative(root,target).split(path.sep)) {
    current=path.join(current,segment);
    if(fs.existsSync(current)&&fs.lstatSync(current).isSymbolicLink())throw new Error('Destino contém link simbólico');
  }
  return target;
}
class Library {
  constructor(root) {this.root=root;fs.mkdirSync(root,{recursive:true});this.file=path.join(root,'library.json');try{this.data=JSON.parse(fs.readFileSync(this.file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw new Error('Biblioteca inválida. Preserve library.json antes de restaurar um backup.');this.data={version:1,games:[],mods:[]};} this.journal=path.join(root,'transaction.json');this.recover(); }
  recover(){
    if(!fs.existsSync(this.journal))return;
    const transaction=JSON.parse(fs.readFileSync(this.journal,'utf8'));
    const mod=this.data.mods.find(m=>m.id===transaction.mod.id);
    if(mod&&mod.enabled!==transaction.wasEnabled){fs.unlinkSync(this.journal);return;}
    const root=path.dirname(this.game(transaction.mod.gameId).executable);
    const backup=path.join(this.root,'backups',transaction.mod.id),source=path.join(this.root,'mods',transaction.mod.id);
    // Refuse recovery if another program changed the destination after the interruption.
    for(const entry of transaction.mod.entries){
      const target=safeTarget(root,entry.relative),current=fs.existsSync(target)?hash(target):null;
      const restored=entry.hadOriginal?hash(within(backup,entry.relative)):null;
      if(current!==entry.installedHash&&current!==restored)throw new Error('Operação interrompida e arquivo alterado: '+entry.relative+'. Preserve seus dados e consulte os backups em '+backup);
    }
    for(const entry of transaction.mod.entries){
      const target=safeTarget(root,entry.relative);
      if(transaction.wasEnabled)copyAtomic(within(source,entry.relative),target);
      else if(entry.hadOriginal)copyAtomic(within(backup,entry.relative),target);
      else if(fs.existsSync(target))fs.unlinkSync(target);
    }
    fs.unlinkSync(this.journal);
  }
  save(){const temp=this.file+'.tmp';fs.writeFileSync(temp,JSON.stringify(this.data,null,2));fs.renameSync(temp,this.file);}
  state(){return {games:this.data.games.map(g=>({...g,available:fs.existsSync(g.executable)})),mods:this.data.mods.map(({entries,...m})=>({...m,fileCount:entries.length,files:entries.map(e=>e.relative)}))};}
  addGame(executable){if(!fs.statSync(executable).isFile()||path.extname(executable).toLowerCase()!=='.exe')throw new Error('Escolha o executável .exe do jogo');if(this.data.games.some(g=>g.executable.toLowerCase()===path.resolve(executable).toLowerCase()))throw new Error('Jogo já cadastrado');const game={id:crypto.randomUUID(),name:path.basename(executable,'.exe'),executable:path.resolve(executable)};this.data.games.push(game);this.save();return game;}
  game(id){const game=this.data.games.find(g=>g.id===id);if(!game)throw new Error('Jogo não encontrado');return game;}
  importMod(gameId,source){this.game(gameId);const list=files(source);if(!list.length)throw new Error('A pasta está vazia');const size=list.reduce((sum,f)=>sum+fs.statSync(within(source,f)).size,0);if(size>512*1024*1024)throw new Error('Limite de 512 MB por mod');const id=crypto.randomUUID();const directory=path.join(this.root,'mods',id);fs.mkdirSync(directory,{recursive:true});try{for(const relative of list){const target=within(directory,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(within(source,relative),target);}const mod={id,gameId,name:path.basename(source),enabled:false,entries:list.map(relative=>({relative,installedHash:hash(within(directory,relative)),hadOriginal:false}))};this.data.mods.push(mod);this.save();return mod;}catch(e){fs.rmSync(directory,{recursive:true,force:true});throw e;}}
  toggle(id){const mod=this.data.mods.find(m=>m.id===id);if(!mod)throw new Error('Mod não encontrado');const game=this.game(mod.gameId),root=path.dirname(game.executable);const backup=path.join(this.root,'backups',mod.id),source=path.join(this.root,'mods',mod.id);const prior=JSON.stringify(mod);this.recover();
    for(const entry of mod.entries){const target=safeTarget(root,entry.relative);if(target.toLowerCase()===game.executable.toLowerCase())throw new Error('Mod não pode substituir o executável cadastrado');if(!mod.enabled){const conflict=this.data.mods.some(other=>other.id!==mod.id&&other.enabled&&other.gameId===mod.gameId&&other.entries.some(e=>e.relative.toLowerCase()===entry.relative.toLowerCase()));if(conflict)throw new Error('Outro mod ativo usa '+entry.relative);if(fs.existsSync(target)&&!fs.statSync(target).isFile())throw new Error('Destino não é um arquivo');if(hash(within(source,entry.relative))!==entry.installedHash)throw new Error('Arquivo importado foi alterado');}else if(!fs.existsSync(target)||hash(target)!==entry.installedHash)throw new Error('Arquivo do jogo mudou: '+entry.relative+'. Preserve sua alteração antes de desativar.');if(mod.enabled&&entry.hadOriginal&&!fs.existsSync(within(backup,entry.relative)))throw new Error('Backup ausente: '+entry.relative);}
    if(!mod.enabled){
      for(const entry of mod.entries){const target=safeTarget(root,entry.relative);entry.hadOriginal=fs.existsSync(target);if(entry.hadOriginal){const original=within(backup,entry.relative);fs.mkdirSync(path.dirname(original),{recursive:true});copyAtomic(target,original);}}
    }
    const transaction={wasEnabled:mod.enabled,mod:JSON.parse(JSON.stringify(mod))};
    fs.writeFileSync(this.journal+'.tmp',JSON.stringify(transaction));fs.renameSync(this.journal+'.tmp',this.journal);
    try{
      for(const entry of mod.entries){const target=safeTarget(root,entry.relative),original=within(backup,entry.relative);fs.mkdirSync(path.dirname(target),{recursive:true});if(!mod.enabled)copyAtomic(within(source,entry.relative),target);else if(entry.hadOriginal)copyAtomic(original,target);else fs.unlinkSync(target);}
      mod.enabled=!mod.enabled;this.save();fs.unlinkSync(this.journal);return mod;
    }catch(error){Object.assign(mod,JSON.parse(prior));this.recover();throw error;}
  }

  removeGame(id){this.game(id);if(this.data.mods.some(m=>m.gameId===id))throw new Error('Remova os mods deste jogo antes de removê-lo');this.data.games=this.data.games.filter(g=>g.id!==id);this.save();}
  removeMod(id){const mod=this.data.mods.find(m=>m.id===id);if(!mod)throw new Error('Mod não encontrado');if(mod.enabled)throw new Error('Desative o mod antes de removê-lo');this.data.mods=this.data.mods.filter(m=>m.id!==id);this.save();}
}
module.exports={Library,files,safeTarget};
