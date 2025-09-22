import { createApp, reactive, onMounted, onUnmounted, computed } from "vue";
import './style.css';

const membersConfig = [
  {
    id: "aaron",
    name: "Baba",
    task: "Laundry",
    reward: "Spa Day",
    avatar: "/img/m_aaron.svg",
    taskImg: "/img/laundry.avif",
    rewardImg: "/img/pig_spa.png"
  },
  {
    id: "malissa",
    name: "Mahmee",
    task: "Tidy",
    reward: "Spa Day",
    avatar: "/img/m_liz.svg",
    taskImg: "/img/mom_cleaning.png",
    rewardImg: "/img/dog_spa.png"
  },
  {
    id: "malcolm",
    name: "Goh goh",
    task: "Phonics Time",
    reward: "Digital Watch",
    avatar: "/img/m_malcolm.svg",
    taskImg: "/img/phonics.webp",
    rewardImg: "/img/spiderman_watch.png"
  },
  {
    id: "arvin",
    name: "Dai dai",
    task: "Poo/pee in potty",
    reward: "Digital Watch",
    avatar: "/img/m_arvin.svg",
    taskImg: "/img/potty.webp",
    rewardImg: "/img/chase_watch.png"
  }


];

const state = reactive({
  counts: {}, // id -> number
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
    state.counts = data.members || {};
  } catch (e) {
    state.error = 'Failed to load state';
  } finally {
    state.loading = false;
  }
}
async function updateCount(id, delta) {
  console.log('Updating count:', id, delta);
  state.loading = true;
  try {
    const res = await fetch('/api/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, delta })
    });
    const data = await res.json();
    console.log('Update response:', data);
    if (data && data.id) {
      state.counts[data.id] = data.count;
      // Server will broadcast the change to all connected clients via SSE
    }
  } catch (e) {
    console.error('Update failed:', e);
    state.error = 'Failed to update';
  } finally {
    state.loading = false;
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
          if (data.type === 'count-updated') {
            console.log('Updating count from SSE:', data);
            // Show sync indicator briefly
            state.syncing = true;
            setTimeout(() => { state.syncing = false; }, 1000);
            
            // Update local state when another device/tab makes a change
            state.counts[data.id] = data.count;
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
