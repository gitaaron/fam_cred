import { createApp, reactive, onMounted, computed } from "vue";
import './style.css';

const membersConfig = [
  {
    id: "aaron",
    name: "Aaron",
    task: "Make Bed",
    reward: "Digital Watch",
    avatar: "/img/m_aaron.svg",
    taskImg: "/img/task_bed.svg",
    rewardImg: "/img/reward_watch.svg"
  },
  {
    id: "liz",
    name: "Liz",
    task: "Dishes",
    reward: "Spa Day",
    avatar: "/img/m_liz.svg",
    taskImg: "/img/task_dishes.svg",
    rewardImg: "/img/reward_spa.svg"
  },
  {
    id: "malcolm",
    name: "Malcolm",
    task: "Brush Teeth",
    reward: "Lego Set",
    avatar: "/img/m_malcolm.svg",
    taskImg: "/img/task_teeth.svg",
    rewardImg: "/img/reward_lego.svg"
  }
];

const state = reactive({
  counts: {}, // id -> number
  loading: false,
  error: null
});

async function fetchState() {
  state.loading = true;
  try {
    const res = await fetch('/api/state');
    const data = await res.json();
    state.counts = data.members || {};
  } catch (e) {
    state.error = 'Failed to load state';
  } finally {
    state.loading = false;
  }
}
async function updateCount(id, delta) {
  state.loading = true;
  try {
    const res = await fetch('/api/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, delta })
    });
    const data = await res.json();
    if (data && data.id) {
      state.counts[data.id] = data.count;
    }
  } catch (e) {
    state.error = 'Failed to update';
  } finally {
    state.loading = false;
  }
}

const App = {
  setup() {
    onMounted(fetchState);
    const members = membersConfig;

    function starsArray(count) {
      const total = 30;
      const arr = Array.from({ length: total }, (_, i) => i < count);
      return arr;
    }
    function percent(count) {
      return Math.round((count / 30) * 100);
    }
    function getCount(id) {
      return state.counts[id] ?? 0;
    }

    return { members, state, updateCount, starsArray, percent, getCount };
  },
  template: `
    <div class="container">
      <div class="header">
        <div class="title">🏆 Family Rewards Dashboard</div>
        <div v-if="state.loading" class="sub">Syncing…</div>
      </div>

      <div class="grid">
        <div class="card" v-for="m in members" :key="m.id">
          <div class="card-header">
            <img class="avatar" :src="m.avatar" :alt="m.name" />
            <div class="person">
              <div class="name">{{ m.name }}</div>
              <div class="sub">Task: {{ m.task }} • Reward: {{ m.reward }}</div>
            </div>
          </div>

          <div class="media-row">
            <div class="media">
              <span class="badge">Task</span>
              <img :src="m.taskImg" :alt="m.task" />
            </div>
            <div class="media">
              <span class="badge">Reward (after 30)</span>
              <img :src="m.rewardImg" :alt="m.reward" />
            </div>
          </div>

          <div class="progress">
            <div class="count">Progress: {{ getCount(m.id) }}/30</div>
            <div class="bar"><div class="fill" :style="{ width: percent(getCount(m.id)) + '%' }"></div></div>
          </div>

          <div class="boxes">
            <div class="box" v-for="(filled, i) in starsArray(getCount(m.id))" :key="i">
              <span v-if="filled">★</span>
            </div>
          </div>

          <div class="controls">
            <button class="danger" @click="updateCount(m.id, -1)">– Undo</button>
            <button class="primary" @click="updateCount(m.id, 1)">+ Complete</button>
          </div>
        </div>
      </div>

      <div class="footer">
        Hardcode your own family in <code>src/main.js</code> by editing <code>membersConfig</code>. Counts are saved in <code>data/state.json</code>.
      </div>
    </div>
  `
};

createApp(App).mount('#app');
