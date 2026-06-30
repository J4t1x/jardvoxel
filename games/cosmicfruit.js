// ==================== GAME STATE ====================
let gameState={
  saldo:1000,nivel:1,expTotal:0,apuestaActual:50,autoSpin:false,turboMode:false,
  enBono:false,enGamble:false,bonoIntentos:0,bonoPremios:0,gambleRondas:0,gamblePremioAcumulado:0,
  carretes:[[],[],[],[],[]],girando:false,tapCombo:0,spinStreak:0,winStreak:0,
  fruitFever:false,feverGiros:0,mysteryBoxPendiente:false,loginStreak:0,ultimoLogin:null,
  jackpotProgresivo:5000,freeSpins:0,freeSpinsMult:2,prestigio:0,prestigeMult:1,
  challenges:[],challengesDate:null,tutorialVisto:false,volume:70,
  upgrades:{luckyStraw:false,multiplierBoost:false,insurance:false,streakSaver:false,
    autoSpin:false,turboMode:false,extraLine:false,doubleWild:false,
    goldenTouch:false,fruitMagnet:false,catchMaster:false,nudgePro:false,
    tapFrenzy:false,autoCatcher:false,fruitSprinkler:false},
  achievements:[],freeMoney:false,
  stats:{totalSpins:0,totalWins:0,totalBet:0,totalWon:0,biggestWin:0,
    bonosTriggered:0,gambleWins:0,gambleLosses:0,bestStreak:0,jackpots:0,fruitsCaught:0,
    scatterTriggered:0,freeSpinsWon:0,prestiges:0},
  highScore:0,
};
const SAVE_KEY='cosmic-fruit-save';

// ==================== ALIEN SYMBOLS ====================
const SIMBOLOS=[
  {emoji:'🫐',nombre:'cosmicberry',peso:25,mult:{3:2,4:5,5:10}},
  {emoji:'🍇',nombre:'spacegrape',peso:20,mult:{3:2,4:8,5:20}},
  {emoji:'🍄',nombre:'alienmushroom',peso:18,mult:{3:3,4:10,5:30}},
  {emoji:'🌺',nombre:'alienflower',peso:15,mult:{3:5,4:15,5:50}},
  {emoji:'🔮',nombre:'crystalball',peso:10,mult:{3:10,4:25,5:100}},
  {emoji:'💎',nombre:'diamond',peso:7,mult:{3:20,4:50,5:200}},
  {emoji:'🪐',nombre:'wild',peso:3,mult:{3:50,4:200,5:1000},wild:true},
  {emoji:'🌟',nombre:'scatter',peso:3,mult:{3:5,4:15,5:50},scatter:true},
  {emoji:'👽',nombre:'bonus',peso:2,bonus:true},
];
const BONUS_MULT={'🫐':2,'🍇':5,'🍄':10,'🌺':20,'🔮':30,'💎':50,'EXIT':0};
const BONUS_SYMS=['🫐','🍇','🍄','🌺','🔮','💎'];

// ==================== PAYLINES ====================
const LINEAS=[
  [[0,0],[1,0],[2,0],[3,0],[4,0]],
  [[0,1],[1,1],[2,1],[3,1],[4,1]],
  [[0,2],[1,2],[2,2],[3,2],[4,2]],
  [[0,0],[1,1],[2,2],[3,1],[4,0]],
  [[0,2],[1,1],[2,0],[3,1],[4,2]],
];
const LINEA_EXTRA=[[0,0],[1,1],[2,1],[3,1],[4,0]];

// ==================== UPGRADES ====================
const UPGRADES_DATA=[
  {key:'luckyStraw',name:'Lucky Alien',desc:'+5% chance de bonus alien',costo:500,icon:'👽'},
  {key:'multiplierBoost',name:'Plasma Boost',desc:'Multiplicadores base +20%',costo:1000,icon:'⚡'},
  {key:'insurance',name:'Force Field',desc:'Doble o nada: empate = recuperar',costo:800,icon:'🛡️'},
  {key:'streakSaver',name:'Streak Saver',desc:'Primer loss del bono no cuenta',costo:1500,icon:'💝'},
  {key:'autoSpin',name:'Auto-Spin x10',desc:'10 giros automáticos',costo:2000,icon:'🔄'},
  {key:'turboMode',name:'Warp Speed',desc:'Giros 2x más rápidos',costo:3000,icon:'💨'},
  {key:'extraLine',name:'Extra Line',desc:'Desbloquea línea 6 (zigzag)',costo:5000,icon:'📐'},
  {key:'doubleWild',name:'Double Planet',desc:'Wild cuenta como x2',costo:8000,icon:'🪐'},
  {key:'goldenTouch',name:'Golden Touch',desc:'Frutas flotantes valen x2',costo:600,icon:'✨'},
  {key:'fruitMagnet',name:'Gravity Well',desc:'Frutas flotantes se acercan',costo:1200,icon:'🧲'},
  {key:'catchMaster',name:'Catch Master',desc:'Fruit Catcher da x3',costo:800,icon:'🎯'},
  {key:'nudgePro',name:'Nudge Pro',desc:'2 nudges por giro',costo:2000,icon:'👆'},
  {key:'tapFrenzy',name:'Tap Frenzy',desc:'Tap combo bonus máx +25%',costo:1500,icon:'🔥'},
  {key:'autoCatcher',name:'Auto-Catcher',desc:'Atrapa frutas automáticamente',costo:3000,icon:'🤖'},
  {key:'fruitSprinkler',name:'Sprinkler',desc:'5 frutas flotantes vs 3',costo:2500,icon:'🌈'},
];

// ==================== ACHIEVEMENTS ====================
const ACHIEVEMENTS_DATA=[
  {id:'firstSpin',emoji:'🎰',name:'First Spin',desc:'Primer giro',premio:10,check:s=>s.stats.totalSpins>=1},
  {id:'firstWin',emoji:'🎉',name:'First Win',desc:'Primer premio',premio:50,check:s=>s.stats.totalWins>=1},
  {id:'berryPicker',emoji:'🫐',name:'Berry Picker',desc:'3 cosmicberries en línea',premio:100,check:s=>s.achievements.includes('berryPicker')},
  {id:'wildOne',emoji:'🪐',name:'Wild Planet',desc:'Wild en combinación ganadora',premio:100,check:s=>s.achievements.includes('wildOne')},
  {id:'bonusHunter',emoji:'👽',name:'Alien Hunter',desc:'Activar ronda alien',premio:200,check:s=>s.stats.bonosTriggered>=1},
  {id:'bonusMaster',emoji:'🏆',name:'Bonus Master',desc:'Ganar 1000+ en bono',premio:500,check:s=>s.achievements.includes('bonusMaster')},
  {id:'gambler',emoji:'🃏',name:'Gambler',desc:'Usar doble o nada 10 veces',premio:200,check:s=>(s.stats.gambleWins+s.stats.gambleLosses)>=10},
  {id:'doubleDown',emoji:'⚡',name:'Double Down',desc:'Ganar 5 rondas seguidas',premio:500,check:s=>s.achievements.includes('doubleDown')},
  {id:'highRoller',emoji:'💰',name:'High Roller',desc:'Apostar 500+',premio:300,check:s=>s.achievements.includes('highRoller')},
  {id:'allIn',emoji:'🤑',name:'All In',desc:'Hacer ALL IN y ganar',premio:1000,check:s=>s.achievements.includes('allIn')},
  {id:'fruitMaster',emoji:'👑',name:'Cosmic Master',desc:'100 giros ganados',premio:1000,check:s=>s.stats.totalWins>=100},
  {id:'jackpot',emoji:'💎',name:'Jackpot',desc:'5 🪐 en una línea',premio:5000,check:s=>s.stats.jackpots>=1},
  {id:'scatterKing',emoji:'🌟',name:'Scatter King',desc:'Activar 3+ scatters',premio:300,check:s=>s.stats.scatterTriggered>=1},
  {id:'freeSpinMaster',emoji:'🎰',name:'Free Spin Master',desc:'Ganar 50 free spins',premio:800,check:s=>s.stats.freeSpinsWon>=50},
  {id:'prestige',emoji:'⭐',name:'Prestigio',desc:'Hacer prestigio',premio:2000,check:s=>s.stats.prestiges>=1},
  {id:'challengeMaster',emoji:'🎯',name:'Challenge Master',desc:'Completar 10 retos',premio:1000,check:s=>s.achievements.includes('challengeMaster')},
];

// ==================== CHALLENGES ====================
const CHALLENGES_POOL=[
  {id:'win3',name:'Racha ganadora',desc:'Gana 3 giros seguidos',icon:'🔥',reward:100,check:s=>s.winStreak>=3,target:3,type:'winStreak'},
  {id:'bonus1',name:'Cazador alien',desc:'Activa la ronda alien',icon:'👽',reward:150,check:s=>s.stats.bonosTriggered>=1,target:1,type:'bonus'},
  {id:'catch10',name:'Recolector',desc:'Atrapa 10 frutas flotantes',icon:'🍎',reward:100,check:s=>s.stats.fruitsCaught>=10,target:10,type:'catch'},
  {id:'spin20',name:'Girador',desc:'Da 20 giros',icon:'🎰',reward:120,check:s=>s.stats.totalSpins>=20,target:20,type:'spins'},
  {id:'bigwin1',name:'Gran premio',desc:'Gana 10x tu apuesta',icon:'🎉',reward:200,check:s=>s.stats.biggestWin>=s.apuestaActual*10,target:1,type:'bigwin'},
  {id:'gamble2',name:'Apostador',desc:'Usa doble o nada 2 veces',icon:'🃏',reward:100,check:s=>(s.stats.gambleWins+s.stats.gambleLosses)>=2,target:2,type:'gamble'},
  {id:'jackpot1',name:'Jackpoteador',desc:'Consigue un jackpot',icon:'💎',reward:500,check:s=>s.stats.jackpots>=1,target:1,type:'jackpot'},
  {id:'scatter3',name:'Estelar',desc:'Consigue 3 scatters 🌟',icon:'🌟',reward:250,check:s=>s.stats.scatterTriggered>=1,target:1,type:'scatter'},
  {id:'level2',name:'Subida de nivel',desc:'Alcanza el nivel 2',icon:'📈',reward:150,check:s=>s.nivel>=2,target:2,type:'level'},
  {id:'freespin5',name:'Tiradas gratis',desc:'Gana 5 free spins',icon:'🎰',reward:200,check:s=>s.stats.freeSpinsWon>=5,target:5,type:'freespins'},
];

