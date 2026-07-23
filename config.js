// Global configuration for the Retro Romantic Birthday Surprise Website.
// Edit this file to customize the general site content, timeline, wishes, and memory jar messages.

const SITE_CONFIG = {
  // Audio Config
  music: {
    url: "music/music.mp3",
    volume: 0.4, // Volume from 0.0 to 1.0
    fadeInDuration: 3, // Fade-in duration in seconds
    synthFallback: true, // If true, plays a beautiful soft synth melody if music.mp3 is missing or fails
  },

  // Loading Screen Romantic Notes
  loadingNotes: [
    "Loading Memories...",
    "Preparing Something Special...",
    "Collecting My Feelings...",
    "Opening My Heart...",
    "Just One More Moment...",
    "Recalling the first time I saw you...",
    "Gathering our brightest smiles...",
    "Unfolding our timeline...",
    "Weaving love into code...",
  ],

  // Extra Emotional Features config

  // 1. Timeline Events
  timeline: [
    {
      date: "The Day We Met",
      title: "The Spark",
      desc: "it was a simple movement but aa time na life lo marchipoleni time and day .",
    },
    {
      date: "First Late Night Talk",
      title: "Losing Track of Time",
      desc: "We talked for hours about everything and nothing. The stars outside were bright, but our conversation was brighter.",
    },
    {
      date: "Our First Memory",
      title: "Unforgettable Smile",
      desc: "That exact moment when I realized your laughter was my favorite sound in the whole world.",
    },
    {
      date: "",
      title: "Happy Birthday!",
      desc: "A celebration of you, the person who makes every single day worth smiling and make my life . And here's to many more memories.",
    },
  ],

  // 2. "Open When" Envelopes content
  openWhenEnvelopes: [
    {
      trigger: "Open when you're sad",
      title: "A Hug in Words",
      content:
        "Hey, kallu moosko... Take a deep breath., nuv elanti situation lo ayia nen strong ga vunta anuko... nen eppudu nee pakkane bangaaram nen vunnade ne koosam bangaaram nuv deniki evvariki bayapadodhu ....nuv first chinna chinna visyalaku bada padaku main ga edavaku bangaaram naa valla kadu ...💘💘 nen vunna kada...😘",
    },
    {
      trigger: "Open when you miss me",
      title: "close your eyes",
      content:
        "bangaaram em feel avvadhu bangaaram nen eppudu nee pakkane vunta ....nsnnu miss avuthunnava...nmanam edaram kalisi gadina happy movements gurthu thechuko nen eppudu ne thone nee vente vunta ney bangaaruu....",
    },
    {
      trigger: "Open when you smile",
      title: "Keep it Glowing",
      content:
        "Your smile is contagious! It lights up my whole world. Do me a favor: take a selfie of that beautiful smile right now, or just keep carrying that light with you. You make this world a better place just by being in it! 🥰😘",
    },
  ],

  // 3. Memory Jar messages (randomized on click)
  memoryJarMessages: [
    "You are the sunshine on my rainiest days. ☀️",
    "I still get butterflies thinking about our first conversation. 🦋",
    "Your laugh is, and always will be, my favorite song. 🎵",
    "Thank you for being my safe haven and my happiest thought. 🏡",
    "You make even the most ordinary moments feel like magic. ✨",
    "No matter how busy life gets, you are always my favorite pause. ☕",
    "You have the kindest heart I've ever known. ❤️",
    "If I could write a story of my life, you'd be my favorite chapter. 📖",
  ],

  // 4. Floating handwritten sticky notes compliments
  compliments: [
    "You are beautiful inside and out ✨",
    "Your kindness is a superpower 🌸",
    "I love the way you think 🧠",
    "You make my world so bright ☀️",
    "You are my favorite distraction 💭",
    "Your voice feels like home 🏡",
  ],

  // Final Birthday Wishes Sequence
  birthdayWishes: [
    "Happy Birthday ❤️",
    "You are one of the most beautiful parts of my life.",
    "Thank you for every smile.",
    "Thank you for every memory.",
    "May your life always be filled with happiness, peace, laughter, success and endless love.",
    "I hope every dream of yours becomes true.",
    "No matter where life takes us...",
    "You will always have a special place in my heart.",
    "Happy Birthday Once Again ❤️",
  ],

  // 5. Swipeable Retro Photo Gallery (14 Photos)
  gallery: [
    { image: "images/gallery/photo1.jpeg", caption: "Your beautiful smile... 🥰" },
    { image: "images/gallery/photo2.jpeg", caption: "The beginning of us... 💘" },
    { image: "images/gallery/photo3.jpeg", caption: "A special day... 💖" },
    { image: "images/gallery/photo4.jpeg", caption: "Holding you close in my heart... ✨" },
    { image: "images/gallery/photo5.jpeg", caption: "Our favorite conversation... 💬" },
    { image: "images/gallery/photo6.jpeg", caption: "When time stood still... ⏳" },
    { image: "images/gallery/photo7.jpeg", caption: "Your laugh, my favorite melody... 🎵" },
    { image: "images/gallery/photo8.png",  caption: "A dream come true... 🌟" },
    { image: "images/gallery/WhatsApp Image 2026-07-23 at 9.55.06 PM.jpeg", caption: "Sweetest memory together... ❤️" },
    { image: "images/gallery/WhatsApp Image 2026-07-23 at 9.55.06 PM (1).jpeg", caption: "My happiness... 🌸" },
    { image: "images/gallery/WhatsApp Image 2026-07-23 at 9.55.07 PM.jpeg", caption: "Precious moments... 💎" },
    { image: "images/gallery/WhatsApp Image 2026-07-23 at 9.55.07 PM (1).jpeg", caption: "Love you bangaaram... 😘" },
    { image: "images/gallery/WhatsApp Image 2026-07-23 at 9.55.07 PM (2).jpeg", caption: "Forever in my heart... 🔐" },
    { image: "images/gallery/WhatsApp Image 2026-07-23 at 9.55.32 PM.jpeg", caption: "Together always & forever... 🥂" }
  ],
};

// Expose config globally
window.SITE_CONFIG = SITE_CONFIG;
