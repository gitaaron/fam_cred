// Configuration for family members, tasks, and rewards
// Each member has arrays of tasks and rewards.
// - Task: { title, img, stars } where stars is how many stars granted per completion
// - Reward: { title, img, cost } where cost is stars required to redeem
//
//

// Tasks

const tidyTask = {
  title: "Tidy",
  img: "/img/tasks/declutter.png",
  units: [
    { label: "1 pile", stars: 5 },
    { label: "1 drawer", stars: 5 },
    { label: "5 hangers", stars: 5 },
    { label: "1 box", stars: 5 }
  ]
}

const learnFrenchTask = {
  title: "French Learning",
  img: "/img/tasks/learn_french.png",
  units: [
    { label: "1 book review", stars: 5 },
    { label: "1 Duolingo unit", stars: 1 }
  ]
}

const learnPhonicsTask = {
  title: "Learn Phonics",
  img: "/img/tasks/learn_phonics.png",
  units: [
    { label: "10 words", stars: 1 }
  ]
}

const pottyTask = {
  title: "Poo/pee in potty",
  img: "/img/tasks/use_potty.png",
  units: [
    { label: "Success", stars: 1 }
  ]
}

// Rewards

const spaReward = { title: "Spa Day", img: "/img/rewards/spa_day.png", cost: 30 }

const climbingReward = { title: "Climb Day", img: "/img/rewards/climbing.png", cost: 15 }

const spidermanWatchReward = { title: "Digital Watch", img: "/img/rewards/spiderman_watch.png", cost: 30 }

const chaseWatchReward = { title: "Digital Watch", img: "/img/rewards/chase_watch.png", cost: 30 }


export const membersConfig = [
  {
    id: "aaron",
    name: "Baba",
    avatar: "/img/sample_people/m_baba.svg",
    tasks: [
      tidyTask,
      learnFrenchTask,
    ],
    rewards: [
      spaReward,
      climbingReward,
    ]
  },
  {
    id: "malissa",
    name: "Mahmee",
    avatar: "/img/sample_people/m_mahmee.svg",
    tasks: [
      tidyTask,
    ],
    rewards: [
      spaReward,
    ]
  },
  {
    id: "malcolm",
    name: "Goh goh",
    avatar: "/img/sample_people/m_gohgoh.svg",
    tasks: [
      learnPhonicsTask
    ],
    rewards: [
      spidermanWatchReward
    ]
  },
  {
    id: "arvin",
    name: "Dai dai",
    avatar: "/img/sample_people/m_daidai.svg",
    tasks: [
      pottyTask
    ],
    rewards: [
      chaseWatchReward
    ]
  }
];