// ==================== AUDIO ENGINE ====================
let audioCtx=null,audioEnabled=true,masterGain=null,chiptuneTimer=null,chiptuneLayer=0,currentTrack=null;
function initAudio(){if(audioCtx)return;try{audioCtx=new(window.AudioContext||window.webkitAudioContext)();masterGain=audioCtx.createGain();masterGain.gain.value=0.7;masterGain.connect(audioCtx.destination);}catch(e){audioEnabled=false;}}
function playTone(f,d,t='sine',v=0.1){if(!audioEnabled||!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=t;o.frequency.value=f;g.gain.setValueAtTime(v,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+d);o.connect(g).connect(masterGain);o.start();o.stop(audioCtx.currentTime+d);}
function playSweep(f1,f2,d,t='sawtooth',v=0.1){if(!audioEnabled||!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=t;o.frequency.setValueAtTime(f1,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(f2,audioCtx.currentTime+d);g.gain.setValueAtTime(v,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+d);o.connect(g).connect(masterGain);o.start();o.stop(audioCtx.currentTime+d);}
function playNotes(n,d,t='sine',v=0.12){n.forEach((f,i)=>setTimeout(()=>playTone(f,d,t,v),i*d*1000));}
const SFX={
  spin:()=>playSweep(200,100,0.3,'sawtooth',0.25),
  reelStop:(i=0)=>playTone(500+i*80,0.05,'square',0.35),
  win:()=>playNotes([523,659,784],0.15,'sine',0.28),
  bigWin:()=>playNotes([523,659,784,1047,1319],0.12,'sine',0.35),
  bonus:()=>playNotes([440,554,659,880],0.2,'triangle',0.35),
  coin:()=>playTone(1319,0.08,'sine',0.25),
  tapFruit:()=>playTone(880,0.04,'square',0.2),
  nudge:()=>playSweep(150,300,0.2,'sawtooth',0.25),
  gambleCard:()=>playTone(400,0.1,'square',0.25),
  gambleWin:()=>playNotes([659,880],0.15,'sine',0.28),
  gambleLoss:()=>playSweep(220,55,0.4,'sawtooth',0.28),
  jackpot:()=>playNotes([523,659,784,1047,1319,1568,2093],0.1,'square',0.4),
  nearMiss:()=>playSweep(300,400,0.3,'triangle',0.2),
  feverMode:()=>playNotes([440,554,659,880,1108],0.1,'square',0.35),
  layerUp:()=>playTone(660,0.1,'triangle',0.25),
  mystery:()=>playNotes([659,880,1047,1319],0.1,'triangle',0.28),
};
const TRACKS={
  lounge:{bpm:90,triangle:[110,110,110,82,110,110,82,82],pulse1:[330,262,220,262,330,330,294,262,294,247,196,247,294,294,262,247]},
  lounge2:{bpm:95,triangle:[98,98,98,110,98,98,110,130,98,98,98,110,87,87,82,82],pulse1:[294,247,220,247,294,294,262,220,262,220,196,220,262,262,247,220]},
  lounge3:{bpm:100,triangle:[82,82,87,87,98,98,110,110,87,87,82,82,73,73,82,82],pulse1:[220,196,247,196,220,220,262,196,247,220,196,247,220,220,196,175],pulse2:[165,165,175,175,165,165,147,147,175,175,165,165,131,131,147,147]},
  spin:{bpm:140,triangle:[110,110,82,82,110,110,82,82,98,98,65,65,98,98,73,73],pulse1:[220,262,330,262,220,262,330,262,196,220,262,220,196,247,294,247],pulse2:[165,165,165,165,165,165,165,165,175,175,175,175,147,147,147,147],noise:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]},
  spin2:{bpm:150,triangle:[110,98,110,82,110,98,110,82,123,110,123,98,123,110,98,82],pulse1:[262,294,330,294,262,294,330,294,220,247,262,247,220,247,262,247],pulse2:[165,165,175,175,165,165,147,147,175,175,165,165,147,147,131,131],noise:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]},
  bonus:{bpm:160,triangle:[110,110,110,110,82,82,82,82,98,98,98,98,82,82,82,82],pulse1:[330,330,330,330,330,294,262,294,262,262,262,262,262,247,220,247],pulse2:[220,220,262,262,165,165,196,196,175,175,220,220,165,165,196,196],noise:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]},
  fever:{bpm:180,triangle:[110,110,110,110,110,110,110,110],pulse1:[330,294,330,294,330,294,330,294],pulse2:[220,220,262,262,165,165,196,196],noise:[1,1,1,1,1,1,1,1]},
  gamble:{bpm:100,triangle:[110,110,110,110,82,82,82,82],pulse1:[220,220,220,220,262,262,262,262]},
  win:{bpm:130,triangle:[110,110,0,110,82,82,0,82,98,98,0,98,110,110,0,130],pulse1:[330,392,440,392,330,392,440,392,294,330,392,330,294,330,392,440],pulse2:[220,220,262,262,196,196,220,220,247,247,294,294,262,262,330,330],noise:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]},
  tense:{bpm:110,triangle:[73,73,73,73,82,82,82,82,73,73,73,73,65,65,65,65],pulse1:[196,196,220,220,196,196,175,175,196,196,220,220,165,165,147,147],pulse2:[147,147,131,131,147,147,165,165,131,131,147,147,110,110,98,98],noise:[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1]},
};
const musicState={loungeIdx:0,spinIdx:0,winTrackTimer:null};
const LOUNGE_TRACKS=['lounge','lounge2','lounge3'];
const SPIN_TRACKS=['spin','spin2'];
function pickLoungeTrack(){const i=musicState.loungeIdx%LOUNGE_TRACKS.length;musicState.loungeIdx++;return LOUNGE_TRACKS[i];}
function pickSpinTrack(){const i=musicState.spinIdx%SPIN_TRACKS.length;musicState.spinIdx++;return SPIN_TRACKS[i];}
function playWinTrack(){if(musicState.winTrackTimer){clearTimeout(musicState.winTrackTimer);musicState.winTrackTimer=null;}startMusic('win');musicState.winTrackTimer=setTimeout(()=>{musicState.winTrackTimer=null;if(!gameState.girando&&!gameState.enBono&&!gameState.enGamble&&!gameState.fruitFever)startMusic(pickLoungeTrack());},3500);}
function playTenseTrack(){if(musicState.winTrackTimer){clearTimeout(musicState.winTrackTimer);musicState.winTrackTimer=null;}startMusic('tense');setTimeout(()=>{if(!gameState.girando&&!gameState.enBono&&!gameState.enGamble&&!gameState.fruitFever)startMusic(pickLoungeTrack());},2500);}
let seq={currentBar:0,nextNoteTime:0,scheduleAhead:0.1,lookahead:25,timerID:null};
function playOscNote(f,t,d,ty,v){if(!audioCtx||!audioEnabled)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=ty;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+0.01);g.gain.exponentialRampToValueAtTime(0.001,t+d);o.connect(g).connect(masterGain);o.start(t);o.stop(t+d);}
function playNoise(t,d,v){if(!audioCtx||!audioEnabled)return;const bs=audioCtx.sampleRate*d,buf=audioCtx.createBuffer(1,bs,audioCtx.sampleRate),da=buf.getChannelData(0);for(let i=0;i<bs;i++)da[i]=Math.random()*2-1;const n=audioCtx.createBufferSource();n.buffer=buf;const g=audioCtx.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.001,t+d);n.connect(g).connect(masterGain);n.start(t);n.stop(t+d);}
function scheduleNote(bar,time){const tr=TRACKS[currentTrack];if(!tr)return;const bl=60.0/tr.bpm/4;if(tr.triangle){const n=tr.triangle[bar%tr.triangle.length];if(n>0)playOscNote(n,time,bl*0.9,'triangle',0.14);}if(tr.pulse1&&chiptuneLayer>=1){const n=tr.pulse1[bar%tr.pulse1.length];if(n>0)playOscNote(n,time,bl*0.8,'square',0.1);}if(tr.pulse2&&chiptuneLayer>=2){const n=tr.pulse2[bar%tr.pulse2.length];if(n>0)playOscNote(n,time,bl*0.7,'square',0.08);}if(tr.noise&&chiptuneLayer>=3){if(tr.noise[bar%tr.noise.length])playNoise(time,bl*0.5,0.1);}}
function chiptuneScheduler(){if(!currentTrack||!audioCtx)return;while(seq.nextNoteTime<audioCtx.currentTime+seq.scheduleAhead){scheduleNote(seq.currentBar,seq.nextNoteTime);seq.nextNoteTime+=60.0/TRACKS[currentTrack].bpm*0.25;seq.currentBar++;}chiptuneTimer=setTimeout(chiptuneScheduler,seq.lookahead);}
function startMusic(name){if(!audioCtx||!audioEnabled)return;if(audioCtx.state==='suspended')audioCtx.resume();stopMusic();currentTrack=name;seq.currentBar=0;seq.nextNoteTime=audioCtx.currentTime+0.1;chiptuneScheduler();}
function stopMusic(){if(chiptuneTimer){clearTimeout(chiptuneTimer);chiptuneTimer=null;}currentTrack=null;}
function setLayer(l){if(l!==chiptuneLayer){chiptuneLayer=l;if(l>0)SFX.layerUp();}}

// ==================== HAPTICS ====================
function vibrar(p){if(navigator.vibrate)navigator.vibrate(p);}

// ==================== SAVE/LOAD ====================
function guardar(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(gameState));}catch(e){}}
function cargar(){try{const s=localStorage.getItem(SAVE_KEY);if(s){const p=JSON.parse(s);gameState={...gameState,...p,upgrades:{...gameState.upgrades,...(p.upgrades||{})},stats:{...gameState.stats,...(p.stats||{})}};if(!gameState.jackpotProgresivo)gameState.jackpotProgresivo=5000;if(!gameState.prestigeMult)gameState.prestigeMult=1;if(!gameState.challenges)gameState.challenges=[];if(typeof gameState.volume!=='number')gameState.volume=70;}}catch(e){}}

// ==================== SYMBOL GENERATION ====================
function genSim(){let total=SIMBOLOS.reduce((s,sym)=>s+sym.peso,0);if(gameState.upgrades.luckyStraw)total+=5;let r=Math.random()*total;for(const sym of SIMBOLOS){r-=sym.peso;if(r<=0)return sym;}if(gameState.upgrades.luckyStraw){r-=5;if(r<=0)return SIMBOLOS.find(s=>s.bonus);}return SIMBOLOS[0];}
function genCarrete(){return[genSim(),genSim(),genSim()];}

// ==================== LINE EVALUATION ====================
function evalLine(sims,dir){const ord=dir==='ltr'?[0,1,2,3,4]:[4,3,2,1,0];let consec=1,first=sims[ord[0]];if(first.bonus||first.scatter)return null;for(let i=1;i<5;i++){const cur=sims[ord[i]];if(cur.bonus||cur.scatter)break;if(cur.nombre===first.nombre||cur.wild||first.wild){consec++;if(first.wild&&!cur.wild)first=cur;}else break;}if(consec>=3){let m=first.mult[consec]||0;if(gameState.upgrades.multiplierBoost)m=Math.floor(m*1.2);if(gameState.upgrades.doubleWild&&first.wild)m*=2;if(gameState.fruitFever)m*=2;if(gameState.freeSpins>0)m*=gameState.freeSpinsMult;m=Math.floor(m*gameState.prestigeMult);return{simbolo:first,cantidad:consec,direccion:dir,mult:m};}return null;}
function evalGiros(){const lineas=gameState.upgrades.extraLine?[...LINEAS,LINEA_EXTRA]:LINEAS;const resultados=[];let premioTotal=0,tieneWild=false,jackpot=false;for(let i=0;i<lineas.length;i++){const sims=lineas[i].map(([r,f])=>gameState.carretes[r][f]);for(const dir of['ltr','rtl']){const res=evalLine(sims,dir);if(res){const premio=gameState.apuestaActual*res.mult;premioTotal+=premio;resultados.push({lineaIndex:i,linea:lineas[i],...res,premio});if(res.simbolo.wild)tieneWild=true;if(res.simbolo.wild&&res.cantidad>=5)jackpot=true;}}}if(premioTotal>0&&gameState.tapCombo>5){let pct=0;const max=gameState.upgrades.tapFrenzy?0.25:0.15;if(gameState.tapCombo<=10)pct=0.05;else if(gameState.tapCombo<=20)pct=0.10;else pct=max;premioTotal=Math.floor(premioTotal*(1+pct));}let aliens=0,scatters=0,wildCount=0;for(let r=0;r<5;r++)for(let f=0;f<3;f++){if(gameState.carretes[r][f].bonus)aliens++;if(gameState.carretes[r][f].scatter)scatters++;if(gameState.carretes[r][f].wild)wildCount++;}let scatterWin=0,freeSpinsTriggered=false;if(scatters>=3){const sm=SIMBOLOS.find(s=>s.scatter);scatterWin=gameState.apuestaActual*(sm.mult[scatters]||sm.mult[3]);freeSpinsTriggered=true;}if(wildCount>=3&&!freeSpinsTriggered)freeSpinsTriggered=true;return{resultados,premioTotal,tieneWild,jackpot,aliensCount:aliens,scatters,scatterWin,freeSpinsTriggered,wildCount};}

