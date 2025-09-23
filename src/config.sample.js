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
      { title: "Laundry", img: "/img/laundry.avif", stars: 1 },
      { title: "Make Bed", img: "/img/make_bed.avif", stars: 1 }
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
      { title: "Tidy", img: "/img/mom_cleaning.png", stars: 1 }
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
      { title: "Phonics Time", img: "/img/phonics.webp", stars: 1 }
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
      { title: "Poo/pee in potty", img: "/img/potty.webp", stars: 1 }
    ],
    rewards: [
      { title: "Digital Watch", img: "/img/chase_watch.png", cost: 30 }
    ]
  }
];


