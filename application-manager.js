(function(){
  const base=document.baseURI;
  function open(doc){
    if(doc.querySelector('.application-manager-page'))return;
    const bridge=doc.defaultView.AndroidAppManager;
    let apps=[{id:'maps',name:'地图导航',version:'12.1.0',installed:'2026-11-22 10:30',size:168,status:'打开',icon:'⌖'},{id:'files',name:'文件管理',version:'3.2.1',installed:'2026-11-21 14:20',size:32,status:'更新',icon:'▣'},{id:'camera',name:'现场相机',version:'2.0.0',installed:'2026-11-20 09:00',size:56,status:'打开',icon:'◉'}];
    if(bridge?.getInstalledApps){try{const result=bridge.getInstalledApps();apps=typeof result==='string'?JSON.parse(result):result;}catch(_){apps=[];}}
    const page=doc.createElement('section');page.className='application-manager-page';
    page.innerHTML='<header><button type="button" class="apps-back">‹ 返回</button><h1>应用管理</h1><button type="button" class="apps-store">应用商店</button></header><div class="apps-toolbar"><input type="search" placeholder="搜索应用名称" aria-label="搜索应用名称"><select aria-label="应用排序"><option value="time">安装时间 从新到旧</option><option value="size">应用大小 从大到小</option></select></div><p class="apps-mode"></p><div class="apps-list"></div><p class="apps-feedback" role="status"></p>';
    page.querySelector('.apps-mode').textContent=bridge?'已安装应用':'原型演示应用 · 安卓设备接入后显示实际已安装列表';
    const list=page.querySelector('.apps-list'),feedback=page.querySelector('.apps-feedback');
    function render(){
      const keyword=page.querySelector('input').value.trim().toLowerCase(),sort=page.querySelector('select').value;
      const visible=apps.filter(app=>app.name.toLowerCase().includes(keyword)).sort((a,b)=>sort==='size'?b.size-a.size:String(b.installed).localeCompare(String(a.installed)));
      list.replaceChildren();
      if(!visible.length){list.textContent='暂无匹配应用';return;}
      visible.forEach(app=>{
        const shell=doc.createElement('article');shell.className='installed-app-swipe';
        const remove=doc.createElement('button');remove.className='app-uninstall';remove.type='button';remove.textContent='卸载';
        const card=doc.createElement('div');card.className='installed-app-card';
        const icon=doc.createElement('div');icon.className='installed-app-icon';
        if(app.icon?.startsWith('data:')||app.icon?.startsWith('https:')){const img=doc.createElement('img');img.src=app.icon;img.alt='';icon.append(img);}else icon.textContent=app.icon||'▣';
        const copy=doc.createElement('div');copy.className='installed-app-copy';const name=doc.createElement('strong');name.textContent=app.name;
        const version=doc.createElement('span');version.textContent='版本 '+app.version;
        const time=doc.createElement('span');time.textContent='安装时间 '+app.installed;
        const size=doc.createElement('span');size.textContent='应用大小 '+app.size+' MB';copy.append(name,version,time,size);
        const action=doc.createElement('button');action.type='button';action.className='installed-app-action';action.textContent=app.status==='更新'?'更新':'打开';
        action.addEventListener('click',()=>{if(bridge){try{if(app.status==='更新')bridge.updateApp(app.id);else bridge.openApp(app.id);}catch(_){feedback.textContent='操作失败，请检查应用状态';}}else feedback.textContent='原型演示：'+action.textContent+' '+app.name+'；实际启动和更新需安卓设备接口';});
        remove.addEventListener('click',()=>{const dialog=doc.createElement('dialog');dialog.className='preview-dialog app-uninstall-dialog';const title=doc.createElement('h2');title.textContent='卸载应用';const message=doc.createElement('p');message.textContent='确认卸载“'+app.name+'”？应用数据可能一并移除。';const cancel=doc.createElement('button');cancel.textContent='取消';const confirm=doc.createElement('button');confirm.textContent='确认卸载';cancel.addEventListener('click',()=>{dialog.close();dialog.remove();});confirm.addEventListener('click',()=>{if(bridge){try{bridge.uninstallApp(app.id);feedback.textContent='已提交卸载请求，请在系统确认';}catch(_){feedback.textContent='卸载失败，请重试';}}else{apps=apps.filter(item=>item.id!==app.id);render();feedback.textContent='演示列表已移除该应用';}dialog.close();dialog.remove();});dialog.append(title,message,cancel,confirm);doc.body.append(dialog);dialog.showModal();});
        card.append(icon,copy,action);shell.append(remove,card);let start=null;
        card.addEventListener('pointerdown',event=>{start=event.clientX;});
        card.addEventListener('pointerup',event=>{if(start!==null){const distance=event.clientX-start;if(distance < -45)shell.classList.add('swiped');if(distance>45)shell.classList.remove('swiped');start=null;}});
        card.addEventListener('touchstart',event=>{start=event.touches[0].clientX;},{passive:true});
        card.addEventListener('touchend',event=>{if(start!==null){const distance=event.changedTouches[0].clientX-start;shell.classList.toggle('swiped',distance < -45);start=null;}},{passive:true});
        list.append(shell);
      });
    }
    const workspace=doc.querySelector('.settings-workspace');
    const close=()=>{page.remove();workspace?.classList.remove('app-management-active');doc.querySelector('.app-management-entry')?.classList.remove('active');};
    page.querySelector('.apps-back').addEventListener('click',close);
    page.querySelector('input').addEventListener('input',render);page.querySelector('select').addEventListener('change',render);
    page.querySelector('.apps-store').addEventListener('click',()=>{if(bridge?.openAppStore){try{bridge.openAppStore();}catch(_){feedback.textContent='无法打开系统应用商店';}}else feedback.textContent='请在安卓设备打开系统自带应用商店；网页版暂不支持启动安卓应用。';});
    if(workspace){workspace.classList.add('app-management-active');workspace.append(page);}else doc.body.append(page);
    doc.querySelectorAll('.settings-nav button').forEach(button=>button.classList.toggle('active',button.classList.contains('app-management-entry')));
    doc.querySelectorAll('.settings-nav button:not(.app-management-entry),.primary-nav button').forEach(button=>button.addEventListener('click',close,{once:true}));
    render();
  }
  function attach(doc){
    if(!doc?.head)return;
    if(!doc.querySelector('[data-app-management-style]')){const link=doc.createElement('link');link.rel='stylesheet';link.href=new URL('application-manager.css?v=20261123-3',base).href;link.dataset.appManagementStyle='true';doc.head.append(link);}
    doc.querySelectorAll('.settings-nav').forEach(nav=>{if(nav.querySelector('.app-management-entry'))return;const template=nav.querySelector('button');const button=template?template.cloneNode(true):doc.createElement('button');button.type='button';button.className='app-management-entry';button.removeAttribute('style');button.querySelectorAll('[style]').forEach(el=>el.removeAttribute('style'));button.innerHTML='<span class="setting-icon">▦</span><div class="app-management-menu-copy"><strong>应用管理</strong><small>查看和管理已安装应用</small></div><span aria-hidden="true">›</span>';button.addEventListener('click',()=>open(doc));nav.append(button);});
    if(!doc.documentElement.dataset.appManagerWatch){doc.documentElement.dataset.appManagerWatch='true';let pending=false;new doc.defaultView.MutationObserver(()=>{if(pending)return;pending=true;doc.defaultView.requestAnimationFrame(()=>{pending=false;attach(doc);});}).observe(doc.documentElement,{childList:true,subtree:true});}
  }
  function connect(){attach(document);document.querySelectorAll('iframe').forEach(frame=>{try{attach(frame.contentDocument);}catch(_){}if(!frame.dataset.appManagerLoad){frame.dataset.appManagerLoad='true';frame.addEventListener('load',()=>{try{attach(frame.contentDocument);}catch(_){}});}});}
  connect();new MutationObserver(connect).observe(document.documentElement,{childList:true,subtree:true});
})();