// ==================== NEAR MISS ====================
function detectNearMiss(){for(const linea of LINEAS){const sims=linea.map(([r,f])=>gameState.carretes[r][f]);for(const dir of['ltr','rtl']){const ord=dir==='ltr'?[0,1,2,3,4]:[4,3,2,1,0];let consec=1,first=sims[ord[0]];if(first.bonus)continue;for(let i=1;i<5;i++){const cur=sims[ord[i]];if(cur.bonus)break;if(cur.nombre===first.nombre||cur.wild||first.wild){consec++;if(first.wild&&!cur.wild)first=cur;}else break;}if(consec===4)return{simbolo:first,cantidad:4,linea,posicion:ord[4]};}}return null;}

// ==================== PARTICLE EFFECTS ====================
const pCanvas=document.getElementById('particle-canvas'),pCtx=pCanvas.getContext('2d');let particles=[];
function resizeCanvas(){pCanvas.width=window.innerWidth;pCanvas.height=window.innerHeight;}resizeCanvas();
function spawnParticles(x,y,count,opts={}){const colors=opts.colors||['#00ffcc','#b366ff','#ff6b35','#ff3399','#ffd700','#ffffff'],speed=opts.speed||8,size=opts.size||6;for(let i=0;i<count;i++){const ang=Math.random()*Math.PI*2,v=Math.random()*speed+2;particles.push({x,y,vx:Math.cos(ang)*v,vy:Math.sin(ang)*v-2,g:0.3,life:1,decay:0.015+Math.random()*0.01,size:Math.random()*size+2,color:colors[Math.floor(Math.random()*colors.length)],shape:Math.random()<0.3?'star':'circle',rot:Math.random()*Math.PI*2,vr:(Math.random()-0.5)*0.3});}}
function drawStar(ctx,x,y,r,rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.beginPath();for(let i=0;i<5;i++){const a=(i*2*Math.PI)/5-M.PI/2;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);const a2=a+Math.PI/5;ctx.lineTo(Math.cos(a2)*r*0.4,Math.sin(a2)*r*0.4);}ctx.closePath();ctx.fill();ctx.restore();}
function updateParticles(){pCtx.clearRect(0,0,pCanvas.width,pCanvas.height);for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.vx*=0.99;p.rot+=p.vr;p.life-=p.decay;if(p.life<=0){particles.splice(i,1);continue;}pCtx.globalAlpha=p.life;pCtx.fillStyle=p.color;pCtx.shadowBlur=10;pCtx.shadowColor=p.color;if(p.shape==='star')drawStar(pCtx,p.x,p.y,p.size*p.life,p.rot);else{pCtx.beginPath();pCtx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);pCtx.fill();}}pCtx.globalAlpha=1;pCtx.shadowBlur=0;requestAnimationFrame(updateParticles);}updateParticles();

function flashScreen(color){const el=document.getElementById('flash-overlay');el.className='';void el.offsetWidth;el.className='flash-'+color;setTimeout(()=>el.className='',900);}
function coinRain(count){for(let i=0;i<count;i++){setTimeout(()=>{const el=document.createElement('div');el.className='coin-rain';el.textContent=Math.random()<0.5?'🪙':'⭐';el.style.left=Math.random()*window.innerWidth+'px';el.style.top='-30px';el.style.animationDuration=(1.2+Math.random()*0.8)+'s';document.body.appendChild(el);setTimeout(()=>el.remove(),2200);},i*30);}}
function lightning(){for(let i=0;i<3;i++){setTimeout(()=>{const el=document.createElement('div');el.className='lightning';el.style.cssText=`position:fixed;top:0;left:${Math.random()*window.innerWidth}px;width:${2+Math.random()*4}px;height:100vh;background:linear-gradient(180deg,rgba(0,255,204,0.8),rgba(0,255,204,0.2),transparent);filter:blur(1px);box-shadow:0 0 20px rgba(0,255,204,0.6)`;document.body.appendChild(el);setTimeout(()=>el.remove(),300);},i*100);}}
function showJackpotZoom(){const el=document.getElementById('jackpotZoom');el.classList.add('activo');setTimeout(()=>el.classList.remove('activo'),2500);}
function showBigWinBanner(txt){const el=document.getElementById('bigWinBanner');el.textContent=txt;el.classList.remove('activo');void el.offsetWidth;el.classList.add('activo');setTimeout(()=>el.classList.remove('activo'),2000);}
function showComboMega(txt){const el=document.getElementById('comboMega');el.textContent=txt;el.classList.remove('activo');void el.offsetWidth;el.classList.add('activo');setTimeout(()=>el.classList.remove('activo'),800);}
function animateSaldo(from,to){const el=document.getElementById('hudSaldo');const diff=to-from,steps=20;let step=0;el.classList.add('saldo-pulse');const iv=setInterval(()=>{step++;const cur=Math.round(from+diff*(step/steps));el.textContent='🪙 '+cur;if(step>=steps){clearInterval(iv);el.textContent='🪙 '+to;el.classList.remove('saldo-pulse');}},30);}
function blurReels(on){for(let i=0;i<5;i++){const strip=document.getElementById('strip'+i);strip.querySelectorAll('.reel-symbol').forEach(s=>s.classList.toggle('blurring',on));}}
function shakeReel(idx){const reel=document.getElementById('reel'+idx);reel.classList.remove('reel-shake');void reel.offsetWidth;reel.classList.add('reel-shake');setTimeout(()=>reel.classList.remove('reel-shake'),300);}

// ==================== REEL RENDERING ====================
function getSymbolHeight(){return document.getElementById('reel0').offsetHeight/3;}
function renderReel(idx,sims){const strip=document.getElementById('strip'+idx),symH=getSymbolHeight();strip.innerHTML='';strip.style.transition='none';strip.style.transform='translateY(0)';for(let i=0;i<3;i++){const div=document.createElement('div');div.className='reel-symbol';div.textContent=sims[i].emoji;div.style.height=symH+'px';div.dataset.reel=idx;div.dataset.fila=i;strip.appendChild(div);}}
function renderAllReels(){for(let i=0;i<5;i++)renderReel(i,gameState.carretes[i]);}

// ==================== SPIN ANIMATION ====================
function checkAnticipation(carretes){for(let fila=0;fila<3;fila++){const syms=[carretes[0][fila],carretes[1][fila],carretes[2][fila],carretes[3][fila]];const counts={};for(const s of syms)counts[s.nombre]=(counts[s.nombre]||0)+1;for(const n in counts)if(counts[n]>=3)return true;}return false;}
function spinReel(idx,finalSims,duration){return new Promise(resolve=>{const strip=document.getElementById('strip'+idx),reel=document.getElementById('reel'+idx),symH=reel.offsetHeight/3;const spinSims=[];for(let i=0;i<30;i++)spinSims.push(genSim());spinSims.push(...finalSims);strip.innerHTML='';strip.style.transition='none';strip.style.transform='translateY(0)';for(const sym of spinSims){const div=document.createElement('div');div.className='reel-symbol';div.textContent=sym.emoji;div.style.height=symH+'px';strip.appendChild(div);}const totalDist=(spinSims.length-3)*symH;requestAnimationFrame(()=>{strip.style.transition=`transform ${duration}ms cubic-bezier(0.16,1,0.3,1)`;strip.style.transform=`translateY(-${totalDist}px)`;});setTimeout(()=>{strip.style.transition='none';strip.innerHTML='';strip.style.transform='translateY(0)';for(let i=0;i<3;i++){const div=document.createElement('div');div.className='reel-symbol';div.textContent=finalSims[i].emoji;div.style.height=symH+'px';div.dataset.reel=idx;div.dataset.fila=i;strip.appendChild(div);}reel.classList.remove('anticipation');reel.classList.add('stopping');setTimeout(()=>reel.classList.remove('stopping'),250);SFX.reelStop(idx);vibrar(15+idx*3);resolve();},duration);});}

