import { createApp, reactive, onMounted, onUnmounted } from "vue";
import './style.css';
import { membersConfig } from './config.js';

const state = reactive({
  members: {}, // id -> { stars, taskIndex, rewardIndex, redemptions }
  loading: false,
  error: null,
  syncing: false // for cross-tab sync indicator
});

// Server-Sent Events for real-time sync across devices
let eventSource = null;

async function fetchState() {
  state.loading = true;
  try {
    const res = await fetch('/api/state');
    const data = await res.json();
    state.members = data.members || {};
  } catch (e) {
    state.error = 'Failed to load state';
  } finally {
    state.loading = false;
  }
}
async function updateStars(id, delta) {
  console.log('Updating stars:', id, delta);
  state.loading = true;
  try {
    const res = await fetch('/api/stars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, delta })
    });
    const data = await res.json();
    console.log('Stars response:', data);
    if (data && data.id) {
      const member = state.members[data.id] || { stars: 0, taskIndex: 0, rewardIndex: 0, redemptions: {} };
      member.stars = data.stars;
      state.members[data.id] = member;
    }
  } catch (e) {
    console.error('Update failed:', e);
    state.error = 'Failed to update';
  } finally {
    state.loading = false;
  }
}

async function updateIndex(id, which, index) {
  try {
    const res = await fetch('/api/index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, which, index })
    });
    const data = await res.json();
    if (data && data.id) {
      const member = state.members[data.id] || {};
      if (which === 'task') member.taskIndex = data.index; else member.rewardIndex = data.index;
      state.members[data.id] = member;
    }
  } catch (e) {
    console.error('Index update failed', e);
  }
}

async function redeemAction(id, rewardKey, cost, action) {
  try {
    const res = await fetch('/api/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, rewardKey, cost, action })
    });
    const data = await res.json();
    if (data && data.id) {
      const member = state.members[data.id] || {};
      member.stars = data.stars;
      const red = member.redemptions || {};
      red[rewardKey] = data.redeemedCount;
      member.redemptions = red;
      state.members[data.id] = member;
    }
  } catch (e) {
    console.error('Redeem failed', e);
  }
}

