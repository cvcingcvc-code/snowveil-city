const $ = id => document.getElementById(id);

export function createUI() {
  const ui = {
    playerPosition: { x: 0, z: 0 },
    dlg: null,
    toastTimer: null,

    hideLoading() { $('loading').classList.add('hidden'); $('hud').classList.remove('hidden'); },
    fatal(err) {
      $('fatal').classList.remove('hidden');
      $('fatal').textContent = '运行错误：\n' + (err && err.stack ? err.stack : err);
    },
    setQuest(text) { $('quest-line').textContent = text; },
    setMode(text) { $('mode-card').textContent = text; },
    showInteract(text) {
      $('interact').classList.remove('hidden');
      $('interact-text').textContent = text;
    },
    hideInteract() { $('interact').classList.add('hidden'); },
    toast(text) {
      $('toast').textContent = text;
      $('toast').classList.remove('hidden');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => $('toast').classList.add('hidden'), 2400);
    },

    renderQuestLog(quest, index, completed) {
      const body = $('panel-body');
      body.innerHTML =
        `<div style="font-weight:700;color:#3d5271;margin-bottom:10px">${quest.title}</div>` +
        quest.steps.map((s, i) => {
          const cls = i < index || completed ? 'done' : (i === index ? 'active' : '');
          return `<div class="quest-step ${cls}">${i === index || completed ? '◆' : '◇'} ${s.hint}</div>`;
        }).join('') +
        `<div style="font-size:10px;color:#93a3ba;margin-top:14px">当前阶段：${index} / ${quest.steps.length}</div>`;
    },

    showPanel(kind) {
      if (!$('panel').classList.contains('hidden') && $('panel-title').textContent === (kind === 'quest' ? '任务日志' : '操作说明')) {
        $('panel').classList.add('hidden'); return;
      }
      $('panel-title').textContent = kind === 'quest' ? '任务日志' : '操作说明';
      $('panel-body').innerHTML = kind === 'quest' ? '<div style="color:#93a3ba">任务载入中…</div>' : `
        <div style="line-height:2">
          <b>WASD</b> 移动　<b>鼠标</b> 视角<br>
          <b>Shift</b> 奔跑　<b>Space</b> 跳跃<br>
          <b>E</b> 互动 / 上下车<br>
          <b>M</b> 任务日志　<b>H</b> 帮助<br>
          <b>Esc</b> 释放鼠标 / 暂停<br><br>
          <span style="color:#8b9bb2;font-size:11px">点击画面锁定鼠标。靠近金色标记的人物按 E 推进剧情。</span>
        </div>`;
      $('panel').classList.remove('hidden');
    },
    closePanel() { $('panel').classList.add('hidden'); },

    dialogue(lines, cb) {
      if (!lines || !lines.length) { if (cb) cb(); return; }
      this.dlg = { lines, i: 0, shown: 0, full: '', cb };
      $('dialogue').classList.remove('hidden');
      this.renderLine();
    },
    renderLine() {
      const d = this.dlg; if (!d) return;
      const line = d.lines[d.i];
      $('dlg-name').textContent = line.name;
      const img = document.querySelector('.dlg-portrait img');
      const ini = $('dlg-initial');
      if (line.hero) { img.classList.remove('hidden'); ini.classList.add('hidden'); }
      else {
        img.classList.add('hidden'); ini.classList.remove('hidden'); ini.textContent = line.name.charAt(0);
      }
      d.full = line.text; d.shown = 0;
      $('dlg-text').textContent = '';
    },
    advanceDialogue() {
      const d = this.dlg; if (!d) return false;
      if (d.shown < d.full.length) {
        d.shown = d.full.length;
        $('dlg-text').textContent = d.full;
        return true;
      }
      d.i++;
      if (d.i >= d.lines.length) {
        $('dialogue').classList.add('hidden');
        this.dlg = null;
        if (d.cb) d.cb();
      } else this.renderLine();
      return true;
    },
    tickDialogue(dt) {
      const d = this.dlg;
      if (!d) return;
      if (d.shown < d.full.length) {
        d.shown = Math.min(d.full.length, d.shown + dt * 48);
        $('dlg-text').textContent = d.full.slice(0, Math.floor(d.shown));
      }
    },
    isDialogueActive() { return !!this.dlg; },

    // 任务目标在屏幕上的投影标签（由 main 每帧调用）
    updateMarker(label, screen) {
      const el = $('marker-label');
      if (!screen) { el.classList.add('hidden'); return; }
      el.classList.remove('hidden');
      el.textContent = label;
      el.style.left = screen.x + 'px';
      el.style.top = screen.y + 'px';
    }
  };
  $('panel-close').onclick = () => ui.closePanel();
  $('dialogue').onclick = () => ui.advanceDialogue();
  return ui;
}