// ==================== SPIN LOGIC ====================
async function doSpin(){
  if(gameState.girando||gameState.enBono||gameState.enGamble)return;
  const isFreeSpin=gameState.freeSpins>0;
  if(!isFreeSpin&&gameState.saldo<gameState.apuestaActual){if(gameState.saldo<=0){gameState.saldo=50;gameState.freeMoney=true;showToast('🪙 +50 gratis (force field)');updateHUD();guardar();return;}showToast('Saldo insuficiente');return;}
  initAudio();gameState.girando=true;gameState.tapCombo=0;gameState.carretes=[[],[],[],[],[]];
  if(isFreeSpin){gameState.freeSpins--;updateFreeSpinsBanner();}else{gameState.saldo-=gameState.apuestaActual;gameState.stats.totalBet+=gameState.apuestaActual;gameState.jackpotProgresivo+=Math.floor(gameState.apuestaActual*0.02);updateJackpotDisplay();}
  gameState.stats.totalSpins++;gameState.spinStreak++;updateHUD();
  if(gameState.apuestaActual>=500)unlockAch('highRoller');
  startMusic(pickSpinTrack());SFX.spin();vibrar(50);
  const btn=document.getElementById('btnSpin'),saldoBefore=gameState.saldo+gameState.apuestaActual;
  btn.disabled=true;btn.classList.add('girando');document.getElementById('reelsContainer').classList.add('girando');blurReels(true);
  for(let i=0;i<5;i++)gameState.carretes[i]=genCarrete();
  const turbo=gameState.turboMode?0.5:1,baseDur=1500*turbo,stagger=100*turbo;
  const anticip=checkAnticipation(gameState.carretes);const proms=[];
  for(let i=0;i<5;i++){let dur=baseDur+i*stagger;if(anticip&&i===4){dur+=600*turbo;document.getElementById('reel4').classList.add('anticipation');}proms.push(spinReel(i,gameState.carretes[i],dur));}
  for(let i=0;i<5;i++){const d=anticip&&i===4?baseDur+4*stagger+600*turbo:baseDur+i*stagger;setTimeout(()=>blurReels(false),d-100);}
  setTimeout(()=>enableNudge(),baseDur+200);
  await Promise.all(proms);blurReels(false);disableNudge();
  for(let r=0;r<5;r++){const strip=document.getElementById('strip'+r),syms=strip.querySelectorAll('.reel-symbol');for(let f=0;f<3;f++){if(gameState.carretes[r][f]&&(gameState.carretes[r][f].wild||gameState.carretes[r][f].scatter))if(syms[f])syms[f].classList.add('potential');}}
  setTimeout(()=>document.querySelectorAll('.reel-symbol.potential').forEach(el=>el.classList.remove('potential')),800);
  const res=evalGiros();btn.classList.remove('girando');document.getElementById('reelsContainer').classList.remove('girando');
  if(res.resultados.length>0){
    highlightWins(res.resultados);let premio=res.premioTotal;const cx=window.innerWidth/2,cy=window.innerHeight/2;
    if(res.jackpot){SFX.jackpot();vibrar([50,30,50,30,50,30,100]);crearConfeti(40);coinRain(30);lightning();flashScreen('gold');showJackpotZoom();showBigWinBanner('💎 JACKPOT! 💎');document.body.classList.add('shake');document.getElementById('vignette').classList.add('jackpot');spawnParticles(cx,cy,60,{speed:12,size:8,colors:['#ffd700','#ff6b35','#ffffff']});setTimeout(()=>{document.body.classList.remove('shake');document.getElementById('vignette').classList.remove('jackpot');},600);gameState.stats.jackpots++;unlockAch('jackpot');showToast('💎 JACKPOT! 5 🪐 en línea!');document.querySelectorAll('.reel-symbol.win').forEach(el=>{el.classList.remove('win');el.classList.add('jackpot-win');});}
    else if(premio>=gameState.apuestaActual*50){SFX.bigWin();vibrar([50,30,50,30,80]);crearConfeti(25);coinRain(15);flashScreen('gold');showBigWinBanner('🎉 BIG WIN! 🎉');spawnParticles(cx,cy,35,{speed:10,size:6});document.body.classList.add('shake');setTimeout(()=>document.body.classList.remove('shake'),400);}
    else if(premio>=gameState.apuestaActual*10){SFX.win();vibrar([30,20,30]);flashScreen('teal');spawnParticles(cx,cy,20,{speed:7,size:5});showBigWinBanner('✨ WIN! ✨');}
    else{SFX.win();vibrar([30,20,30]);spawnParticles(cx,cy,10,{speed:5,size:4});}
    if(gameState.winStreak>=3)showComboMega(`🔥 ${gameState.winStreak}x STREAK! 🔥`);
    if(res.tieneWild)unlockAch('wildOne');
    if(gameState.apuestaActual===saldoBefore)unlockAch('allIn');
    const saldoAfter=gameState.saldo+premio;gameState.saldo+=premio;gameState.stats.totalWon+=premio;gameState.stats.totalWins++;
    if(res.scatterWin>0){gameState.saldo+=res.scatterWin;gameState.stats.totalWon+=res.scatterWin;premio+=res.scatterWin;}
    highlightScatters();gameState.winStreak++;
    if(premio>gameState.stats.biggestWin)gameState.stats.biggestWin=premio;
    if(gameState.winStreak>gameState.stats.bestStreak)gameState.stats.bestStreak=gameState.winStreak;
    gameState.expTotal+=premio;mostrarScore(`+${premio} 🪙`,cx,cy);animateSaldo(saldoBefore,saldoAfter);checkLevelUp();
    if(gameState.winStreak>=5&&!gameState.fruitFever)activateFever();checkSpinStreakRewards();
    if(Math.random()<0.05){gameState.mysteryBoxPendiente=true;setTimeout(()=>showMysteryBox(),1000);}
    if(premio>=gameState.apuestaActual*5)playWinTrack();else setTimeout(()=>{if(!gameState.girando&&!gameState.enBono&&!gameState.enGamble&&!gameState.fruitFever)startMusic(pickLoungeTrack());},800);
    setTimeout(()=>{gameState.girando=false;btn.disabled=false;updateHUD();guardar();if(res.aliensCount>=3)startBonus(res.aliensCount);else if(res.freeSpinsTriggered)triggerFreeSpins(res.scatters,res.wildCount);else if(!gameState.mysteryBoxPendiente&&premio>0&&!isFreeSpin)showGambleOption(premio);else if(isFreeSpin&&gameState.freeSpins>0)checkAutoSpin();else checkAutoSpin();checkChallenges();},1000);
  }else{
    gameState.winStreak=0;
    if(gameState.fruitFever){gameState.feverGiros--;if(gameState.feverGiros<=0)deactivateFever();}
    const nm=detectNearMiss();
    if(nm){showNearMiss(nm);SFX.nearMiss();flashScreen('purple');shakeReel(nm.linea[nm.posicion][0]);gameState.saldo+=5;mostrarScore('+5 🪙 (casi!)',window.innerWidth/2,window.innerHeight/2-40);enableShakeNudge();spawnParticles(window.innerWidth/2,window.innerHeight/2,8,{speed:4,size:3,colors:['#b366ff','#ffd700']});playTenseTrack();}
    else setTimeout(()=>{if(!gameState.girando&&!gameState.enBono&&!gameState.enGamble&&!gameState.fruitFever)startMusic(pickLoungeTrack());},500);
    setTimeout(()=>{spawnFruitCatcher();gameState.girando=false;btn.disabled=false;updateHUD();guardar();if(res.aliensCount>=3)startBonus(res.aliensCount);if(res.freeSpinsTriggered)triggerFreeSpins(res.scatters,res.wildCount);else if(isFreeSpin&&gameState.freeSpins>0)checkAutoSpin();else checkAutoSpin();},500);
  }
  if(gameState.winStreak>=5)setLayer(3);else if(gameState.winStreak>=3)setLayer(2);else if(gameState.stats.totalSpins>=1)setLayer(1);else setLayer(0);
  updateHUD();guardar();
}

