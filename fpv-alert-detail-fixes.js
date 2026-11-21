(function () {
  const cssHref = new URL('fpv-alert-detail-fixes.css', document.baseURI).href;

  function attachStyles(doc) {
    if (!doc.querySelector('link[data-global-visual-system]')) {
      const visual = doc.createElement('link');
      visual.rel = 'stylesheet';
      visual.href = new URL('global-visual-system.css?v=20261121-4', document.baseURI).href;
      visual.dataset.globalVisualSystem = 'true';
      doc.head.appendChild(visual);
    }
    if (doc.querySelector('link[data-fpv-alert-detail-fixes]')) return;
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssHref;
    link.dataset.fpvAlertDetailFixes = 'true';
    doc.head.appendChild(link);
  }

  function addLandscapeToggle(doc, dialog) {
    if (!dialog || dialog.dataset.landscapeToggleReady) return;
    const heading = dialog.querySelector('h2')?.textContent || dialog.getAttribute('aria-label') || '';
    if (!/FPV\s*图片/.test(heading)) return;
    dialog.dataset.landscapeToggleReady = 'true';
    dialog.classList.add('fpv-image-dialog');
    const header = dialog.querySelector('header');
    if (!header) return;
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'fpv-landscape-toggle';
    button.textContent = '全屏横屏查看';
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      const active = dialog.classList.toggle('fpv-landscape-view');
      button.textContent = active ? '退出横屏' : '全屏横屏查看';
      button.setAttribute('aria-pressed', String(active));
    });
    header.insertBefore(button, header.querySelector('.fpv-dialog-close, button[aria-label*=关闭]'));
  }

  function enhanceDetail(doc, detail) {
    const shell = detail._alertSourceShell || detail.closest('.target-swipe-shell');
    if (!shell) return;
    detail._alertSourceShell = shell;
    if (!detail.querySelector('.alert-evidence')) {
      const key = 'sky-shield-evidence-' + (shell.dataset.alertTargetId || 'unknown');
      let saved = {};
      try { saved = JSON.parse(doc.defaultView.localStorage.getItem(key) || '{}'); } catch (_) {}
      const section = doc.createElement('section');
      section.className = 'alert-evidence';
      section.innerHTML = '<h3>拍照取证</h3><label class="evidence-upload">拍照 / 上传照片<input type="file" accept="image/*" capture="environment" multiple aria-label="拍照上传取证照片"></label><div class="evidence-images"></div><label class="evidence-result">处置结果<textarea rows="3" placeholder="请填写处置经过及结果"></textarea></label><button type="button" class="evidence-save">保存取证</button><p role="status" class="evidence-status"></p>';
      const photos = Array.isArray(saved.photos) ? saved.photos : [];
      const gallery = section.querySelector('.evidence-images');
      const result = section.querySelector('textarea');
      result.value = saved.result || '';
      const render = () => {
        gallery.replaceChildren();
        photos.forEach((src, index) => {
          const item = doc.createElement('div');
          const image = doc.createElement('img');
          image.src = src;
          image.alt = '取证照片 ' + (index + 1);
          const remove = doc.createElement('button');
          remove.type = 'button';
          remove.textContent = '删除';
          remove.addEventListener('click', () => { photos.splice(index, 1); render(); });
          item.append(image, remove);
          gallery.append(item);
        });
      };
      section.querySelector('input').addEventListener('change', async event => {
        const status = section.querySelector('.evidence-status');
        for (const file of event.target.files) {
          if (!file.type.startsWith('image/')) continue;
          try {
            const data = await new Promise((resolve, reject) => {
              const reader = new doc.defaultView.FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            photos.push(data);
          } catch (_) { status.textContent = '照片读取失败，请重试'; }
        }
        render();
        event.target.value = '';
      });
      section.querySelector('.evidence-save').addEventListener('click', () => {
        const status = section.querySelector('.evidence-status');
        try {
          doc.defaultView.localStorage.setItem(key, JSON.stringify({ photos, result: result.value, savedAt: new Date().toISOString() }));
          status.textContent = '取证照片与处置结果已保存';
        } catch (_) { status.textContent = '存储空间不足，请减少照片后重试'; }
      });
      render();
      (detail.querySelector('.alert-dialog-body') || detail).append(section);
    }
    if (!detail.querySelector('.landscape-detail-close')) {
      const close = doc.createElement('button');
      close.type = 'button';
      close.className = 'landscape-detail-close';
      close.setAttribute('aria-label', '关闭告警详情');
      close.textContent = '×';
      close.addEventListener('click', () => shell.querySelector('.detail-action')?.click());
      detail.prepend(close);
    }
    detail.querySelector('.alert-location-extra')?.remove();
    if (shell.dataset.alertTargetId === 'UAV-0699') {
      const row = [...detail.querySelectorAll('.alert-metrics dl > div')].find(item => item.querySelector('dt')?.textContent.trim() === '飞行高度');
      if (row) {
        row.dataset.heightThreshold = '120';
        const value = row.querySelector('dd');
        if (value && !value.dataset.demoHeight) {
          value.dataset.demoHeight = 'true';
          value.textContent = '126 m';
        }
      }
    }
    if (doc.defaultView.innerWidth > 900 && doc.defaultView.innerHeight <= 800 && detail.parentElement !== doc.body) {
      detail.classList.add('landscape-alert-detail-portal');
      doc.body.appendChild(detail);
    }
  }

  function normalizeHeight(doc) {
    doc.querySelectorAll('.height-threshold-help').forEach(button => {
      button.textContent = '⚠';
      button.title = '查看飞行高度阈值';
      button.setAttribute('aria-label', '查看飞行高度阈值');
    });
  }

  function update(doc) {
    doc.querySelectorAll('.runtime-trigger').forEach(trigger => {
      const status = trigger.querySelector('strong')?.textContent.includes('离线') ? '离线' : '运行中';
      const display = doc.createElement('div');
      display.className = 'device-status-display';
      display.setAttribute('role', 'status');
      display.innerHTML = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21h8M12 16v5"/></svg><span>设备状态：</span><strong></strong>';
      display.querySelector('strong').textContent = status;
      display.querySelector('svg').style.cursor = 'pointer';
      display.querySelector('svg').setAttribute('role','button');
      display.querySelector('svg').setAttribute('aria-label','进入扫频');
      display.querySelector('svg').addEventListener('click',()=>{
        if(doc.defaultView.innerWidth>900)return;
        openSweep(doc);
      });
      trigger.style.display = 'none';
      if (!trigger.parentElement.querySelector('.device-status-display')) trigger.after(display);
    });
    doc.querySelectorAll('.runtime-programs').forEach(panel => { panel.style.display = 'none'; });
    doc.querySelectorAll('.map').forEach(map => {
      let overlay = map.querySelector('.pilot-map-links');
      if (!overlay) {
        overlay = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
        overlay.classList.add('pilot-map-links');
        overlay.setAttribute('viewBox', '0 0 100 100');
        overlay.setAttribute('preserveAspectRatio', 'none');
        map.append(overlay);
      }
      map.querySelectorAll('.target-pin[data-map-target-id]').forEach(pin => {
        const id = pin.dataset.mapTargetId;
        if (pin.dataset.alertType !== '定位' || map.querySelector('[data-pilot-for="' + id + '"]')) return;
        const x = parseFloat(pin.style.left) || 50;
        const y = parseFloat(pin.style.top) || 50;
        const px = Math.min(90, x + 12), py = Math.min(85, y + 16);
        const line = doc.createElementNS('http://www.w3.org/2000/svg', 'line');
        Object.entries({ x1: x, y1: y, x2: px, y2: py }).forEach(([key,value]) => line.setAttribute(key, value));
        overlay.append(line);
        const pilot = doc.createElement('button');
        pilot.type = 'button';
        pilot.className = 'pilot-map-marker';
        pilot.dataset.pilotFor = id;
        pilot.style.left = px + '%'; pilot.style.top = py + '%';
        pilot.textContent = '♙';
        pilot.title = '飞手位置';
        pilot.setAttribute('aria-label', '飞手位置');
        pilot.addEventListener('click', () => pin.click());
        map.append(pilot);
      });
      map.querySelectorAll('.target-pin .map-target-tooltip').forEach(tooltip => {
        if (tooltip.querySelector('.map-flight-summary')) return;
        const pin = tooltip.closest('.target-pin');
        const old = tooltip.querySelector('.map-tooltip-fields');
        const coordinate = [...(old?.querySelectorAll('span') || [])].find(row => row.textContent.includes('经纬度'))?.querySelector('b')?.textContent || '—';
        const source = pin.dataset.alertType === '定位' ? 'RID' : pin.dataset.alertType || '探测';
        const section = doc.createElement('div');
        section.className = 'map-flight-summary';
        section.innerHTML = '<div class="map-flight-source">● ' + source + '<span>飞行时长：12分30秒</span></div><div class="map-flight-grid"><div><small>相对高度</small><strong>89 m</strong></div><div><small>海拔高度</small><strong>80 m</strong></div><div><small>方位</small><strong>东60°</strong></div><div><small>距本机</small><strong>3 km</strong></div><div><small>频率</small><strong>2477 MHz</strong></div><div><small>速度</small><strong>12 m/s</strong></div></div><div class="map-flight-coordinate"><small>无人机经纬度</small><strong></strong></div>';
        section.querySelector('.map-flight-coordinate strong').textContent = coordinate;
        const close = doc.createElement('button');
        close.type = 'button'; close.className = 'map-flight-close'; close.textContent = '×'; close.setAttribute('aria-label', '关闭无人机信息');
        close.addEventListener('click', event => { event.stopPropagation(); tooltip.style.setProperty('display','none','important'); });
        tooltip.append(close, section);
        pin.addEventListener('click', () => tooltip.style.removeProperty('display'));
      });
    });
    doc.querySelectorAll('.history-detail-panel').forEach(panel => {
      const counter = [...panel.querySelectorAll('.history-reference-section')].find(section => section.querySelector('.history-reference-title')?.textContent.includes('反制记录'));
      if (!counter || panel.querySelector('.history-disposal-record')) return;
      const section = doc.createElement('section');
      section.className = 'history-reference-section history-disposal-record';
      section.innerHTML = '<h2 class="history-reference-title">处置记录</h2><div class="disposal-photos"></div><dl class="disposal-note"><dt>处置备注</dt><dd></dd></dl>';
      let record = {};
      const sn = panel.textContent.match(/(?:SN[:：]?\s*|无人机ID[:：]?\s*)([A-Z0-9-]{6,})/i)?.[1] || '';
      const matching = [...doc.querySelectorAll('.target-swipe-shell')].find(shell => sn && shell.textContent.includes(sn));
      const targetId = matching?.dataset.alertTargetId || (sn.endsWith('40708') ? 'UAV-0708' : sn.endsWith('40699') ? 'UAV-0699' : /FPV/i.test(panel.textContent) ? 'UAV-FPV-01' : '');
      try { record = JSON.parse(doc.defaultView.localStorage.getItem('sky-shield-evidence-' + targetId) || '{}'); } catch (_) {}
      const photos = section.querySelector('.disposal-photos');
      (record.photos || []).forEach((src, index) => {
        const image = doc.createElement('img');
        image.src = src;
        image.alt = '处置取证照片 ' + (index + 1);
        photos.append(image);
      });
      if (!photos.children.length) photos.textContent = '暂无取证照片';
      section.querySelector('dd').textContent = record.result || '暂无处置备注';
      counter.before(section);
    });
    doc.querySelectorAll('.setting-item').forEach(row => {
      if (row.querySelector('strong')?.textContent.trim() !== '自动散热' || row.parentElement.querySelector('[data-manual-cooling]')) return;
      const manual = row.cloneNode(true);
      manual.dataset.manualCooling = 'true';
      manual.querySelector('strong').textContent = '手动散热';
      const description = manual.querySelector('.setting-item-copy > span');
      if (description) description.textContent = '手动开启或关闭风扇散热';
      const toggle = manual.querySelector('.toggle');
      if (!toggle) return;
      let enabled = doc.defaultView.localStorage.getItem('sky-shield-manual-cooling') === 'true';
      const render = () => {
        toggle.classList.toggle('on', enabled);
        toggle.setAttribute('role', 'switch');
        toggle.setAttribute('aria-label', '手动散热');
        toggle.setAttribute('aria-checked', String(enabled));
      };
      toggle.addEventListener('click', () => {
        enabled = !enabled;
        doc.defaultView.localStorage.setItem('sky-shield-manual-cooling', String(enabled));
        render();
      });
      render();
      row.after(manual);
    });
    doc.querySelectorAll('.target-swipe-shell').forEach(shell => {
      if (!['测向', '探测'].includes(shell.dataset.alertType)) return;
      const ignore = [...shell.querySelectorAll('button')].find(button => button.textContent.trim() === '忽略');
      if (!ignore || shell.querySelector('.alert-direction-action')) return;
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'alert-direction-action';
      button.textContent = '⌖ 测向';
      button.setAttribute('aria-label', '测向');
      button.addEventListener('click', event => {
        event.stopPropagation();
        doc.querySelector('.floating-direction')?.click();
      });
      ignore.after(button);
    });
    doc.querySelectorAll('.setting-item').forEach(row => {
      const label = row.querySelector('strong');
      if (label?.textContent.trim() === 'APP 语言' || label?.textContent.trim() === 'APP语言') label.textContent = 'APP语言';
    });
    doc.querySelectorAll('.mode-picker button:not([data-standby-mode])').forEach(button => {
      if (button.textContent.trim() === '待机模式') button.textContent = '省电模式';
    });
    doc.querySelectorAll('.global-battery-warning').forEach(dialog => {
      if (dialog.querySelector('.battery-power-saving')) return;
      let profile = { detect: false, decode: false };
      try { profile = JSON.parse(doc.defaultView.localStorage.getItem('sky-shield-mode-profiles') || '{}')['待机'] || profile; } catch (_) {}
      const note = doc.createElement('p');
      note.className = 'battery-power-state';
      note.textContent = '省电模式下：探测' + (profile.detect ? '开启' : '关闭') + '，解码' + (profile.decode ? '开启' : '关闭') + '。';
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'battery-power-saving';
      button.textContent = '开启省电模式';
      button.addEventListener('click', () => {
        doc.defaultView.localStorage.setItem('sky-shield-display-mode', '待机');
        button.disabled = true;
        button.textContent = '省电模式已开启';
        doc.defaultView.dispatchEvent(new doc.defaultView.Event('storage'));
        doc.defaultView.location.reload();
      });
      const footer = dialog.querySelector('footer');
      (footer || dialog).before(note);
      (footer || dialog).prepend(button);
    });
    doc.querySelectorAll('dialog.history-fpv-dialog, dialog[aria-label="FPV 图片"]').forEach(dialog => addLandscapeToggle(doc, dialog));
    doc.querySelectorAll('.alert-detail-dialog').forEach(detail => enhanceDetail(doc, detail));
    normalizeHeight(doc);
    updateSettings(doc);
    applyStrictTypography(doc);
  }

  function applyStrictTypography(doc) {
    const portrait = doc.defaultView.innerWidth <= 900;
    const scale = {16:24,18:26,20:28,22:30,24:32,28:36,32:40};
    doc.querySelectorAll('body,body *:not(svg):not(svg *):not(canvas):not(script):not(style):not(link):not(iframe)').forEach(el => {
      let size = portrait ? 22 : 20, weight = 400;
      if (el.matches('h1,.page-title')) { size=32; weight=700; }
      if (el.matches('h2,.history-reference-title')) { size=28; weight=600; }
      if (el.matches('h3,h4,.setting-item-copy>strong,.setting-info>strong')) { size=24; weight=600; }
      if (el.matches('.primary-nav button,.primary-nav button span')) { size=28; weight=600; }
      if (el.matches('.settings-nav button,.settings-nav button strong')) { size=24; weight=600; }
      if (el.matches('small,dt,.map-tooltip-fields i,.map-flight-grid small,.map-flight-coordinate small,.setting-item-copy>span,.setting-info small')) { size=portrait?18:16; }
      if (el.matches('.map-tooltip-fields b,.serial,.target-meta,.map-flight-source,.map-flight-source span')) { size=portrait?20:18; }
      if (el.matches('.map-tooltip-heading strong')) { size=24; weight=600; }
      if (el.matches('.map-flight-grid strong,.map-flight-coordinate strong')) { size=22; }
      el.dataset.strictTypography = size+','+weight;
      el.style.setProperty('font-size',size+'px','important');
      el.style.setProperty('line-height',scale[size]+'px','important');
      el.style.setProperty('font-weight',String(weight),'important');
      el.style.setProperty('font-variant-numeric','tabular-nums','important');
    });
  }

  function openSweep(doc) {
    if(doc.querySelector('.handheld-sweep-page'))return;
    const page=doc.createElement('section');page.className='handheld-sweep-page';
    page.innerHTML='<header><button class="sweep-back" type="button">‹ 返回</button><h1>扫频</h1></header><div class="sweep-content"><div class="sweep-toolbar"><strong>扫频范围</strong><label><input type="number" value="400" min="1" max="6000"> MHz</label><span>—</span><label><input type="number" value="500" min="1" max="6000"> MHz</label><button data-play="run" aria-label="开始">▶</button><button data-play="pause" aria-label="暂停">Ⅱ</button><button data-play="stop" aria-label="停止">■</button></div><p class="sweep-message" role="status">演示扫频 · 运行中</p></div>';
    const content=page.querySelector('.sweep-content');let running=true, stopped=false, tick=0;
    const modes=['频谱图','荧光谱','瀑布图','3D 瀑布图'];
    const charts=[];
    for(let i=0;i<2;i++){
      const block=doc.createElement('div');block.className='sweep-chart';
      const tabs=doc.createElement('div');tabs.className='sweep-tabs';
      const canvas=doc.createElement('canvas');canvas.width=640;canvas.height=340;canvas.setAttribute('aria-label','扫频演示图表');
      const chart={canvas,mode:i};charts.push(chart);
      modes.forEach((name,index)=>{const button=doc.createElement('button');button.textContent=name;button.type='button';button.classList.toggle('active',index===i);button.addEventListener('click',()=>{chart.mode=index;tabs.querySelectorAll('button').forEach((b,n)=>b.classList.toggle('active',n===index));draw(chart);});tabs.append(button);});
      block.append(tabs,canvas);content.append(block);
    }
    function draw(chart){const ctx=chart.canvas.getContext('2d'),w=640,h=340;ctx.fillStyle='#050d12';ctx.fillRect(0,0,w,h);ctx.font='14px sans-serif';ctx.strokeStyle='#23313b';ctx.fillStyle='#82949f';
      for(let j=0;j<5;j++){const y=30+j*65;ctx.beginPath();ctx.moveTo(44,y);ctx.lineTo(w-12,y);ctx.stroke();ctx.fillText(String(-30-j*20),5,y+5);}
      const inputs=page.querySelectorAll('input');const lo=Number(inputs[0].value),hi=Number(inputs[1].value);ctx.fillText('dBFS',6,17);ctx.fillText(lo+' MHz',44,330);ctx.fillText(hi+' MHz',550,330);
      if(stopped)return;
      if(chart.mode>=2){for(let y=30;y<290;y+=3){for(let x=44;x<625;x+=4){const v=(Math.sin(x*.08+tick*.2+y*.03)+1)/2;ctx.fillStyle=`hsl(${220-v*150} 80% ${12+v*25}%)`;ctx.fillRect(x,y,4,3);}}return;}
      ctx.beginPath();ctx.moveTo(44,290);for(let x=44;x<625;x++){const spike=Math.exp(-Math.pow((x-180)/5,2))*90+Math.exp(-Math.pow((x-465)/8,2))*65;const noise=Math.sin(x*2.1+tick)*6+Math.sin(x*.73+tick*.5)*4;ctx.lineTo(x,280-spike-noise);}ctx.lineTo(625,300);ctx.closePath();const gradient=ctx.createLinearGradient(0,190,0,300);gradient.addColorStop(0,'#62b9ff');gradient.addColorStop(.55,'#74e946');gradient.addColorStop(1,chart.mode===1?'#ed492a':'#25572b');ctx.fillStyle=gradient;ctx.fill();ctx.strokeStyle='#a4ee60';ctx.stroke();
    }
    page.querySelector('.sweep-back').addEventListener('click',()=>{clearInterval(timer);page.remove();});
    page.querySelectorAll('[data-play]').forEach(button=>button.addEventListener('click',()=>{running=button.dataset.play==='run';stopped=button.dataset.play==='stop';page.querySelector('.sweep-message').textContent='演示扫频 · '+(running?'运行中':stopped?'已停止':'已暂停');charts.forEach(draw);}));
    page.querySelectorAll('input').forEach(input=>input.addEventListener('change',()=>{const values=[...page.querySelectorAll('input')].map(x=>Number(x.value));if(values[0]>=values[1]){page.querySelector('.sweep-message').textContent='结束频率须大于起始频率';return;}charts.forEach(draw);}));
    doc.body.append(page);charts.forEach(draw);const timer=setInterval(()=>{if(running){tick++;charts.forEach(draw);}},250);
  }

  function updateSettings(doc) {
    doc.querySelectorAll('button').forEach(button => {
      if (/^恢复出厂(?:设置|配置)$/.test(button.textContent.trim())) button.style.display = 'none';
    });
    doc.querySelectorAll('.settings-nav button').forEach(button => {
      if (button.querySelector('strong')?.textContent.trim() === '界面展示设置') button.style.display = 'none';
    });
    doc.querySelectorAll('.risk-settings-module > h3').forEach(heading => heading.style.display = 'none');
    doc.querySelectorAll('.risk-drill-entry').forEach(entry => {
      if (!entry.querySelector('.setting-item-icon')) {
        const icon = doc.createElement('span'); icon.className = 'setting-item-icon'; icon.textContent = '⚑'; icon.setAttribute('aria-hidden','true'); entry.prepend(icon);
      }
    });
    doc.querySelectorAll('.settings-workspace .setting-item').forEach(row => {
      const title = row.querySelector('strong')?.textContent.trim();
      if (['测向模式','增益'].includes(title) && !row.closest('[data-debug-detection]')) {
        doc._debugDetectionRows ||= {};
        if (!doc._debugDetectionRows[title]) doc._debugDetectionRows[title] = row.cloneNode(true);
        row.style.display = 'none';
      }
    });
    doc.querySelectorAll('.developer-menu').forEach(menu => {
      if (menu.querySelector('[data-debug-detection]')) return;
      const section = doc.createElement('section'); section.dataset.debugDetection = 'true';
      section.innerHTML = '<h3>探测调试参数</h3><label>测向模式<select><option>全向</option><option>定向</option></select></label><label>增益（0–70）<input type="range" min="0" max="70"><output></output></label>';
      const select = section.querySelector('select'), range = section.querySelector('input'), output = section.querySelector('output');
      select.value = doc.defaultView.localStorage.getItem('debug-direction-mode') || '全向';
      range.value = doc.defaultView.localStorage.getItem('debug-detection-gain') || '35'; output.value = range.value;
      select.addEventListener('change',()=>doc.defaultView.localStorage.setItem('debug-direction-mode',select.value));
      range.addEventListener('input',()=>{output.value=range.value;doc.defaultView.localStorage.setItem('debug-detection-gain',range.value);});
      menu.append(section);
    });
    const workspace = doc.querySelector('.settings-workspace');
    const category = workspace?.querySelector('.workspace-heading strong')?.textContent.trim();
    if (category === '参数设置') {
      workspace.querySelectorAll('section').forEach(section => {
        const title = section.querySelector(':scope > h3')?.textContent.trim();
        if (title === '解密服务器' || title === '探测参数') {
          if (title === '解密服务器' && section.style.display === 'none') section.style.removeProperty('display');
          if (title === '探测参数') section.style.display = 'none';
          section.hidden = false;
        }
      });
    }
    if (category === '界面展示设置') {
      const sections = [...workspace.querySelectorAll('.settings-sections > section')].filter(section => /^(探测界面|告警详情|告警详情展示|告警详情显示)$/.test(section.querySelector(':scope > h3')?.textContent.trim() || ''));
      if (sections.length) {
        doc._relocatedDisplaySections = sections.map(section => section.cloneNode(true));
        sections.forEach(section => { section.style.display = 'none'; });
      }
    }
    if (category === '参数设置' && !workspace.querySelector('[data-relocated-display]')) {
      const detection = [...workspace.querySelectorAll('section')].find(section => section.querySelector(':scope > h3')?.textContent.trim() === '探测参数');
      if (detection && doc._relocatedDisplaySections?.length) {
        let anchor = detection;
        doc._relocatedDisplaySections.forEach(section => {
          section.dataset.relocatedDisplay = 'true';
          section.style.display = '';
          const copy = section.cloneNode(true);
          copy.querySelectorAll('button.toggle').forEach(toggle => toggle.addEventListener('click', () => {
            const on = toggle.classList.toggle('on');
            toggle.setAttribute('aria-checked', String(on));
          }));
          anchor.after(copy);
          anchor = copy;
        });
      } else if (detection && !doc._displayRelocationLoading) {
        const buttons = [...doc.querySelectorAll('.settings-nav button')];
        const display = buttons.find(button => button.querySelector('strong')?.textContent.trim() === '界面展示设置');
        const parameters = buttons.find(button => button.querySelector('strong')?.textContent.trim() === '参数设置');
        if (display && parameters) {
          doc._displayRelocationLoading = true;
          display.click();
          doc.defaultView.setTimeout(() => {
            updateSettings(doc);
            parameters.click();
            doc._displayRelocationLoading = false;
          }, 100);
        }
      }
    }
    doc.querySelectorAll('.settings-nav button').forEach(button => {
      if (button.querySelector('strong')?.textContent.trim() === '网络') button.style.display = 'none';
    });
    doc.querySelectorAll('.setting-item').forEach(row => {
      const title = row.querySelector('strong')?.textContent.trim();
      if (['反制面板显示', '对讲'].includes(title)) row.style.display = 'none';
      if (title === '自动定位' && !row.dataset.customPosition) {
        row.dataset.customPosition = 'true';
        row.querySelector('strong').textContent = '自定义位置';
        const desc = row.querySelector('.setting-item-copy > span');
        if (desc) desc.textContent = '开启后配置设备经纬度';
        const toggle = row.querySelector('.toggle');
        const on = !toggle.classList.contains('on');
        toggle.classList.toggle('on', on);
        toggle.setAttribute('aria-checked', String(on));
        const replacement = toggle.cloneNode(true);
        toggle.replaceWith(replacement);
        replacement.addEventListener('click', () => {
          const enabled = !replacement.classList.contains('on');
          replacement.classList.toggle('on', enabled);
          replacement.setAttribute('aria-checked', String(enabled));
          let fields = row.nextElementSibling;
          if (!fields?.classList.contains('custom-position-fields')) {
            fields = doc.createElement('div'); fields.className = 'custom-position-fields';
            fields.innerHTML = '<label>经度<input type="number" min="-180" max="180" step="0.000001" placeholder="-180～180"></label><label>纬度<input type="number" min="-90" max="90" step="0.000001" placeholder="-90～90"></label>';
            fields.querySelectorAll('input').forEach((input,i) => { input.value = doc.defaultView.localStorage.getItem('custom-coordinate-'+i)||''; input.addEventListener('change',()=>doc.defaultView.localStorage.setItem('custom-coordinate-'+i,input.value)); });
            row.after(fields);
          }
          fields.hidden = !enabled;
        });
      }
    });
    doc.querySelectorAll('.mode-picker').forEach(picker => {
      if (picker.querySelector('[data-standby-mode]')) return;
      const button = doc.createElement('button'); button.type = 'button'; button.dataset.standbyMode = 'true'; button.textContent = '待机模式'; button.setAttribute('role','radio'); button.setAttribute('aria-checked','false');
      button.addEventListener('click', () => { picker.querySelectorAll('button').forEach(item=>{item.classList.toggle('selected',item===button);item.setAttribute('aria-checked',String(item===button));}); doc.defaultView.localStorage.setItem('sky-shield-selected-mode','待机'); });
      picker.insertBefore(button,picker.lastElementChild);
      picker.querySelectorAll('button:not([data-standby-mode])').forEach(item=>item.addEventListener('click',()=>{button.classList.remove('selected');button.setAttribute('aria-checked','false');}));
    });
    doc.querySelectorAll('.runtime-program-settings').forEach(section=>section.style.display='none');
    doc.querySelectorAll('.settings-workspace section').forEach(section => { if (section.querySelector(':scope > h3')?.textContent.trim()==='音量') section.style.display='none'; });
    doc.querySelectorAll('.storage-overview button').forEach(button=>{if(button.textContent.includes('内置磁盘')) button.style.display='none';});
    doc.querySelectorAll('.storage-body h4').forEach(heading=>{if(/分类占用|存储路径配置/.test(heading.textContent)){heading.style.display='none';if(heading.nextElementSibling)heading.nextElementSibling.style.display='none';}});
    doc.querySelectorAll('.alarm-drawer').forEach((drawer,index)=>{drawer.style.display=index?'none':'block';if(!index){drawer.open=true;const summary=drawer.querySelector('summary');if(summary)summary.style.display='none';}});
    doc.querySelectorAll('.risk-settings-module').forEach(module=>{
      if(module.dataset.drillReady)return;module.dataset.drillReady='true';
      const entry=doc.createElement('button');entry.type='button';entry.className='setting-item risk-drill-entry';entry.innerHTML='<div class="setting-item-copy"><strong>风险参数设置</strong><span>配置信任模式与风险等级条件</span></div><span class="ui-disclosure-chevron">⌄</span>';entry.setAttribute('aria-expanded','false');
      const back=doc.createElement('button');back.type='button';back.className='risk-drill-back';back.textContent='‹ 返回参数设置';
      module.prepend(back); module.classList.add('risk-collapsed');module.before(entry);
      entry.addEventListener('click',()=>{const open=module.classList.contains('risk-collapsed');module.classList.toggle('risk-collapsed',!open);entry.setAttribute('aria-expanded',String(open));});
      back.addEventListener('click',()=>{module.classList.add('risk-collapsed');entry.setAttribute('aria-expanded','false');});
    });
    if (category === '参数设置') {
      const displaySection = [...workspace.querySelectorAll('section')].find(section => section.querySelector(':scope > h3')?.textContent.trim() === '告警详情显示');
      const module = workspace.querySelector('.risk-settings-module');
      const entry = workspace.querySelector('.risk-drill-entry');
      if (displaySection && module && entry && entry.parentElement !== displaySection) {
        const firstRow = displaySection.querySelector('.setting-item');
        if (firstRow) firstRow.before(entry); else displaySection.append(entry);
        entry.after(module);
        module.querySelector('.risk-drill-back')?.remove();
        workspace.classList.remove('risk-drill-active');
      }
      if (displaySection) {
        const height = [...workspace.querySelectorAll('.setting-item')].find(row => row.querySelector('strong')?.textContent.trim() === '飞行高度报警阈值');
        if (height && height.parentElement !== displaySection) displaySection.append(height);
        workspace.querySelectorAll('.risk-drill-entry').forEach(item => {
          if (item.parentElement !== displaySection) item.remove();
        });
      }
    }
  }

  function attach(doc) {
    if (!doc?.documentElement) return;
    attachStyles(doc);
    update(doc);
    if (doc.documentElement.dataset.fpvLandscapeDetailObserver) return;
    doc.documentElement.dataset.fpvLandscapeDetailObserver = 'true';
    let pending = false;
    new doc.defaultView.MutationObserver(() => {
      if (pending) return;
      pending = true;
      doc.defaultView.requestAnimationFrame(() => {
        pending = false;
        update(doc);
      });
    }).observe(doc.documentElement, { childList: true, subtree: true });
  }

  function connect() {
    attach(document);
    document.querySelectorAll('iframe').forEach(frame => {
      try { attach(frame.contentDocument); } catch (_) {}
      if (frame.dataset.fpvLandscapeDetailLoad) return;
      frame.dataset.fpvLandscapeDetailLoad = 'true';
      frame.addEventListener('load', () => {
        try { attach(frame.contentDocument); } catch (_) {}
      });
    });
  }

  connect();
  new MutationObserver(connect).observe(document.documentElement, { childList: true, subtree: true });
})();
