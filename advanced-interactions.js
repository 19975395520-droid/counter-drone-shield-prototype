(function(){
  const base=document.baseURI;
  const defaults={
    '消费级无人机':[[2405,2478.5],[5730,5845]],
    '行业级无人机':[[2405,2478.5],[5155,5245],[5730,5845]],
    'FPV':[[850,927],[2405,2478.5],[2350,2505],[5625,5845]],
    '警用无人机':[[1430,1445],[2405,2478.5],[5730,5845],[5155,5245]]
  };
  const clone=value=>JSON.parse(JSON.stringify(value));
  function combination(doc){
    doc.querySelector('.advanced-combination')?.remove();
    let state;try{state=JSON.parse(doc.defaultView.localStorage.getItem('combination-spectrum-config')||'null');}catch(_){}
    state=state||{mode:'消费级无人机',bands:clone(defaults['消费级无人机'])};
    let draft=clone(state),editing=null,selection=null;
    const dialog=doc.createElement('dialog');dialog.className='preview-dialog advanced-combination';
    dialog.innerHTML='<header><h2>组合频段</h2><button type="button" class="combo-close" aria-label="关闭组合频段">×</button></header><div class="combo-body"><div class="combo-modes"></div><p class="combo-optimal" role="status"></p><div class="combo-axis-title"><strong>宽频打击范围</strong><span>400–8000 MHz</span></div><div class="combo-axis" tabindex="0" aria-label="拖动框选频谱区间"><div class="combo-segments"></div><div class="combo-selection"></div></div><div class="combo-ticks"><span>400</span><span>2000</span><span>4000</span><span>6000</span><span>8000 MHz</span></div><p class="combo-help">在频谱轴上拖动新增区间，点击已选区间或下方编辑按钮修改</p><div class="combo-band-list"></div><div class="combo-editor" hidden><strong>编辑打击频段</strong><label>起始频率<input type="number" min="400" max="8000" step="0.1" class="combo-start"> MHz</label><label>结束频率<input type="number" min="400" max="8000" step="0.1" class="combo-end"> MHz</label><button type="button" class="combo-edit-save">保存频段</button><button type="button" class="combo-edit-cancel">取消</button></div><p class="combo-error" role="alert"></p><footer><button type="button" class="combo-reset">一键恢复默认</button><button type="button" class="combo-add">新增频段</button><button type="button" class="combo-save">保存配置</button></footer></div>';
    const axis=dialog.querySelector('.combo-axis'),segments=dialog.querySelector('.combo-segments'),list=dialog.querySelector('.combo-band-list'),editor=dialog.querySelector('.combo-editor'),error=dialog.querySelector('.combo-error');
    const optimal=()=>draft.mode==='消费级无人机'&&JSON.stringify([...draft.bands].sort((a,b)=>a[0]-b[0]))===JSON.stringify(defaults['消费级无人机']);
    function begin(index,start=400,end=500){editing=index;editor.hidden=false;dialog.querySelector('.combo-start').value=index===null?start:draft.bands[index][0];dialog.querySelector('.combo-end').value=index===null?end:draft.bands[index][1];error.textContent='';}
    function render(){
      const modes=dialog.querySelector('.combo-modes');modes.replaceChildren();
      [...Object.keys(defaults),'自定义'].forEach(name=>{const button=doc.createElement('button');button.type='button';button.textContent=name;button.classList.toggle('active',draft.mode===name);button.setAttribute('aria-pressed',String(draft.mode===name));button.addEventListener('click',()=>{draft.mode=name;if(defaults[name])draft.bands=clone(defaults[name]);editor.hidden=true;render();});modes.append(button);});
      dialog.querySelector('.combo-optimal').textContent=optimal()?'您已选择最优打击效果频段':'';
      segments.replaceChildren();list.replaceChildren();
      draft.bands.map((band,index)=>({band,index})).sort((a,b)=>a.band[0]-b.band[0]).forEach(({band,index})=>{
        const segment=doc.createElement('button');segment.type='button';segment.className='combo-segment';segment.style.left=(band[0]-400)/7600*100+'%';segment.style.width=(band[1]-band[0])/7600*100+'%';segment.title=band[0]+'–'+band[1]+' MHz';segment.setAttribute('aria-label','编辑 '+segment.title);
        let drag=null,moved=false;
        segment.addEventListener('pointerdown',event=>{event.stopPropagation();const r=segment.getBoundingClientRect();drag={x:event.clientX,band:[...band],edge:event.clientX-r.left<Math.min(8,r.width/3)?'left':r.right-event.clientX<Math.min(8,r.width/3)?'right':'move'};moved=false;segment.setPointerCapture(event.pointerId);});
        segment.addEventListener('pointermove',event=>{if(!drag||Math.abs(event.clientX-drag.x)<3)return;moved=true;const delta=(event.clientX-drag.x)/axis.getBoundingClientRect().width*7600;let [start,end]=drag.band;if(drag.edge==='left')start=Math.max(400,Math.min(end-.1,start+delta));else if(drag.edge==='right')end=Math.min(8000,Math.max(start+.1,end+delta));else{const shift=Math.max(400-start,Math.min(8000-end,delta));start+=shift;end+=shift;}draft.bands[index]=[Math.round(start*10)/10,Math.round(end*10)/10];segment.style.left=(start-400)/7600*100+'%';segment.style.width=(end-start)/7600*100+'%';});
        segment.addEventListener('pointerup',()=>{if(moved){draft.mode='自定义';editor.hidden=true;render();}drag=null;});
        segment.addEventListener('pointercancel',()=>{if(drag){draft.bands[index]=drag.band;render();}drag=null;});
        segment.addEventListener('click',()=>{if(!moved)begin(index);});segments.append(segment);
        const row=doc.createElement('div');row.className='combo-band-row';const label=doc.createElement('span');label.textContent=band[0]+' – '+band[1]+' MHz';const actions=doc.createElement('div');actions.className='combo-band-actions';const edit=doc.createElement('button');edit.textContent='编辑';edit.type='button';edit.addEventListener('click',()=>begin(index));const remove=doc.createElement('button');remove.textContent='删除';remove.type='button';remove.addEventListener('click',()=>{draft.bands.splice(index,1);draft.mode='自定义';editor.hidden=true;render();});actions.append(edit,remove);row.append(label,actions);list.append(row);
      });
    }
    function frequency(event){const r=axis.getBoundingClientRect();return Math.round(Math.max(400,Math.min(8000,400+(event.clientX-r.left)/r.width*7600))*10)/10;}
    axis.addEventListener('pointerdown',event=>{if(event.target.closest('.combo-segment'))return;selection=frequency(event);axis.setPointerCapture(event.pointerId);});
    axis.addEventListener('pointermove',event=>{if(selection===null)return;const end=frequency(event),preview=dialog.querySelector('.combo-selection');preview.style.display='block';preview.style.left=(Math.min(end,selection)-400)/7600*100+'%';preview.style.width=Math.abs(end-selection)/7600*100+'%';});
    axis.addEventListener('pointerup',event=>{if(selection===null)return;const end=frequency(event);if(Math.abs(end-selection)>=.1){draft.bands.push([Math.min(selection,end),Math.max(selection,end)]);draft.mode='自定义';editor.hidden=true;render();}selection=null;dialog.querySelector('.combo-selection').style.display='none';});
    axis.addEventListener('pointercancel',()=>{selection=null;dialog.querySelector('.combo-selection').style.display='none';});
    dialog.querySelector('.combo-edit-save').addEventListener('click',()=>{const start=Number(dialog.querySelector('.combo-start').value),end=Number(dialog.querySelector('.combo-end').value);if(!Number.isFinite(start)||!Number.isFinite(end)||start<400||end>8000||start>=end){error.textContent='频段须在400–8000 MHz内，且起始频率小于结束频率';return;}if(editing===null)draft.bands.push([start,end]);else draft.bands[editing]=[start,end];draft.mode='自定义';editor.hidden=true;render();});
    dialog.querySelector('.combo-edit-cancel').addEventListener('click',()=>{editor.hidden=true;error.textContent='';});
    dialog.querySelector('.combo-add').addEventListener('click',()=>begin(null));
    dialog.querySelector('.combo-reset').addEventListener('click',()=>{draft={mode:'消费级无人机',bands:clone(defaults['消费级无人机'])};editor.hidden=true;error.textContent='';render();});
    dialog.querySelector('.combo-save').addEventListener('click',()=>{if(!editor.hidden){error.textContent='请先保存或取消正在编辑的频段';return;}if(!draft.bands.length){error.textContent='请至少选择一个打击频段';return;}try{doc.defaultView.localStorage.setItem('combination-spectrum-config',JSON.stringify(draft));dialog.close();dialog.remove();}catch(_){error.textContent='保存失败，请重试';}});
    dialog.querySelector('.combo-close').addEventListener('click',()=>{dialog.close();dialog.remove();});
    doc.body.append(dialog);render();dialog.showModal();
  }
  function direction(doc,target){
    const dialog=doc.createElement('dialog');dialog.className='preview-dialog ring-direction-dialog';
    dialog.innerHTML='<header><h2>测向 · 环形频谱</h2><button type="button" aria-label="关闭测向">×</button></header><iframe title="环形频谱测向演示"></iframe>';
    dialog.querySelector('iframe').src=new URL('ring-spectrum.html',base).href;
    dialog.querySelector('button').addEventListener('click',()=>{dialog.close();dialog.remove();});
    dialog.addEventListener('cancel',()=>{dialog.querySelector('iframe').src='about:blank';setTimeout(()=>dialog.remove(),0);});
    doc.body.append(dialog);dialog.showModal();
  }
  function updateServer(doc){
    doc.querySelectorAll('.settings-workspace section').forEach(section=>{
      if(section.querySelector(':scope>h3')?.textContent.trim()!=='解密服务器')return;
      const select=section.querySelector('select');if(!select)return;
      let row=section.querySelector('.server-state-row');
      if(!row){row=doc.createElement('div');row.className='setting-item server-state-row';row.innerHTML='<div class="setting-item-copy"><strong>当前服务器状态</strong><span>当前选择服务器的连接状态</span></div><span class="server-connection-state" role="status"></span>';section.querySelector('h3').after(row);}
      const state=row.querySelector('.server-connection-state');
      if(!state.textContent)state.textContent=doc.defaultView.navigator.onLine?'已连接':'离线';
      const original=[...section.querySelectorAll('.setting-item')].find(item=>item!==row&&item.querySelector('strong')?.textContent.trim()==='连接状态');if(original)original.style.display='none';
      if(!select.dataset.serverStatusBound){select.dataset.serverStatusBound='true';select.addEventListener('change',()=>{state.textContent='连接中';doc.defaultView.setTimeout(()=>{state.textContent=select.value.includes('自定义')?'离线':doc.defaultView.navigator.onLine?'已连接':'离线';},500);});}
      const fields=section.querySelector('.server-fields');if(!fields||fields.querySelector('.custom-server-save'))return;
      let saved;try{saved=JSON.parse(doc.defaultView.localStorage.getItem('custom-decryption-server')||'null');}catch(_){}
      const inputs=fields.querySelectorAll('input');if(saved){if(inputs[0])inputs[0].value=saved.host;if(inputs[1])inputs[1].value=saved.port;}
      const save=doc.createElement('button');save.type='button';save.className='custom-server-save';save.textContent='保存';const note=doc.createElement('p');note.className='server-save-feedback';note.setAttribute('role','status');
      save.addEventListener('click',()=>{const host=inputs[0]?.value.trim(),port=Number(inputs[1]?.value);if(!host||!/^[a-zA-Z0-9.:-]+$/.test(host)||!Number.isInteger(port)||port<1||port>65535){note.textContent='请输入有效服务器地址及1–65535端口';return;}doc.defaultView.localStorage.setItem('custom-decryption-server',JSON.stringify({host,port}));state.textContent='连接中';note.textContent='配置已保存；原型演示连接状态';save.disabled=true;doc.defaultView.setTimeout(()=>{state.textContent=doc.defaultView.navigator.onLine?'已连接':'离线';save.disabled=false;},600);});fields.append(save,note);
    });
  }
  function attach(doc){
    if(!doc?.head)return;
    if(!doc.querySelector('[data-advanced-style]')){const link=doc.createElement('link');link.rel='stylesheet';link.href=new URL('advanced-interactions.css?v=20261123-4',base).href;link.dataset.advancedStyle='true';doc.head.append(link);}
    updateServer(doc);
    if(doc.documentElement.dataset.advancedReady)return;doc.documentElement.dataset.advancedReady='true';
    doc.addEventListener('click',event=>{
      const label=event.target.closest('.counter-band span');
      if(label?.textContent.trim()==='组合频段'){event.preventDefault();event.stopImmediatePropagation();combination(doc);return;}
      const button=event.target.closest('.alert-direction-action');
      if(button){event.preventDefault();event.stopImmediatePropagation();direction(doc,button.closest('.target-swipe-shell')?.dataset.alertTargetId);}
    },true);
    let pending=false;new doc.defaultView.MutationObserver(()=>{if(pending)return;pending=true;doc.defaultView.requestAnimationFrame(()=>{pending=false;updateServer(doc);});}).observe(doc.documentElement,{childList:true,subtree:true});
  }
  function connect(){attach(document);document.querySelectorAll('iframe').forEach(frame=>{if(frame.closest('.ring-direction-dialog'))return;try{attach(frame.contentDocument);}catch(_){}if(!frame.dataset.advancedLoad){frame.dataset.advancedLoad='true';frame.addEventListener('load',()=>{try{attach(frame.contentDocument);}catch(_){}});}});}
  connect();new MutationObserver(connect).observe(document.documentElement,{childList:true,subtree:true});
})();