const App = {
  setup() {
    onMounted(() => {
      fetchState();
      
      // Connect to Server-Sent Events for real-time updates
      console.log('Connecting to SSE...');
      eventSource = new EventSource('/api/events');
      
      eventSource.onopen = () => {
        console.log('SSE connection opened');
      };
      
      eventSource.onmessage = (event) => {
        console.log('SSE message received:', event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'count-updated' || data.type === 'stars-updated') {
            console.log('Updating stars from SSE:', data);
            // Show sync indicator briefly
            state.syncing = true;
            setTimeout(() => { state.syncing = false; }, 1000);
            
            // Update local state when another device/tab makes a change
            const member = state.members[data.id] || { stars: 0, taskIndex: 0, rewardIndex: 0, redemptions: {} };
            member.stars = data.stars ?? data.count ?? 0;
            state.members[data.id] = member;
          } else if (data.type === 'index-updated') {
            const member = state.members[data.id] || { stars: 0, taskIndex: 0, rewardIndex: 0, redemptions: {} };
            if (data.which === 'task') member.taskIndex = data.index; else member.rewardIndex = data.index;
            state.members[data.id] = member;
            state.syncing = true;
            setTimeout(() => { state.syncing = false; }, 500);
          } else if (data.type === 'redeem-updated') {
            const member = state.members[data.id] || { stars: 0, taskIndex: 0, rewardIndex: 0, redemptions: {} };
            const red = member.redemptions || {};
            red[data.rewardKey] = data.count;
            member.redemptions = red;
            state.members[data.id] = member;
          } else if (data.type === 'connected') {
            console.log('SSE connection confirmed');
          }
        } catch (e) {
          console.error('Error parsing SSE message:', e);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error, 'ReadyState:', eventSource.readyState);
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (eventSource && eventSource.readyState === EventSource.CLOSED) {
            console.log('Attempting to reconnect SSE...');
            eventSource = new EventSource('/api/events');
          }
        }, 5000);
      };
    });
    
    onUnmounted(() => {
      // Clean up the SSE connection
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    });
    
    const members = membersConfig.map(m => ({
      ...m,
      task: m.tasks?.[0]?.title ?? '',
      taskImg: m.tasks?.[0]?.img ?? '',
      reward: m.rewards?.[0]?.title ?? '',
      rewardImg: m.rewards?.[0]?.img ?? ''
    }));

    function getMemberState(id) {
      return state.members[id] || { stars: 0, taskIndex: 0, rewardIndex: 0, redemptions: {} };
    }
    function currentTask(member) {
      const ms = getMemberState(member.id);
      const idx = Math.min(ms.taskIndex || 0, Math.max(0, (member.tasks?.length || 1) - 1));
      return { idx, item: member.tasks?.[idx] };
    }
    function currentReward(member) {
      const ms = getMemberState(member.id);
      const idx = Math.min(ms.rewardIndex || 0, Math.max(0, (member.rewards?.length || 1) - 1));
      return { idx, item: member.rewards?.[idx] };
    }
    function starsArray(stars, cost) {
      const total = cost || 30;
      return Array.from({ length: total }, (_, i) => i < Math.min(stars, total));
    }
    function canRedeem(stars, cost) {
      return (stars || 0) >= (cost || 0);
    }
    function isDashboard() {
      return document.body.classList.contains('dashboard');
    }

    function handleComplete(member, task, sign) {
      if (!task) return;
      const delta = (task.stars || 1) * (sign > 0 ? 1 : -1);
      updateStars(member.id, delta);
    }
    function changeIndex(member, which, direction) {
      const list = which === 'task' ? (member.tasks || []) : (member.rewards || []);
      if (list.length <= 1) return;
      const ms = getMemberState(member.id);
      const cur = which === 'task' ? (ms.taskIndex || 0) : (ms.rewardIndex || 0);
      const next = (cur + direction + list.length) % list.length;
      updateIndex(member.id, which, next);
    }
    function handleRedeem(member) {
      const { idx, item } = currentReward(member);
      if (!item) return;
      redeemAction(member.id, `reward:${idx}`, item.cost || 0, 'redeem');
    }
    function handleUndoRedeem(member) {
      const { idx, item } = currentReward(member);
      if (!item) return;
      redeemAction(member.id, `reward:${idx}`, item.cost || 0, 'undo');
    }

    return { members, state, getMemberState, currentTask, currentReward, starsArray, canRedeem, isDashboard, handleComplete, changeIndex, handleRedeem, handleUndoRedeem };
  },
  template: `
    <div class="container">
      <div class="header">
        <div class="title">
          <img src="/img/trophy.svg" alt="Trophy" style="width: 44px; height: 44px; margin-right: 8px; vertical-align: middle;" 
               onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';">
          <div class="trophy-icon" style="display: none;"></div>
          Home Cred
        </div>
        <div v-if="state.loading" class="sub">Syncing…</div>
        <div v-else-if="state.syncing" class="sub">🔄 Updated from another device</div>
      </div>

      <div class="grid">
        <div class="card" v-for="m in members" :key="m.id">
          <div class="card-header">
            <img class="avatar" :src="m.avatar" :alt="m.name" />
            <div class="person">
              <div class="name">{{ m.name }}</div>
              <div class="sub">Task: {{ currentTask(m).item?.title || m.task }} • Reward: {{ currentReward(m).item?.title || m.reward }}</div>
            </div>
          </div>

          <div class="media-row">
            <div class="media">
              <div class="row-between">
                <span class="badge">Task</span>
                <div class="carousel-nav" v-if="(m.tasks?.length||0) > 1">
                  <button @click="changeIndex(m,'task',-1)">◀</button>
                  <span class="index">{{ (getMemberState(m.id).taskIndex||0)+1 }}/{{ m.tasks.length }}</span>
                  <button @click="changeIndex(m,'task',1)">▶</button>
                </div>
              </div>
              <img :src="(currentTask(m).item?.img || m.taskImg)" :alt="(currentTask(m).item?.title || m.task)" />
              <div class="controls under-media" v-if="!isDashboard()">
                <button class="danger" @click="handleComplete(m, currentTask(m).item, -1)">– Undo</button>
                <button class="primary" @click="handleComplete(m, currentTask(m).item, 1)">+ Complete</button>
                <span class="sub" v-if="currentTask(m).item">+{{ currentTask(m).item.stars || 1 }}★</span>
              </div>
            </div>
            <div class="media">
              <div class="row-between">
                <span class="badge">Reward</span>
                <div class="carousel-nav" v-if="(m.rewards?.length||0) > 1">
                  <button @click="changeIndex(m,'reward',-1)">◀</button>
                  <span class="index">{{ (getMemberState(m.id).rewardIndex||0)+1 }}/{{ m.rewards.length }}</span>
                  <button @click="changeIndex(m,'reward',1)">▶</button>
                </div>
              </div>
              <img :src="(currentReward(m).item?.img || m.rewardImg)" :alt="(currentReward(m).item?.title || m.reward)" />
              <div class="controls under-media" v-if="!isDashboard()">
                <button class="primary" :disabled="!canRedeem(getMemberState(m.id).stars, currentReward(m).item?.cost)" @click="handleRedeem(m)">Redeem</button>
                <button class="danger" :disabled="!(getMemberState(m.id).redemptions && getMemberState(m.id).redemptions['reward:'+currentReward(m).idx] > 0)" @click="handleUndoRedeem(m)">Undo</button>
                <span class="sub" v-if="currentReward(m).item">Cost: {{ currentReward(m).item.cost }}★</span>
              </div>
            </div>
          </div>

          <div class="progress">
            <div class="count">Stars: {{ getMemberState(m.id).stars || 0 }}</div>
            <div class="bar"><div class="fill" :style="{ width: Math.min(100, Math.round(((getMemberState(m.id).stars||0) / (currentReward(m).item?.cost || 30)) * 100)) + '%' }"></div></div>
          </div>

          <div class="boxes">
            <div class="box" v-for="(filled, i) in starsArray(getMemberState(m.id).stars || 0, currentReward(m).item?.cost || 30)" :key="i">
              <span v-if="filled">★</span>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        Configure your family in <code>src/config.js</code>. Stars are saved in <code>data/state.json</code>.
      </div>
    </div>
  `
};

createApp(App).mount('#app');