// ==================== WIN HIGHLIGHT ====================
function highlightWins(resultados){
  const overlay=document.getElementById('winLineOverlay'),svg=document.getElementById('winLineSvg');
  svg.innerHTML='';
  const container=document.getElementById('reelsContainer'),cw=container.offsetWidth,ch=container.offsetHeight,pad=8;
  const reelW=(cw-pad*2-5*4)/5,symH=ch/3;
  for(const res of resultados){
    for(const [r,f] of res.linea.slice(0,res.cantidad)){const strip=document.getElementById('strip'+r),syms=strip.querySelectorAll('.reel-symbol');if(syms[f])syms[f].classList.add('win');}
    const pts=res.linea.slice(0,res.cantidad).map(([r,f])=>{const x=pad+r*(reelW+5)+reelW/2,y=symH*f+symH/2;return x+','+y;});
    if(pts.length>=2){const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');line.setAttribute('points',pts.join(' '));line.setAttribute('fill','none');line.setAttribute('stroke','var(--color-gold)');line.setAttribute('stroke-width','3');line.setAttribute('stroke-dasharray','8,4');line.style.animation='dashFlow 0.5s linear infinite';line.style.filter='drop-shadow(0 0 6px var(--color-gold))';svg.appendChild(line);}
  }
  overlay.classList.add('activo');
  setTimeout(()=>{document.querySelectorAll('.reel-symbol.win').forEach(el=>el.classList.remove('win'));overlay.classList.remove('activo');},2000);
}

// ==================== NUDGE ====================
let nudgeEnabled=false,nudgesUsed=0;
function enableNudge(){if(gameState.girando&&nudgesUsed<(gameState.upgrades.nudgePro?2:1)){nudgeEnabled=true;for(let i=0;i<5;i++)document.getElementById('reel'+i).classList.add('nudgeable');}}
function disableNudge(){nudgeEnabled=false;for(let i=0;i<5;i++)document.getElementById('reel'+i).classList.remove('nudgeable');}
function nudgeReel(idx){if(!nudgeEnabled)return;nudgesUsed++;nudgeEnabled=false;disableNudge();const reel=document.getElementById('reel'+idx);reel.classList.add('nudging');setTimeout(()=>reel.classList.remove('nudging'),300);const cur=gameState.carretes[idx];gameState.carretes[idx]=[genSim(),cur[0],cur[1]];renderReel(idx,gameState.carretes[idx]);SFX.nudge();vibrar(30);const rect=reel.getBoundingClientRect();spawnParticles(rect.left+rect.width/2,rect.top+rect.height/2,12,{speed:6,size:4,colors:['#00ff88','#ffd700','#ffffff']});shakeReel(idx);if(nudgesUsed<(gameState.upgrades.nudgePro?2:1))setTimeout(()=>{nudgeEnabled=true;enableNudge();},300);}

// ==================== SHAKE NUDGE ====================
let shakeNudgeAvail=false;
function enableShakeNudge(){shakeNudgeAvail=true;showToast('¡Casi! Toca 5x para nudge');let tc=0;const handler=(e)=>{if(e.target.closest('#toast')||e.target.closest('button'))return;tc++;if(tc>=5&&shakeNudgeAvail)doShakeNudge();};document.addEventListener('click',handler);setTimeout(()=>{shakeNudgeAvail=false;document.removeEventListener('click',handler);},3000);}
function doShakeNudge(){if(!shakeNudgeAvail)return;shakeNudgeAvail=false;const r=Math.floor(Math.random()*5);const cur=gameState.carretes[r];gameState.carretes[r]=[genSim(),cur[0],cur[1]];renderReel(r,gameState.carretes[r]);SFX.nudge();vibrar([30,20,50]);flashScreen('green');const reelEl=document.getElementById('reel'+r),rect=reelEl.getBoundingClientRect();spawnParticles(rect.left+rect.width/2,rect.top+rect.height/2,20,{speed:8,size:5,colors:['#00ff88','#ffd700','#ffffff']});shakeReel(r);const res=evalGiros();if(res.premioTotal>0){showToast('🎉 NUDGE WIN! +'+res.premioTotal+' 🪙');gameState.saldo+=res.premioTotal;gameState.stats.totalWon+=res.premioTotal;gameState.stats.totalWins++;gameState.winStreak=1;highlightWins(res.resultados);SFX.win();flashScreen('gold');spawnParticles(window.innerWidth/2,window.innerHeight/2,25,{speed:9,size:6});mostrarScore(`+${res.premioTotal} 🪙`,window.innerWidth/2,window.innerHeight/2);updateHUD();guardar();}}

// ==================== BONUS ROUND ====================
function startBonus(aliens){gameState.enBono=true;gameState.bonoIntentos=aliens-2;gameState.bonoPremios=0;gameState.stats.bonosTriggered++;unlockAch('bonusHunter');SFX.bonus();vibrar([100,50,100]);document.getElementById('bonus-screen').classList.add('activo');const border=document.getElementById('bonusBorder');border.innerHTML='';for(const item of[...BONUS_SYMS,'EXIT']){const div=document.createElement('div');div.className='bonus-border-item'+(item==='EXIT'?' exit':'');div.textContent=item==='EXIT'?'EXIT':item;div.dataset.symbol=item;border.appendChild(div);}startMusic('bonus');updateBonusHUD();setTimeout(()=>doBonusSpin(),1000);}
function updateBonusHUD(){let s='';for(let i=0;i<gameState.bonoIntentos;i++)s+='⭐';document.getElementById('bonusIntentos').textContent='Intentos: '+s;document.getElementById('bonusPremios').textContent='Premios: 🪙 '+gameState.bonoPremios;}
async function doBonusSpin(){
  if(gameState.bonoIntentos<=0){endBonus();return;}
  const items=document.querySelectorAll('.bonus-border-item');let idx=0;
  const illum=setInterval(()=>{items.forEach(el=>el.classList.remove('iluminado'));items[idx%items.length].classList.add('iluminado');idx++;},200);
  const brs=[document.getElementById('br0'),document.getElementById('br1'),document.getElementById('br2')];
  brs.forEach(el=>{el.textContent='?';el.classList.remove('match');});
  const spinInt=setInterval(()=>{brs.forEach(el=>el.textContent=BONUS_SYMS[Math.floor(Math.random()*BONUS_SYMS.length)]);},80);
  await new Promise(r=>setTimeout(r,1500));clearInterval(spinInt);clearInterval(illum);
  const finals=BONUS_SYMS.map(()=>BONUS_SYMS[Math.floor(Math.random()*BONUS_SYMS.length)]);
  brs.forEach((el,i)=>el.textContent=finals[i]);
  const litIdx=Math.random()<0.85?Math.floor(Math.random()*(items.length-1)):items.length-1;
  items.forEach(el=>el.classList.remove('iluminado'));items[litIdx].classList.add('iluminado');
  const litSym=items[litIdx].dataset.symbol;SFX.reelStop();vibrar(20);
  await new Promise(r=>setTimeout(r,500));
  if(litSym==='EXIT'){if(gameState.upgrades.streakSaver){showToast('Streak Saver activado!');gameState.upgrades.streakSaver=false;}else{gameState.bonoIntentos--;showToast('EXIT - Pierde un intento');SFX.gambleLoss();}}
  else{let matched=false;brs.forEach(el=>{if(el.textContent===litSym){el.classList.add('match');matched=true;}});if(matched){const mult=BONUS_MULT[litSym]||2,premio=gameState.apuestaActual*mult;gameState.bonoPremios+=premio;gameState.saldo+=premio;gameState.stats.totalWon+=premio;SFX.win();vibrar([30,20,30]);flashScreen('green');spawnParticles(window.innerWidth/2,window.innerHeight/2,25,{speed:8,size:6,colors:['#00ff88','#ffd700','#ffffff']});showToast(`${litSym} match! +${premio} 🪙`);mostrarScore(`+${premio} 🪙`,window.innerWidth/2,window.innerHeight/2);if(gameState.bonoPremios>=1000)unlockAch('bonusMaster');}else{showToast('No match');flashScreen('purple');}}
  updateBonusHUD();updateHUD();guardar();setTimeout(()=>doBonusSpin(),1500);
}
function endBonus(){gameState.enBono=false;document.getElementById('bonus-screen').classList.remove('activo');showToast(`Bono terminado: +${gameState.bonoPremios} 🪙`);startMusic(pickLoungeTrack());guardar();setTimeout(()=>checkAutoSpin(),1000);}

// ==================== GAMBLE ====================
let gamblePremioOrig=0,gambleConsWins=0,gambleTimerTO=null,gambleCountdownTO=null;
function clearGambleTimer(){if(gambleTimerTO){clearTimeout(gambleTimerTO);gambleTimerTO=null;}if(gambleCountdownTO){clearInterval(gambleCountdownTO);gambleCountdownTO=null;}}
function showGambleOption(premio){if(premio<=0||gameState.enBono)return;gamblePremioOrig=premio;gameState.gamblePremioAcumulado=premio;gameState.gambleRondas=0;gambleConsWins=0;clearGambleTimer();const toast=document.getElementById('toast');toast.classList.remove('closing','gamble-toast');void toast.offsetWidth;toast.innerHTML=`<div class="gamble-toast-title">🃏 ¿DOBLE O NADA?</div><div class="gamble-toast-amount">Premio en juego: ${premio} 🪙</div><div class="gamble-toast-buttons"><button class="gamble-btn" style="background:var(--green);color:var(--bg)" onclick="clearGambleTimer();startGamble()">SÍ 🎴</button><button class="gamble-btn" style="background:var(--pink);color:white" onclick="clearGambleTimer();declineGamble()">NO ✖</button></div><div class="gamble-timer-text" id="gambleTimerText">⏱ 5s</div><div class="gamble-timer-bar" id="gambleTimerBar"></div>`;toast.classList.add('activo','gamble-toast');let secs=5;const timerText=document.getElementById('gambleTimerText');gambleCountdownTO=setInterval(()=>{secs--;if(timerText){timerText.textContent=`⏱ ${secs}s`;}if(secs<=2&&timerText){timerText.classList.add('urgent');}if(secs<=0){clearGambleTimer();}},1000);gambleTimerTO=setTimeout(()=>{const t=document.getElementById('toast');if(t.classList.contains('activo')&&!gameState.enGamble){t.classList.add('closing');SFX.gambleLoss();vibrar(60);setTimeout(()=>{t.classList.remove('activo','closing','gamble-toast');checkAutoSpin();},400);}},5000);}
function startGamble(){hideToast();gameState.enGamble=true;gameState.gambleRondas=1;gameState.gamblePremioAcumulado=gamblePremioOrig;document.getElementById('gamble-screen').classList.add('activo');startMusic('gamble');renderGambleCards();updateGambleHUD();}
function renderGambleCards(){const c=document.getElementById('gambleCards');c.innerHTML='';const dv=2+Math.floor(Math.random()*13);const ds=['♥','♦','♠','♣'][Math.floor(Math.random()*4)];const dc=document.createElement('div');dc.className='gamble-card crupier';dc.textContent=cardEmoji(dv)+ds;dc.dataset.value=dv;c.appendChild(dc);for(let i=0;i<4;i++){const card=document.createElement('div');card.className='gamble-card carta-boca';card.textContent='🂠';card.dataset.index=i;card.onclick=()=>selectGambleCard(dv,card);c.appendChild(card);}}
function cardEmoji(v){if(v<=10)return v.toString();return{11:'J',12:'Q',13:'K',14:'A'}[v];}
function selectGambleCard(dealerVal,cardEl){const cards=document.querySelectorAll('.gamble-card:not(.crupier)');cards.forEach(c=>{c.onclick=null;c.classList.remove('carta-boca');});const pv=2+Math.floor(Math.random()*13);const suit=['♥','♦','♠','♣'][Math.floor(Math.random()*4)];cardEl.textContent=cardEmoji(pv)+suit;cardEl.classList.add('revelada');SFX.gambleCard();vibrar(30);setTimeout(()=>{if(pv>dealerVal){cardEl.classList.add('ganadora');gameState.gamblePremioAcumulado*=2;gameState.stats.gambleWins++;gambleConsWins++;SFX.gambleWin();vibrar([30,20,50]);if(gambleConsWins>=5)unlockAch('doubleDown');gameState.gambleRondas++;if(gameState.gambleRondas>=5){showToast('¡5 rondas ganadas! Auto-cobro');setTimeout(()=>cobrarGamble(),1500);}else{updateGambleHUD();setTimeout(()=>{renderGambleCards();updateGambleHUD();},1500);}}else if(pv===dealerVal){if(gameState.upgrades.insurance){showToast('Empate - Insurance: recuperas');cardEl.classList.add('ganadora');SFX.gambleWin();setTimeout(()=>cobrarGamble(),1500);}else{cardEl.classList.add('perdedora');gameState.stats.gambleLosses++;SFX.gambleLoss();vibrar(100);showToast('Empate = pierde');setTimeout(()=>endGamble(false),1500);}}else{cardEl.classList.add('perdedora');gameState.stats.gambleLosses++;SFX.gambleLoss();vibrar(100);showToast('Pierde todo');setTimeout(()=>endGamble(false),1500);}},800);}
function updateGambleHUD(){document.getElementById('gamblePremio').textContent='🪙 '+gameState.gamblePremioAcumulado;document.getElementById('gambleRonda').textContent=`Ronda ${gameState.gambleRondas}/5`;}
function cobrarGamble(){endGamble(true);}
function declineGamble(){hideToast();checkAutoSpin();}
function endGamble(cobrado){gameState.enGamble=false;document.getElementById('gamble-screen').classList.remove('activo');if(cobrado){const extra=gameState.gamblePremioAcumulado-gamblePremioOrig;gameState.saldo+=extra;gameState.stats.totalWon+=extra;showToast(`Cobrado: +${gameState.gamblePremioAcumulado} 🪙`);mostrarScore(`+${gameState.gamblePremioAcumulado} 🪙`,window.innerWidth/2,window.innerHeight/2);}else{gameState.saldo-=gamblePremioOrig;if(gameState.saldo<0)gameState.saldo=0;}gambleConsWins=0;startMusic(pickLoungeTrack());updateHUD();guardar();setTimeout(()=>checkAutoSpin(),1000);}

// ==================== FRUIT GARDEN ====================
let frutasFlotantes=[],fruitGardenInt=null;
function startFruitGarden(){if(fruitGardenInt)clearInterval(fruitGardenInt);fruitGardenInt=setInterval(()=>{if(gameState.girando||gameState.enBono||gameState.enGamble)return;const max=gameState.upgrades.fruitSprinkler?5:3;if(frutasFlotantes.length>=max)return;const count=1+Math.floor(Math.random()*Math.min(3,max-frutasFlotantes.length));for(let i=0;i<count;i++)spawnFrutaFlotante();},3000);}
function spawnFrutaFlotante(){const golden=Math.random()<0.05;const emojis=['🫐','🍇','🍄','🌺','🔮','💎'];const emoji=golden?'⭐':emojis[Math.floor(Math.random()*emojis.length)];const el=document.createElement('div');el.className='fruta-flotante'+(golden?' dorada':'');el.textContent=emoji;const x=20+Math.random()*(window.innerWidth-70),y=120+Math.random()*(window.innerHeight-300);el.style.left=x+'px';el.style.top=y+'px';const data={el,x,y,vx:(Math.random()-0.5)*2,vy:(Math.random()-0.5)*2,golden,emoji};el.onclick=()=>catchFrutaFlotante(data);document.body.appendChild(el);frutasFlotantes.push(data);setTimeout(()=>removeFrutaFlotante(data),5000);}
function catchFrutaFlotante(data){if(!data.el)return;let val=data.golden?50:(1+Math.floor(Math.random()*5));if(gameState.upgrades.goldenTouch)val*=2;gameState.saldo+=val;SFX.tapFruit();vibrar(20);mostrarScore(`+${val} 🪙`,data.x,data.y);removeFrutaFlotante(data);updateHUD();guardar();}
function removeFrutaFlotante(data){if(data.el&&data.el.parentNode)data.el.parentNode.removeChild(data.el);const i=frutasFlotantes.indexOf(data);if(i>=0)frutasFlotantes.splice(i,1);}
function updateFrutas(){for(const f of frutasFlotantes){if(!f.el)continue;f.x+=f.vx;f.y+=f.vy;if(f.x<10||f.x>window.innerWidth-42)f.vx*=-1;if(f.y<110||f.y>window.innerHeight-200)f.vy*=-1;f.el.style.left=f.x+'px';f.el.style.top=f.y+'px';}requestAnimationFrame(updateFrutas);}

// ==================== FRUIT CATCHER ====================
function spawnFruitCatcher(){if(gameState.enBono||gameState.enGamble)return;const emojis=['🫐','🍇','🍄','🌺','🔮','💎'];let caught=0;for(let i=0;i<3;i++){setTimeout(()=>{if(gameState.girando)return;const emoji=emojis[Math.floor(Math.random()*emojis.length)];const el=document.createElement('div');el.className='fruta-cayendo';el.textContent=emoji;const x=30+Math.random()*(window.innerWidth-60);el.style.left=x+'px';el.style.top='80px';let y=80,vy=2,caughtThis=false;el.onclick=()=>{if(caughtThis)return;caughtThis=true;caught++;let val=gameState.upgrades.catchMaster?6:(2+Math.floor(Math.random()*9));gameState.saldo+=val;gameState.stats.fruitsCaught++;SFX.tapFruit();vibrar(20);mostrarScore(`+${val} 🪙`,x,y);if(el.parentNode)el.parentNode.removeChild(el);if(caught>=3){gameState.saldo+=20;showToast('Perfect Catch! +20 🪙');mostrarScore('+20 🪙',window.innerWidth/2,window.innerHeight/2);}updateHUD();guardar();};document.body.appendChild(el);const fall=setInterval(()=>{y+=vy;vy+=0.3;el.style.top=y+'px';if(y>window.innerHeight){clearInterval(fall);if(el.parentNode)el.parentNode.removeChild(el);}},16);setTimeout(()=>clearInterval(fall),2000);},i*200);}}

// ==================== TAP COMBO ====================
let tapComboTO=null;
function handleTapCombo(e){if(!gameState.girando)return;gameState.tapCombo++;const d=document.getElementById('tapCombo');d.textContent=`🫳 x${gameState.tapCombo}`;d.classList.add('activo','punch');setTimeout(()=>d.classList.remove('punch'),200);if(tapComboTO)clearTimeout(tapComboTO);tapComboTO=setTimeout(()=>d.classList.remove('activo'),500);const x=e.clientX||(window.innerWidth/2),y=e.clientY||(window.innerHeight/2);const count=Math.min(gameState.tapCombo,15);spawnParticles(x,y,count,{speed:5,size:4,colors:['#ffd700','#ff6b35','#00ff88','#ffffff']});if(gameState.tapCombo===10)showComboMega('🫳 10x COMBO! 🫳');else if(gameState.tapCombo===20)showComboMega('🔥 20x MEGA COMBO! 🔥');else if(gameState.tapCombo===50)showComboMega('⚡ 50x ULTRA COMBO! ⚡');}

// ==================== FRUIT FEVER ====================
function activateFever(){gameState.fruitFever=true;gameState.feverGiros=10;document.getElementById('feverBanner').classList.add('activo');document.getElementById('reelsContainer').classList.add('fever');document.getElementById('vignette').classList.add('fever');SFX.feverMode();vibrar([50,30,50,30,50]);flashScreen('red');coinRain(20);lightning();spawnParticles(window.innerWidth/2,window.innerHeight/2,40,{speed:10,size:7,colors:['#ff3399','#ff6b35','#ffd700','#ffffff']});showBigWinBanner('🔥 COSMIC FEVER! 🔥');showToast('🔥 COSMIC FEVER! Multiplicadores x2');startMusic('fever');}
function deactivateFever(){gameState.fruitFever=false;gameState.feverGiros=0;document.getElementById('feverBanner').classList.remove('activo');document.getElementById('reelsContainer').classList.remove('fever');document.getElementById('vignette').classList.remove('fever');showToast('Cosmic Fever terminado');startMusic(pickLoungeTrack());}

// ==================== MYSTERY BOX ====================
function showMysteryBox(){gameState.mysteryBoxPendiente=false;const screen=document.getElementById('mystery-screen');screen.classList.add('activo');const box=document.getElementById('mysteryBox'),result=document.getElementById('mysteryResult'),hint=document.getElementById('mysteryHint'),rays=document.querySelector('.mystery-glow'),contBtn=document.getElementById('mysteryContinue');result.style.display='none';contBtn.style.display='none';box.style.display='block';box.className='mystery-box';hint.style.display='block';hint.textContent='👆 Toca para abrir';let charged=false;box.onclick=()=>{if(!charged){charged=true;box.classList.add('charging');hint.textContent='⚡ Cargando... toca de nuevo!';SFX.mystery();vibrar(20);for(let i=0;i<8;i++){const p=document.createElement('div');p.style.cssText='position:absolute;width:6px;height:6px;background:var(--teal);border-radius:50%;left:50%;top:50%;transition:all 0.6s ease-out';screen.appendChild(p);requestAnimationFrame(()=>{const ang=(i/8)*Math.PI*2,dist=80;p.style.transform=`translate(${Math.cos(ang)*dist}px,${Math.sin(ang)*dist}px) scale(0)`;});setTimeout(()=>p.remove(),700);}return;}box.classList.remove('charging');box.classList.add('exploding');hint.style.display='none';SFX.mystery();vibrar([30,20,50,30,80]);const roll=Math.random();let txt='',icon='',rarity='common';const cx=window.innerWidth/2,cy=window.innerHeight/2;if(roll<0.40){const c=50+Math.floor(Math.random()*151);gameState.saldo+=c;txt=`+${c} 🪙`;icon='🪙';rarity='common';flashScreen('gold');spawnParticles(cx,cy,15,{speed:6,size:5});}else if(roll<0.65){txt='Multiplicador x2 por 5 giros';icon='🔥';rarity='rare';gameState.fruitFever=true;gameState.feverGiros=5;document.getElementById('feverBanner').classList.add('activo');document.getElementById('reelsContainer').classList.add('fever');flashScreen('red');lightning();}else if(roll<0.85){const av=UPGRADES_DATA.filter(u=>!gameState.upgrades[u.key]);if(av.length>0){const u=av[Math.floor(Math.random()*av.length)];gameState.upgrades[u.key]=true;txt=`Upgrade: ${u.name}!`;icon=u.icon||'⚙️';rarity='epic';flashScreen('purple');spawnParticles(cx,cy,20,{speed:7,size:6,colors:['#b366ff','#ffd700','#ffffff']});}else{gameState.saldo+=200;txt='+200 🪙';icon='🪙';rarity='common';flashScreen('gold');spawnParticles(cx,cy,15,{speed:6,size:5});}}else if(roll<0.95){const c=500+Math.floor(Math.random()*501);gameState.saldo+=c;txt=`+${c} 🪙`;icon='💰';rarity='legendary';flashScreen('gold');coinRain(15);spawnParticles(cx,cy,25,{speed:9,size:6});}else if(roll<0.99){txt='GOLDEN HOUR! Todo x3 por 10 giros';icon='🌟';rarity='legendary';gameState.fruitFever=true;gameState.feverGiros=10;document.getElementById('feverBanner').classList.add('activo');document.getElementById('reelsContainer').classList.add('fever');flashScreen('gold');lightning();coinRain(25);showBigWinBanner('🌟 GOLDEN HOUR! 🌟');spawnParticles(cx,cy,40,{speed:12,size:8,colors:['#ffd700','#ff6b35','#ffffff']});}else{gameState.saldo+=5000;txt='MEGA JACKPOT! +5000 🪙';icon='💎';rarity='mythic';SFX.jackpot();crearConfeti(40);coinRain(40);lightning();showJackpotZoom();flashScreen('gold');spawnParticles(cx,cy,60,{speed:14,size:9,colors:['#ffd700','#ff6b35','#ff3399','#ffffff']});}result.innerHTML=`<span class="mystery-result-icon">${icon}</span>${txt}`;result.className='mystery-result rarity-'+rarity;result.style.display='block';updateHUD();guardar();contBtn.style.display='block';contBtn.onclick=()=>screen.classList.remove('activo');};}

// ==================== SPIN STREAK REWARDS ====================
function checkSpinStreakRewards(){const rw={10:50,25:100,50:250,100:500,200:1000};if(rw[gameState.spinStreak]){const r=rw[gameState.spinStreak];gameState.saldo+=r;showToast(`🎯 Spin streak ${gameState.spinStreak}: +${r} 🪙`);}}

// ==================== FREE SPINS ====================
function triggerFreeSpins(scatters,wildCount){const spins=scatters>=3?5+scatters:5;gameState.freeSpins+=spins;gameState.stats.freeSpinsWon+=spins;if(scatters>=3)gameState.stats.scatterTriggered++;updateFreeSpinsBanner();SFX.bonus();vibrar([50,30,50,30,80]);flashScreen('purple');showBigWinBanner(`🎰 ${spins} FREE SPINS! 🎰`);spawnParticles(window.innerWidth/2,window.innerHeight/2,30,{speed:8,size:6,colors:['#b366ff','#ffd700','#ffffff']});showToast(`🌟 ${scatters>=3?scatters+' Scatters':'3+ Wilds'} → ${spins} giros gratis (x${gameState.freeSpinsMult})!`);unlockAch('scatterKing');guardar();}
function updateFreeSpinsBanner(){const b=document.getElementById('freespinsBanner'),c=document.getElementById('freespinsCount');if(gameState.freeSpins>0){b.classList.add('activo');c.textContent=gameState.freeSpins;}else{b.classList.remove('activo');}}

// ==================== JACKPOT PROGRESIVO ====================
function updateJackpotDisplay(){const el=document.getElementById('jackpotAmount');if(el)el.textContent='🪙 '+gameState.jackpotProgresivo.toLocaleString();}

// ==================== SCATTER HIGHLIGHT ====================
function highlightScatters(){for(let r=0;r<5;r++){const strip=document.getElementById('strip'+r),syms=strip.querySelectorAll('.reel-symbol');for(let f=0;f<3;f++){if(gameState.carretes[r][f]&&gameState.carretes[r][f].scatter&&syms[f])syms[f].classList.add('scatter-win');}}setTimeout(()=>document.querySelectorAll('.reel-symbol.scatter-win').forEach(el=>el.classList.remove('scatter-win')),2500);}

// ==================== PRESTIGE ====================
function canPrestige(){return gameState.nivel>=5&&gameState.expTotal>=100000;}
function doPrestige(){if(!canPrestige())return;gameState.prestigio++;gameState.prestigeMult=1+gameState.prestigio*0.5;gameState.stats.prestiges++;gameState.saldo=1000;gameState.nivel=1;gameState.expTotal=0;gameState.upgrades={};gameState.achievements=[];gameState.spinStreak=0;gameState.winStreak=0;gameState.jackpotProgresivo=5000;guardar();updateHUD();updateJackpotDisplay();SFX.jackpot();vibrar([100,50,100,50,100,50,200]);crearConfeti(60);coinRain(40);lightning();flashScreen('purple');showBigWinBanner(`⭐ PRESTIGIO ${gameState.prestigio}! x${gameState.prestigeMult} permanente ⭐`);spawnParticles(window.innerWidth/2,window.innerHeight/2,60,{speed:12,size:8,colors:['#b366ff','#ffd700','#ff3399','#ffffff']});showToast(`⭐ Prestigio ${gameState.prestigio}! Multiplicador permanente x${gameState.prestigeMult}`);unlockAch('prestige');}

// ==================== DAILY CHALLENGES ====================
function checkDailyChallenges(){const today=new Date().toDateString();if(gameState.challengesDate!==today){const pool=[...CHALLENGES_POOL];const picked=[];for(let i=0;i<3&&pool.length>0;i++){const idx=Math.floor(Math.random()*pool.length);picked.push({...pool[idx],completed:false,claimed:false});pool.splice(idx,1);}gameState.challenges=picked;gameState.challengesDate=today;guardar();}}
function checkChallenges(){if(!gameState.challenges||gameState.challenges.length===0)return;let completedCount=0;for(const ch of gameState.challenges){if(!ch.completed&&ch.check(gameState)){ch.completed=true;gameState.saldo+=ch.reward;showToast(`🎯 Reto completado: ${ch.name} +${ch.reward} 🪙`);SFX.coin();vibrar([30,20,30]);}if(ch.completed)completedCount++;}if(completedCount>=10&&!gameState.achievements.includes('challengeMaster'))unlockAch('challengeMaster');updateHUD();guardar();}
function renderChallenges(){checkDailyChallenges();const list=document.getElementById('challengesList');list.innerHTML='';for(const ch of gameState.challenges){const item=document.createElement('div');item.className='challenge-item'+(ch.completed?' completado':'');let progress=0;if(ch.type==='winStreak')progress=Math.min(100,(gameState.winStreak/ch.target)*100);else if(ch.type==='bonus')progress=Math.min(100,(gameState.stats.bonosTriggered/ch.target)*100);else if(ch.type==='catch')progress=Math.min(100,(gameState.stats.fruitsCaught/ch.target)*100);else if(ch.type==='spins')progress=Math.min(100,(gameState.stats.totalSpins/ch.target)*100);else if(ch.type==='bigwin')progress=gameState.stats.biggestWin>=gameState.apuestaActual*10?100:Math.min(100,(gameState.stats.biggestWin/(gameState.apuestaActual*10))*100);else if(ch.type==='gamble')progress=Math.min(100,((gameState.stats.gambleWins+gameState.stats.gambleLosses)/ch.target)*100);else if(ch.type==='jackpot')progress=Math.min(100,(gameState.stats.jackpots/ch.target)*100);else if(ch.type==='scatter')progress=Math.min(100,(gameState.stats.scatterTriggered/ch.target)*100);else if(ch.type==='level')progress=Math.min(100,(gameState.nivel/ch.target)*100);else if(ch.type==='freespins')progress=Math.min(100,(gameState.stats.freeSpinsWon/ch.target)*100);item.innerHTML=`<div class="challenge-icon">${ch.icon}</div><div class="challenge-info"><div class="challenge-name">${ch.name}</div><div class="challenge-desc">${ch.desc}</div><div class="challenge-progress-bar"><div class="challenge-progress-fill" style="width:${progress}%"></div></div></div><div class="challenge-reward${ch.completed?' claimed':''}">${ch.completed?'✅':'+'+ch.reward+' 🪙'}</div>`;list.appendChild(item);}}

// ==================== ACHIEVEMENT POPUP ====================
function showAchPopup(ach){const popup=document.getElementById('achPopup');document.getElementById('achPopupIcon').textContent=ach.emoji;document.getElementById('achPopupName').textContent=ach.name;document.getElementById('achPopupReward').textContent='+'+ach.premio+' 🪙';popup.classList.remove('closing');popup.classList.add('activo');setTimeout(()=>{popup.classList.add('closing');setTimeout(()=>{popup.classList.remove('activo','closing');},400);},3500);}

// ==================== VOLUME CONTROL ====================
function setVolume(v){gameState.volume=v;if(masterGain)masterGain.gain.value=v/100;const btn=document.getElementById('btnSonido');if(btn)btn.textContent=v==0?'🔇':v<30?'🔈':v<70?'🔉':'🔊';guardar();}

// ==================== TUTORIAL ====================
const TUTORIAL_STEPS=[
  {icon:'🪐',title:'¡Bienvenido a Cosmic Fruit!',text:'Gira los <b>5 carretes</b> y consigue combinaciones de símbolos alienígenas iguales para ganar premios.'},
  {icon:'🎯',title:'Líneas y Pagos',text:'Hay <b>5 líneas</b> con pago <b>bidireccional</b> (izq→der y der→izq). 3+ símbolos iguales = premio. Mira la <b>📋 Tabla de Pagos</b>.'},
  {icon:'🪐',title:'Símbolos Especiales',text:'<b>🪐 Wild</b> sustituye cualquier símbolo. <b>👽 Bonus</b> activa ronda alien. <b>🌟 Scatter</b> da giros gratis!'},
  {icon:'⚡',title:'Upgrades y Logros',text:'Compra <b>mejoras permanentes</b> con tus monedas. Desbloquea <b>logros</b> para ganar premios extra.'},
  {icon:'🃏',title:'Doble o Nada',text:'Tras cada premio, puedes arriesgarlo todo en el <b>doble o nada</b>. ¡Pero cuidado, puedes perderlo!'},
  {icon:'🎯',title:'Retos Diarios',text:'Completa <b>3 retos cada día</b> para ganar monedas extra. ¡Vuelven cada 24 horas!'},
];
let tutorialStep=0;
function showTutorial(){if(gameState.tutorialVisto)return;const overlay=document.getElementById('tutorial-overlay');overlay.classList.add('activo');renderTutorialStep();}
function renderTutorialStep(){const s=TUTORIAL_STEPS[tutorialStep];document.getElementById('tutorialIcon').textContent=s.icon;document.getElementById('tutorialTitle').textContent=s.title;document.getElementById('tutorialText').innerHTML=s.text;document.getElementById('tutorialBtn').textContent=tutorialStep===TUTORIAL_STEPS.length-1?'¡Jugar!':'Siguiente';const dots=document.getElementById('tutorialDots');dots.innerHTML='';for(let i=0;i<TUTORIAL_STEPS.length;i++){const d=document.createElement('div');d.className='tutorial-dot'+(i===tutorialStep?' activo':'');dots.appendChild(d);}}
function nextTutorialStep(){tutorialStep++;if(tutorialStep>=TUTORIAL_STEPS.length){document.getElementById('tutorial-overlay').classList.remove('activo');gameState.tutorialVisto=true;guardar();}else{renderTutorialStep();}}

// ==================== RTP CALC ====================
function getRTP(){if(gameState.stats.totalBet===0)return 0;return Math.round((gameState.stats.totalWon/gameState.stats.totalBet)*100);}

// ==================== LEVELS ====================
const NIVELES=[{n:1,exp:0},{n:2,exp:5000},{n:3,exp:20000},{n:4,exp:50000},{n:5,exp:100000}];
function getNivel(exp){let n=1;for(const nv of NIVELES)if(exp>=nv.exp)n=nv.n;return n;}
function checkLevelUp(){const nn=getNivel(gameState.expTotal);if(nn>gameState.nivel){gameState.nivel=nn;const unlocks={2:'Apuesta máx 500',3:'+1 línea extra',4:'Auto-spin',5:'Turbo mode'};showToast(`🎉 Nivel ${nn}! ${unlocks[nn]||''}`);SFX.bigWin();vibrar([50,30,50,30,80]);crearConfeti(15);}}

// ==================== ACHIEVEMENTS ====================
function unlockAch(id){if(gameState.achievements.includes(id))return;const ach=ACHIEVEMENTS_DATA.find(a=>a.id===id);if(!ach)return;gameState.achievements.push(id);gameState.saldo+=ach.premio;showToast(`🏆 ${ach.name}: +${ach.premio} 🪙`);showAchPopup(ach);SFX.coin();vibrar([30,20,30]);updateHUD();guardar();}
function checkAllAch(){for(const ach of ACHIEVEMENTS_DATA)if(!gameState.achievements.includes(ach.id)&&ach.check(gameState))unlockAch(ach.id);}

// ==================== DAILY LOGIN ====================
function checkDailyLogin(){const today=new Date().toDateString();if(gameState.ultimoLogin===today)return;const yesterday=new Date(Date.now()-86400000).toDateString();gameState.loginStreak=gameState.ultimoLogin===yesterday?gameState.loginStreak+1:1;gameState.ultimoLogin=today;const rewards=[50,75,100,150,200,300,500];const reward=rewards[Math.min(gameState.loginStreak-1,6)];gameState.saldo+=reward;const el=document.getElementById('loginBonus');el.textContent=`🔥 Login streak: ${gameState.loginStreak} días → +${reward} 🪙`;setTimeout(()=>{el.textContent='';},5000);guardar();}

// ==================== VISUAL EFFECTS ====================
function mostrarScore(txt,x,y){const el=document.createElement('div');el.className='score-flotante';el.textContent=txt;el.style.left=(x-40)+'px';el.style.top=y+'px';el.style.color='var(--gold)';document.body.appendChild(el);setTimeout(()=>el.remove(),1000);}
function crearConfeti(n){const emojis=['🫐','🍇','🍄','🌺','🔮','💎','🪐','🌟','👽','🪙','⭐','🎉'];for(let i=0;i<n;i++){const el=document.createElement('div');el.className='confeti-piece';el.textContent=emojis[Math.floor(Math.random()*emojis.length)];el.style.left=Math.random()*window.innerWidth+'px';el.style.top='-20px';el.style.animationDelay=Math.random()*0.5+'s';document.body.appendChild(el);setTimeout(()=>el.remove(),2500);}}
function showNearMiss(nm){const el=document.createElement('div');el.className='near-miss';el.textContent=`¡CASI! 4/5 ${nm.simbolo.emoji}`;document.body.appendChild(el);setTimeout(()=>el.remove(),2000);const [r,f]=nm.linea[nm.posicion];const strip=document.getElementById('strip'+r),syms=strip.querySelectorAll('.reel-symbol');if(syms[f])syms[f].classList.add('near');setTimeout(()=>document.querySelectorAll('.reel-symbol.near').forEach(el=>el.classList.remove('near')),2000);}

// ==================== TOAST ====================
let toastTO=null;
function showToast(msg){const t=document.getElementById('toast');t.innerHTML=msg;t.classList.add('activo');if(toastTO)clearTimeout(toastTO);toastTO=setTimeout(()=>t.classList.remove('activo'),3000);}
function hideToast(){clearGambleTimer();const t=document.getElementById('toast');t.classList.remove('activo','closing','gamble-toast');}

// ==================== HUD ====================
function updateHUD(){document.getElementById('hudSaldo').textContent='🪙 '+gameState.saldo;document.getElementById('hudNivel').textContent='Nv '+gameState.nivel;document.getElementById('hudSpins').textContent='🎯 '+gameState.spinStreak;document.getElementById('apuestaValor').textContent=gameState.apuestaActual;document.getElementById('saldoInicio').textContent='🪙 '+gameState.saldo;const curLevel=NIVELES.find(n=>n.n===gameState.nivel),nextLevel=NIVELES.find(n=>n.n===gameState.nivel+1);if(curLevel&&nextLevel){const pct=((gameState.expTotal-curLevel.exp)/(nextLevel.exp-curLevel.exp))*100;document.getElementById('levelBarFill').style.width=Math.min(100,Math.max(0,pct))+'%';}else{document.getElementById('levelBarFill').style.width='100%';}document.querySelectorAll('.bet-btn').forEach(btn=>{const bet=btn.dataset.bet;if(bet==='all')btn.classList.toggle('activo',gameState.apuestaActual===gameState.saldo);else btn.classList.toggle('activo',gameState.apuestaActual===parseInt(bet));const v=bet==='all'?gameState.saldo:parseInt(bet);btn.disabled=v>gameState.saldo||v<=0;});document.getElementById('btnAuto').classList.toggle('activo',gameState.autoSpin);document.getElementById('btnTurbo').classList.toggle('activo',gameState.turboMode);}

// ==================== AUTO SPIN ====================
function checkAutoSpin(){if(gameState.freeSpins>0){setTimeout(()=>{if(!gameState.girando&&!gameState.enBono&&!gameState.enGamble)doSpin();},500);}else if(gameState.autoSpin&&gameState.saldo>=gameState.apuestaActual){setTimeout(()=>{if(gameState.autoSpin&&!gameState.girando&&!gameState.enBono&&!gameState.enGamble)doSpin();},500);}else if(gameState.autoSpin&&gameState.saldo<gameState.apuestaActual){gameState.autoSpin=false;updateHUD();}}

// ==================== PAYTABLE RENDER ====================
function renderPaytable(){const g=document.getElementById('paytableGrid');g.innerHTML='';for(const sym of SIMBOLOS){let tier='tier-1';if(sym.wild||sym.bonus)tier='tier-special';else if(sym.mult&&sym.mult[5]>=100)tier='tier-3';else if(sym.mult&&sym.mult[5]>=20)tier='tier-2';const card=document.createElement('div');card.className='paytable-card '+tier;const emoji=document.createElement('div');emoji.className='paytable-card-emoji';emoji.textContent=sym.emoji;const info=document.createElement('div');info.className='paytable-card-info';const name=document.createElement('div');name.className='paytable-card-name';name.textContent=sym.nombre;if(sym.wild){const tag=document.createElement('span');tag.className='paytable-card-tag wild';tag.textContent='WILD';name.appendChild(tag);}if(sym.bonus){const tag=document.createElement('span');tag.className='paytable-card-tag bonus';tag.textContent='BONUS';name.appendChild(tag);}if(sym.scatter){const tag=document.createElement('span');tag.className='paytable-card-tag scatter';tag.textContent='SCATTER';name.appendChild(tag);}info.appendChild(name);const mults=document.createElement('div');mults.className='paytable-card-mults';for(const c of[3,4,5]){const m=document.createElement('div');m.className='paytable-card-mult';const lbl=document.createElement('div');lbl.className='label';lbl.textContent='x'+c;const val=document.createElement('div');val.className='val';if(sym.mult){val.textContent='x'+sym.mult[c];}else if(sym.bonus){val.textContent='BONO';val.className='val special';}else{val.textContent='—';}m.appendChild(lbl);m.appendChild(val);mults.appendChild(m);}info.appendChild(mults);card.appendChild(emoji);card.appendChild(info);g.appendChild(card);}}

// ==================== UPGRADES RENDER ====================
function renderUpgrades(){const list=document.getElementById('upgradesList');list.innerHTML='';for(const up of UPGRADES_DATA){const comprado=gameState.upgrades[up.key],canAfford=gameState.saldo>=up.costo;const item=document.createElement('div');item.className='upgrade-item'+(comprado?' comprado':canAfford?' affordable':'');item.innerHTML=`<div class="upgrade-icon">${up.icon||'⚙️'}</div><div class="upgrade-info"><div class="upgrade-name">${up.name}</div><div class="upgrade-desc">${up.desc}</div></div><button class="upgrade-buy${comprado?' comprado':!canAfford?' cant-afford':''}" ${comprado||!canAfford?'disabled':''} data-key="${up.key}" data-costo="${up.costo}">${comprado?'✓':'🪙 '+up.costo}</button>`;list.appendChild(item);}list.querySelectorAll('.upgrade-buy:not(.comprado):not(:disabled)').forEach(btn=>{btn.onclick=()=>{const key=btn.dataset.key,costo=parseInt(btn.dataset.costo);if(gameState.saldo>=costo){gameState.saldo-=costo;gameState.upgrades[key]=true;SFX.coin();vibrar([30,20,30]);showToast('Upgrade comprado!');renderUpgrades();updateHUD();guardar();}};});}

// ==================== ACHIEVEMENTS RENDER ====================
function renderAchievements(){const list=document.getElementById('achievementsList');list.innerHTML='';for(const ach of ACHIEVEMENTS_DATA){const des=gameState.achievements.includes(ach.id);const item=document.createElement('div');item.className='ach-item'+(des?' desbloqueado':'');item.innerHTML=`<div class="ach-emoji">${des?ach.emoji:'🔒'}</div><div class="ach-info"><div class="ach-name">${ach.name}</div><div class="ach-desc">${ach.desc}</div></div><div class="ach-status">${des?'✓ +'+ach.premio:'🪙 '+ach.premio}</div>`;list.appendChild(item);}}

// ==================== STATS RENDER ====================
function renderStats(){const list=document.getElementById('statsList');const s=gameState.stats;const sections=[{title:'Resumen',items:[{icon:'🪙',label:'Saldo',val:'🪙 '+gameState.saldo,full:true},{icon:'🏆',label:'High Score',val:'🪙 '+gameState.highScore,full:true},{icon:'📈',label:'Nivel',val:gameState.nivel},{icon:'⭐',label:'EXP',val:gameState.expTotal}]},{title:'Giros',items:[{icon:'🎰',label:'Total giros',val:s.totalSpins},{icon:'🎉',label:'Premios',val:s.totalWins},{icon:'💸',label:'Apostado',val:'🪙 '+s.totalBet},{icon:'💰',label:'Ganado',val:'🪙 '+s.totalWon},{icon:'🥇',label:'Mayor premio',val:'🪙 '+s.biggestWin},{icon:'🔥',label:'Mejor racha',val:s.bestStreak}]},{title:'Bonos & Gamble',items:[{icon:'👽',label:'Bonos',val:s.bonosTriggered},{icon:'🎲',label:'Gamble W',val:s.gambleWins},{icon:'📉',label:'Gamble L',val:s.gambleLosses},{icon:'💎',label:'Jackpots',val:s.jackpots}]},{title:'Cosmic Features',items:[{icon:'🌟',label:'Scatters',val:s.scatterTriggered},{icon:'🎰',label:'Free Spins',val:s.freeSpinsWon},{icon:'⭐',label:'Prestigios',val:s.prestiges},{icon:'🎯',label:'Retos hoy',val:(gameState.challenges||[]).filter(c=>c.completed).length+'/3'}]},{title:'Extras',items:[{icon:'🔮',label:'Frutas',val:s.fruitsCaught},{icon:'📅',label:'Login streak',val:gameState.loginStreak+'d'},{icon:'📊',label:'RTP',val:getRTP()+'%'},{icon:'⭐',label:'Mult. Prestigio',val:'x'+gameState.prestigeMult}]}];let html='';for(const sec of sections){html+=`<div class="stat-section-title">${sec.title}</div><div class="stats-grid">`;for(const it of sec.items){html+=`<div class="stat-card${it.full?' full':''}"><span class="stat-card-icon">${it.icon}</span><div><div class="stat-card-label">${it.label}</div><div class="stat-card-value">${it.val}</div></div></div>`;}html+='</div>';}if(canPrestige()){html+=`<div class="prestige-info">Puedes hacer <b class="prestige-mult">PRESTIGIO</b> para resetear tu progreso y obtener un multiplicador permanente <b class="prestige-mult">x${(gameState.prestigeMult+0.5).toFixed(1)}</b></div>`;html+=`<button class="prestige-btn" onclick="doPrestige()">⭐ PRESTIGIO ${gameState.prestigio+1} (x${(gameState.prestigeMult+0.5).toFixed(1)})</button>`;}else if(gameState.prestigio>0){html+=`<div class="prestige-info">Prestigio actual: <b class="prestige-mult">x${gameState.prestigeMult}</b> · Necesitas Nivel 5 + 100k EXP para otro prestigio</div>`;}list.innerHTML=html;}

// ==================== INIT ====================
function initGame(){cargar();checkDailyLogin();checkDailyChallenges();renderAllReels();updateHUD();updateJackpotDisplay();updateFreeSpinsBanner();const vs=document.getElementById('volumeSlider');if(vs)vs.value=gameState.volume;renderPaytable();startFruitGarden();updateFrutas();checkAllAch();if(gameState.saldo>gameState.highScore&&!gameState.freeMoney){gameState.highScore=gameState.saldo;guardar();}if('serviceWorker' in navigator){var swCode=['var CN="cosmicfruit-v1";','self.addEventListener("install",function(e){self.skipWaiting();});','self.addEventListener("activate",function(e){e.waitUntil(self.clients.claim());});','self.addEventListener("fetch",function(e){','e.respondWith(caches.match(e.request).then(function(r){','return r||fetch(e.request).then(function(resp){var cl=resp.clone();','caches.open(CN).then(function(c){c.put(e.request,cl);});return resp;','}).catch(function(){return r;});}));','});'].join('');var swBlob=new Blob([swCode],{type:'application/javascript'});navigator.serviceWorker.register(URL.createObjectURL(swBlob)).catch(function(){});}}
function startGame(){initAudio();document.getElementById('inicio').classList.add('oculto');document.getElementById('juego').classList.add('activo');startMusic(pickLoungeTrack());setLayer(0);vibrar(50);if(!gameState.tutorialVisto&&gameState.stats.totalSpins===0){setTimeout(()=>showTutorial(),500);}}

// ==================== EVENT LISTENERS ====================
document.getElementById('btnInicio').addEventListener('click',startGame);
document.getElementById('btnSpin').addEventListener('click',()=>{if(!gameState.girando)doSpin();});
let mutedTrack=null;
function toggleMute(){audioEnabled=!audioEnabled;const btnS=document.getElementById('btnSonido');if(!audioEnabled){mutedTrack=currentTrack;stopMusic();if(btnS)btnS.textContent='🔇';}else{if(btnS)btnS.textContent='🔊';gameState.volume=80;startMusic(mutedTrack||pickLoungeTrack());mutedTrack=null;}setVolume(audioEnabled?80:0);}
document.getElementById('btnSonido').addEventListener('click',(e)=>{e.stopPropagation();toggleMute();});
document.querySelectorAll('.bet-btn').forEach(btn=>{btn.addEventListener('click',()=>{if(gameState.girando)return;const bet=btn.dataset.bet;if(bet==='all')gameState.apuestaActual=gameState.saldo;else{const v=parseInt(bet);if(v<=gameState.saldo)gameState.apuestaActual=v;}updateHUD();});});
document.getElementById('btnAuto').addEventListener('click',()=>{gameState.autoSpin=!gameState.autoSpin;updateHUD();if(gameState.autoSpin)checkAutoSpin();});
document.getElementById('btnTurbo').addEventListener('click',()=>{gameState.turboMode=!gameState.turboMode;updateHUD();});
for(let i=0;i<5;i++){document.getElementById('reel'+i).addEventListener('click',()=>{if(nudgeEnabled)nudgeReel(i);});}
document.getElementById('juego').addEventListener('click',(e)=>{if(gameState.girando&&!e.target.closest('button')&&!e.target.closest('.reel'))handleTapCombo(e);});
document.getElementById('btnPaytable').addEventListener('click',()=>{renderPaytable();document.getElementById('paytable-screen').classList.add('activo');});
document.getElementById('btnClosePaytable').addEventListener('click',()=>document.getElementById('paytable-screen').classList.remove('activo'));
document.getElementById('btnUpgrades').addEventListener('click',()=>{renderUpgrades();document.getElementById('upgrades-screen').classList.add('activo');});
document.getElementById('btnCloseUpgrades').addEventListener('click',()=>document.getElementById('upgrades-screen').classList.remove('activo'));
document.getElementById('btnAchievements').addEventListener('click',()=>{renderAchievements();document.getElementById('achievements-screen').classList.add('activo');});
document.getElementById('btnCloseAchievements').addEventListener('click',()=>document.getElementById('achievements-screen').classList.remove('activo'));
document.getElementById('btnStats').addEventListener('click',()=>{renderStats();document.getElementById('stats-screen').classList.add('activo');});
document.getElementById('btnCloseStats').addEventListener('click',()=>document.getElementById('stats-screen').classList.remove('activo'));
document.getElementById('btnChallenges').addEventListener('click',()=>{renderChallenges();document.getElementById('challenges-screen').classList.add('activo');});
document.getElementById('btnCloseChallenges').addEventListener('click',()=>document.getElementById('challenges-screen').classList.remove('activo'));
document.getElementById('tutorialBtn').addEventListener('click',nextTutorialStep);
document.getElementById('btnCobrar').addEventListener('click',()=>cobrarGamble());
document.addEventListener('keydown',(e)=>{if(document.getElementById('tutorial-overlay').classList.contains('activo'))return;if(e.key===' '||e.code==='Space'){e.preventDefault();if(document.getElementById('juego').classList.contains('activo')&&!gameState.girando)doSpin();}else if(e.key>='1'&&e.key<='5'){if(gameState.girando)return;const bets=[10,50,100,500,'all'];const b=bets[parseInt(e.key)-1];if(b==='all')gameState.apuestaActual=gameState.saldo;else{const v=parseInt(b);if(v<=gameState.saldo)gameState.apuestaActual=v;}updateHUD();}else if(e.key==='Escape'){document.querySelectorAll('[id$="-screen"].activo').forEach(el=>el.classList.remove('activo'));hideToast();}});

// Start
initGame();

// Re-render reels on resize/orientation change
let resizeTO=null;
window.addEventListener('resize',()=>{resizeCanvas();if(resizeTO)clearTimeout(resizeTO);resizeTO=setTimeout(()=>{if(document.getElementById('juego').classList.contains('activo')){renderAllReels();}},200);});
