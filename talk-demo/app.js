const people=[
 {id:'p1',name:'张伟',role:'现场指挥',online:true},{id:'p2',name:'李强',role:'一号岗哨',online:true},
 {id:'p3',name:'王敏',role:'设备操作员',online:true},{id:'p4',name:'陈刚',role:'机动巡查',online:true},
 {id:'p5',name:'赵磊',role:'二号岗哨',online:true},{id:'p6',name:'刘洋',role:'技术保障',online:true},
 {id:'p7',name:'周林',role:'外围巡查',online:true},{id:'p8',name:'孙浩',role:'后方值守',online:false}
];
let groups=[
 {id:'g1',name:'一号巡防组',members:['p1','p2','p3','p4','p5'],channel:'01'},
 {id:'g2',name:'技术保障组',members:['p1','p3','p6'],channel:'02'}
];
let current={type:'group',id:'g1'},activeTab='contacts',isTalking=false,startTime=0,timerHandle=null,mediaRecorder=null,chunks=[],stream=null;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const initials=n=>n.slice(-2); const now=()=>new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
function renderLists(filter=''){
 const match=x=>x.toLowerCase().includes(filter.toLowerCase());
 $('#contactsList').innerHTML=people.filter(p=>match(p.name+p.role)).map(p=>`<button class="channel ${current.id===p.id?'selected':''}" data-kind="person" data-id="${p.id}"><span class="avatar">${initials(p.name)}</span><span class="channel-copy"><strong>${p.name}</strong><small>${p.role} · ${p.online?'在线':'离线'}</small></span><i class="online-mark ${p.online?'':'offline'}"></i></button>`).join('');
 $('#groupsList').innerHTML=groups.filter(g=>match(g.name)).map(g=>`<button class="channel ${current.id===g.id?'selected':''}" data-kind="group" data-id="${g.id}"><span class="avatar group">${g.name.slice(0,2)}</span><span class="channel-copy"><strong>${g.name}</strong><small>${g.members.filter(id=>people.find(p=>p.id===id)?.online).length} 人在线 · CH ${g.channel}</small></span><i class="online-mark"></i></button>`).join('');
 $$('.channel').forEach(b=>b.onclick=()=>selectTarget(b.dataset.kind,b.dataset.id));
}
function selectTarget(kind,id){
 current={type:kind,id}; const isGroup=kind==='group'; const item=isGroup?groups.find(g=>g.id===id):people.find(p=>p.id===id);
 $('#targetAvatar').textContent=isGroup?item.name.slice(0,2):initials(item.name); $('#targetAvatar').className='target-avatar'+(isGroup?' group':'');
 $('#targetName').textContent=item.name;
 const members=isGroup?item.members.map(x=>people.find(p=>p.id===x)):[item]; const online=members.filter(p=>p.online).length;
 $('#targetMeta').innerHTML=`<i class="dot ${online?'green':''}"></i>${isGroup?`${online} 人在线 · 小组频道 ${item.channel}`:`${item.role} · ${item.online?'在线':'离线'}`}`;
 $('#memberNumber').textContent=members.length; $('#onlineSummary').textContent=`${online} / ${members.length} 在线`;
 $('#memberList').innerHTML=members.map(p=>`<div class="member"><span class="avatar">${initials(p.name)}</span><div><strong>${p.name}</strong><small>${p.role}</small></div><i class="online-mark ${p.online?'':'offline'}"></i></div>`).join('');
 $('#messages').innerHTML=isGroup?`<div class="message"><span class="avatar">强</span><div class="bubble"><div class="meta"><span>李强</span><span>10:16</span></div><div class="voice-row"><button>▶</button><span class="voice-bars">▂▅▃▆▂▇▃▅</span><span>6″</span></div></div></div><div class="message"><span class="avatar">敏</span><div class="bubble"><div class="meta"><span>王敏</span><span>10:21</span></div><div class="voice-row"><button>▶</button><span class="voice-bars">▃▆▂▅▇▃▆▂▅</span><span>9″</span></div></div></div>`:`<div class="message"><span class="avatar">${initials(item.name)}</span><div class="bubble"><div class="meta"><span>${item.name}</span><span>10:24</span></div><div class="voice-row"><button>▶</button><span class="voice-bars">▃▆▂▅▇▃</span><span>4″</span></div></div></div>`;
 renderLists($('#searchInput').value);
}
function setTab(tab){activeTab=tab; $$('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab)); $('#contactsList').classList.toggle('hidden',tab!=='contacts'); $('#groupsList').classList.toggle('hidden',tab!=='groups'); $('#createGroup').classList.toggle('hidden',tab!=='groups')}
function formatTime(ms){const s=Math.floor(ms/1000);return `00:${String(s).padStart(2,'0')}`}
async function startTalk(){
 if(isTalking)return; isTalking=true; startTime=Date.now(); chunks=[]; $('#pttButton').classList.add('transmitting'); $('#pttButton strong').textContent='正在讲话'; $('#pttButton small').textContent='松开发送'; $('#pttHint').textContent='讲话中 · 频道内成员正在收听';
 timerHandle=setInterval(()=>$('#timer').textContent=formatTime(Date.now()-startTime),200);
 try{stream=await navigator.mediaDevices.getUserMedia({audio:true}); mediaRecorder=new MediaRecorder(stream); mediaRecorder.ondataavailable=e=>chunks.push(e.data); mediaRecorder.start()}catch(e){mediaRecorder=null}
}
function stopTalk(){
 if(!isTalking)return; isTalking=false; clearInterval(timerHandle); const duration=Math.max(1,Math.round((Date.now()-startTime)/1000));
 $('#pttButton').classList.remove('transmitting'); $('#pttButton strong').textContent='按住说话'; $('#pttHint').textContent='按住麦克风开始讲话'; $('#timer').textContent='00:00';
 if(mediaRecorder&&mediaRecorder.state!=='inactive'){
   mediaRecorder.onstop=()=>{const url=URL.createObjectURL(new Blob(chunks,{type:mediaRecorder.mimeType}));addVoice(duration,url);stream?.getTracks().forEach(t=>t.stop())}; mediaRecorder.stop();
 }else addVoice(duration,null);
}
function addVoice(duration,url){
 const msg=document.createElement('div');msg.className='message self';msg.innerHTML=`<span class="avatar">我</span><div class="bubble"><div class="meta"><span>本机</span><span>${now()}</span></div><div class="voice-row">${url?`<audio controls src="${url}"></audio>`:`<button>▶</button><span class="voice-bars">▂▅▃▆▂▇▃▅</span><span>${duration}″</span>`}</div></div>`;$('#messages').append(msg);$('#messages').scrollTop=$('#messages').scrollHeight;toast(url?'语音已发送，可点击回放':'演示语音已发送（浏览器未开放麦克风）')
}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),2200)}
function updateSelected(){const n=$$('#groupMemberChoices input:checked').length;$('#selectedCount').textContent=`已选 ${n} 人`}
$('#openTalk').onclick=()=>{$('#homeScreen').classList.remove('active');$('#talkScreen').classList.add('active')};
$('#backHome').onclick=()=>{if(new URLSearchParams(location.search).get('embedded')==='1'){parent.postMessage({type:'counter-shield-close-talk'},'*');return}$('#talkScreen').classList.remove('active');$('#homeScreen').classList.add('active')};
if(new URLSearchParams(location.search).get('embedded')==='1'){$('#homeScreen').classList.remove('active');$('#talkScreen').classList.add('active');setTab('groups')}
$$('.tab').forEach(b=>b.onclick=()=>setTab(b.dataset.tab)); $('#searchInput').oninput=e=>renderLists(e.target.value);
$('#createGroup').onclick=()=>{$('#groupName').value='';$('#groupMemberChoices').innerHTML=people.map(p=>`<label class="choice"><input type="checkbox" value="${p.id}"><span class="avatar">${initials(p.name)}</span><span>${p.name} · ${p.role}</span></label>`).join('');$$('#groupMemberChoices input').forEach(x=>x.onchange=updateSelected);updateSelected();$('#groupDialog').showModal()};
$('#groupForm').onsubmit=e=>{e.preventDefault();const name=$('#groupName').value.trim(),members=$$('#groupMemberChoices input:checked').map(x=>x.value);if(!name){toast('请输入小组名称');return}if(!members.length){toast('请至少选择一名成员');return}const g={id:'g'+Date.now(),name,members,channel:String(groups.length+1).padStart(2,'0')};groups.push(g);$('#groupCount').textContent=groups.length;$('#groupDialog').close();setTab('groups');selectTarget('group',g.id);toast(`已创建“${name}”`)};
const ptt=$('#pttButton');ptt.addEventListener('pointerdown',e=>{e.preventDefault();ptt.setPointerCapture(e.pointerId);startTalk()});ptt.addEventListener('pointerup',stopTalk);ptt.addEventListener('pointercancel',stopTalk);
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&$('#talkScreen').classList.contains('active')&&!$('#groupDialog').open){e.preventDefault();startTalk()}});document.addEventListener('keyup',e=>{if(e.code==='Space'){e.preventDefault();stopTalk()}});
setInterval(()=>$('#clock').textContent=now(),1000);renderLists();selectTarget('group','g1');
