# Family Rewards App (Vue + Vite)

A tiny web app where each family member has a task and a reward unlocked after 30 completions. Progress is persisted to disk.

## Features
- Dashboard shows each member with mugshot, task image, reward image
- 30 boxes per member; filled stars represent completed tasks
- Buttons to **Complete** and **Undo** (clamped between 0 and 30)
- Progress **persists** to `data/state.json`
- Easy to customize members/images in `src/main.js`

## Quick Start
1. Ensure you have **Node.js 18+** installed.
2. Unzip the folder and open a terminal in it.
3. Install deps:
   ```bash
   npm install
   ```
4. Start the API server (in one terminal):
   ```bash
   npm run api
   ```
5. Start the Vite dev server (in another terminal):
   ```bash
   npm run dev
   ```
6. Visit http://localhost:5173

## Development Commands
- **Frontend**: `npm run dev` - Starts Vite dev server on port 5173
- **API Server**: `npm run api` - Starts Express API server on port 3001
- **Build**: `npm run build` - Builds the app for production
- **Preview**: `npm run preview` - Preview the production build

## Customize Members
Edit `src/main.js` and modify the `membersConfig` array. For each member define:
```js
{
  id: "unique-id",
  name: "Display Name",
  task: "Task Name",
  reward: "Reward Name",
  avatar: "/img/your-avatar.png",
  taskImg: "/img/your-task.png",
  rewardImg: "/img/your-reward.png"
}
```
If you add new IDs, the server will initialize their count on first update/read.

## Data Persistence
Counts are saved in `data/state.json`. You can back this up or pre-seed values. Deleting the file will reset counts to zero.

## Deploy Notes
- This is now a Vite-based Vue app with a separate Express API server.
- To run on a Raspberry Pi or other device, run both `npm run api` and `npm run dev`.
- To change API port: set the `PORT` environment variable before starting the API server.

Enjoy!
