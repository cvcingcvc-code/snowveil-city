/*
 * 任务数据层：与渲染 / 引擎解耦的纯数据 + 状态机。
 * 剧情文本复用自 2D 原型 ../snow-city/js/story.js 的世界观与角色关系。
 * 后续迁移 Godot 时，本文件的数据可几乎原样转为 GDScript Resource。
 */
export const QUEST = {
  id: 'ch1_letter',
  title: '第一章 · 初雪来信',
  steps: [
    { id: 'accept', hint: '到「暖炉咖啡」门口找阿澈，领取那封信' },
    { id: 'drive', hint: '驾车前往东端公交站，把信交给老K' },
    { id: 'done', hint: '任务完成 · 雪港的夜晚才刚刚开始' }
  ],
  dialogue: {
    accept: [
      { name: '阿澈', hero: false, text: '你真的来了。三年没见，你还是这副表情。' },
      { name: '白雪', hero: true, text: '我不记得有约过你。事实上，我什么都不记得。' },
      { name: '阿澈', hero: false, text: '（递过一封信）这封信必须今晚送到老K手上。他在东边的公交站。开车去，别走小路。' },
      { name: '白雪', hero: true, text: '老K……名字有点耳熟。' }
    ],
    deliver: [
      { name: '老K', hero: false, text: '阿澈的人？信我收到了。' },
      { name: '白雪', hero: true, text: '他说冰湖那边有动静。' },
      { name: '老K', hero: false, text: '……嗯。替我谢谢他。也告诉他，别再让那姑娘一个人走夜路。' },
      { name: '白雪', hero: true, text: '（系统提示）任务完成 · 初雪来信' }
    ],
    idleAche: [{ name: '阿澈', hero: false, text: '信送到了吗？老K那个人，嘴硬但心软。' }],
    idleK: [{ name: '老K', hero: false, text: '这座城里，沉默比子弹便宜，也比子弹管用。' }]
  }
};

export function createQuest({ ui, npcs, onComplete }) {
  const state = {
    index: 0,
    started: false,
    completed: false,
    get step() { return QUEST.steps[this.index]; },
    refresh() {
      npcs.ache.setHighlight(this.index === 0 && !this.started);
      npcs.k.setHighlight(this.index === 1);
      ui.setQuest(this.completed ? QUEST.steps[2].hint : this.step.hint);
      ui.renderQuestLog(QUEST, this.index, this.completed);
    },
    interact(npcId) {
      if (npcId === 'ache') {
        npcs.ache.talk(ui.playerPosition);
        if (!this.started) {
          this.started = true;
          ui.dialogue(QUEST.dialogue.accept, () => { this.index = 1; this.refresh(); });
        } else ui.dialogue(QUEST.dialogue.idleAche);
        return true;
      }
      if (npcId === 'k') {
        npcs.k.talk(ui.playerPosition);
        if (this.index === 1) {
          ui.dialogue(QUEST.dialogue.deliver, () => {
            this.index = 2; this.completed = true; this.refresh();
            if (onComplete) onComplete();
          });
        } else ui.dialogue(QUEST.dialogue.idleK);
        return true;
      }
      return false;
    }
  };
  return state;
}
