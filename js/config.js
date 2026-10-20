/**
 * Centralized Configuration for Birthday Surprise Experience
 * Personalization for Rithika's 20th Birthday
 * From brother & best friend Boopi
 */
export const CONFIG = {
  // Recipient & Sender Information
  recipientName: "Rithika",
  nickname: "Rithi",
  senderName: "Boopi",
  unlockCode: "2110",

  // Audio Configuration
  song: {
    title: "Birthday Song",
    url: "audio/WhatsApp Audio 2026-10-20 at 10.52.28 PM.mpeg",
    autoPlayPrompt: true
  },
  soundEffects: {
    pop: "assets/audio/pop.mp3",
    shutter: "assets/audio/shutter.mp3"
  },

  // Opening & Reveal
  coverPhoto: "assets/photos/reveal.jpg",
  lockPhoto: "assets/photos/lock.jpg",
  openingTitle: "Something Special For You",
  birthdayMessage: "Happy 20th Birthday to my incredible younger sister and best friend! Another milestone year of your wonderful smile, kindness, and character. I hope your twenties bring you all the joy, love, and dreams you truly deserve.",

  // Balloon Wishes (4 Balloons revealing: YOU ARE SO SPECIAL)
  balloons: [
    { word: "YOU", color: "pink", icon: "assets/ref/19e1f36b553a.webp" },
    { word: "ARE", color: "peach", icon: "assets/ref/485e4628b9ce.webp" },
    { word: "SO", color: "yellow", icon: "assets/ref/6655c2739b61.webp" },
    { word: "SPECIAL", color: "rose", icon: "assets/ref/7e0071ea2bf5.webp" }
  ],

  // Cake Scene Details
  cake: {
    totalCandles: 5,
    title: "It's Your Surprise!",
    subtitle: "Blow the candles and see what's inside 🎂",
    cutHint: "Drag the knife along the sparkling line to cut the cake"
  },

  // Albums Photo Gallery (Exactly 10 Independent Photo Slots, 1-10)
  albums: [
    {
      slot: 1,
      src: "images/photo1.jpg",
      title: "Playful Peace & Pure Joy",
      subtitle: "Your cheerful peace sign and playful vibe always light up the whole room.",
      tapeColor: "tape-pink"
    },
    {
      slot: 2,
      src: "images/photo2.jpg",
      title: "Graceful & Divine",
      subtitle: "Holding the peacock feather with that serene, gentle smile that warms my heart.",
      tapeColor: "tape-gold"
    },
    {
      slot: 3,
      src: "images/photo3.jpg",
      title: "Radiant in Orange",
      subtitle: "That candid, effortless smile of yours brings so much warmth and brightness everywhere.",
      tapeColor: "tape-rose"
    },
    {
      slot: 4,
      src: "images/photo4.jpg",
      title: "Traditional Elegance",
      subtitle: "Draped in pure grace and golden smiles, looking absolutely stunning in traditional wear.",
      tapeColor: "tape-pink"
    },
    {
      slot: 5,
      src: "images/photo5.jpg",
      title: "Rooftop Breezes & Sweet Smiles",
      subtitle: "Standing under the open sky with that sweet smile that never fails to make me proud.",
      tapeColor: "tape-gold"
    },
    {
      slot: 6,
      src: "images/photo6.jpg",
      title: "Golden Hour Glow",
      subtitle: "Bathed in sunlight with gorgeous wavy hair and that effortless, quiet confidence.",
      tapeColor: "tape-rose"
    },
    {
      slot: 7,
      src: "images/photo7.jpg",
      title: "Classic & Fashionable",
      subtitle: "A timeless black-and-white portrait showing off your unmatched style and joyful spirit.",
      tapeColor: "tape-pink"
    },
    {
      slot: 8,
      src: "images/photo8.jpg",
      title: "Retro Chic & Cool Vibes",
      subtitle: "Rocking those cool shades with that signature playful charm only you have.",
      tapeColor: "tape-gold"
    },
    {
      slot: 9,
      src: "images/photo9.jpg",
      title: "Sweet & Thoughtful Moments",
      subtitle: "That soft, dreamy look and gentle heart that make you the sweetest sister ever.",
      tapeColor: "tape-rose"
    },
    {
      slot: 10,
      src: "images/photo10.jpg",
      title: "Pure Happiness & Laughter",
      subtitle: "Sitting on the terrace with pure joy in your eyes, ready to embrace your twenties.",
      tapeColor: "tape-gold"
    }
  ],
  // Backward compatibility alias
  get memories() { return this.albums; },

  // Letters in Envelopes (4 Envelopes)
  letters: [
    {
      id: 1,
      heading: "To My Little Sister",
      body: "From the very beginning, having you as my younger sister has been such a wonderful blessing. Watching you step into your twenties today fills me with so much pride and joy. You bring warmth, laughter, and brightness into my life just by being yourself. Happy 20th Birthday, Rithi!"
    },
    {
      id: 2,
      heading: "Tuition Days & Pongal",
      body: "Do you remember the days when we first met at tuition? That was where it all began! And I'll never forget when you fed me Pongal back then. Who knew that a simple tuition class would give me a little sister and an absolute best friend for life?"
    },
    {
      id: 3,
      heading: "What I Cherish Most",
      body: "If anyone ever asks me what I admire most about you, it will always be your character. You have a heart of gold, genuine kindness, and a smile that lights up any room. In all these years, we've never even had a major fight — and that speaks volumes about our bond."
    },
    {
      id: 4,
      heading: "Happy 20th Birthday, Rithi!",
      body: "20 is a big milestone, and I know this year is going to bring incredible new adventures for you. Keep smiling, keep shining, and never change who you are. Remember that your brother Boopi will always be in your corner, cheering you on. Love you always, little sister! 🤍"
    }
  ],

  // Vintage Camera Photo
  cameraPhoto: "assets/photos/camera.jpg",

  // Birthday Quiz (Exactly 5 Personal Questions)
  quiz: [
    {
      id: "q1",
      text: "Where did we first meet?",
      options: ["School", "Tuition", "College", "A function"],
      correctIndex: 1
    },
    {
      id: "q2",
      text: "What nickname do I call you?",
      options: ["Rithu", "Rithi", "Riya", "Richa"],
      correctIndex: 1
    },
    {
      id: "q3",
      text: "What nickname does Rithi call me?",
      options: ["Raja", "Boopi", "Bobo", "Buddy"],
      correctIndex: 1
    },
    {
      id: "q4",
      text: "Have we ever had a big fight?",
      options: ["Many times", "Once", "No, we have never had a big fight", "I don't remember"],
      correctIndex: 2
    },
    {
      id: "q5",
      text: "What do I like most about you?",
      options: ["Your character", "Your dressing style", "Your handwriting", "Your singing"],
      correctIndex: 0
    }
  ],

  // Scratch Card
  scratchPhoto: "assets/photos/scratch.png",
  scratchMessage: "Always stay as wonderful as you are, Rithi! Happy 20th Birthday! 💛",

  // Grand Finale Message
  finalMessage: "Happy 20th Birthday to my wonderful younger sister and best friend! Thank you for every smile, every memory from tuition to today, and for always being so genuinely kind. I am so lucky to have you in my life. Boopi will always have your back, no matter what!",
  finalSignature: "With all my love & warmest hugs, Boopi ♡",

  // Birthday Video Configuration
  video: {
    title: "A Special Birthday Video ✨",
    url: "video/birthday wish video .mp4"
  }
};
