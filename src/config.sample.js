// Configuration for family members, tasks, and rewards
// Each member has arrays of tasks and rewards.
// - Task: { title, img, stars } where stars is how many stars granted per completion
// - Reward: { title, img, cost } where cost is stars required to redeem

export const membersConfig = [
  {
    id: "aaron",
    name: "Baba",
    avatar: "/img/m_aaron.svg",
    tasks: [
      {
        title: "Laundry",
        img: "/img/laundry.avif",
        units: [
          { label: "1 load", stars: 3 },
          { label: "Fold + put away", stars: 2 }
        ]
      },
      {
        title: "Language Learning",
        img: "/img/learn_french.png",
        units: [
          { label: "1 book review", stars: 5 },
          { label: "1 Duolingo unit", stars: 1 }
        ]
      }
    ],
    rewards: [
      { title: "Spa Day", img: "/img/pig_spa.png", cost: 30 },
      { title: "Climb Day", img: "/img/pig_spa.png", cost: 30 }

    ]
  },
  {
    id: "malissa",
    name: "Mahmee",
    avatar: "/img/m_liz.svg",
    tasks: [
      {
        title: "Tidy",
        img: "/img/mom_cleaning.png",
        units: [
          { label: "1 pile", stars: 5 },
          { label: "1 drawer", stars: 5 },
          { label: "5 hangers", stars: 5 },
          { label: "1 box", stars: 5 }
        ]
      }
    ],
    rewards: [
      { title: "Spa Day", img: "/img/dog_spa.png", cost: 30 }
    ]
  },
  {
    id: "malcolm",
    name: "Goh goh",
    avatar: "/img/m_malcolm.svg",
    tasks: [
      {
        title: "Phonics Time",
        img: "/img/phonics.webp",
        units: [
          { label: "10 words", stars: 1 }
        ]
      }
    ],
    rewards: [
      { title: "Digital Watch", img: "/img/spiderman_watch.png", cost: 30 }
    ]
  },
  {
    id: "arvin",
    name: "Dai dai",
    avatar: "/img/m_arvin.svg",
    tasks: [
      {
        title: "Poo/pee in potty",
        img: "/img/potty.webp",
        units: [
          { label: "Success", stars: 1 }
        ]
      }
    ],
    rewards: [
      { title: "Digital Watch", img: "/img/chase_watch.png", cost: 30 }
    ]
  }
];


