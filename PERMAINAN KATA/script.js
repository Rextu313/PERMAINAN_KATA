// DATABASE KATA (Kategori, Kata, Petunjuk)
const wordDatabase = [
  // Kategori: Hewan
  { word: "HARIMAU", category: "Hewan", hint: "Kucing besar bergaris oranye dan hitam" },
  { word: "KOMODO", category: "Hewan", hint: "Kadal terbesar di dunia dari Indonesia" },
  { word: "CENDERAWASIH", category: "Hewan", hint: "Burung indah khas Papua" },
  { word: "LUMBALUMBA", category: "Hewan", hint: "Mamalia laut yang sangat cerdas" },
  { word: "SERIGALA", category: "Hewan", hint: "Kerabat anjing yang suka melolong saat bulan purnama" },

  // Kategori: Buah & Makanan
  { word: "SEMANGKA", category: "Buah & Makanan", hint: "Buah berbiji dengan daging merah/kuning dan kaya air" },
  { word: "DURIAN", category: "Buah & Makanan", hint: "Raja buah yang memiliki kulit berduri tajam" },
  { word: "RENDANG", category: "Buah & Makanan", hint: "Masakan daging terlezat khas Minangkabau" },
  { word: "ALPUKAT", category: "Buah & Makanan", hint: "Buah bertekstur mentega sering untuk jus" },

  // Kategori: Teknologi
  { word: "KOMPUTER", category: "Teknologi", hint: "Perangkat elektronik untuk mengolah data" },
  { word: "INTERNET", category: "Teknologi", hint: "Jaringan global yang menghubungkan seluruh dunia" },
  { word: "ALGORITMA", category: "Teknologi", hint: "Langkah-langkah logis penyelesaian masalah" },
  { word: "DATABASE", category: "Teknologi", hint: "Kumpulan data terstruktur yang disimpan secara elektronik" },

  // Kategori: Kota Indonesia
  { word: "SURABAYA", category: "Kota Indonesia", hint: "Kota pahlawan di Jawa Timur" },
  { word: "PONOROGO", category: "Kota Indonesia", hint: "Kota asal kesenian Reog" },
  { word: "YOGYAKARTA", category: "Kota Indonesia", hint: "Kota pelajar dan budaya di Jawa Tengah" },
  { word: "MAKASSAR", category: "Kota Indonesia", hint: "Kota metropolitan terbesar di Sulawesi" }
];

// STATE PERMAINAN
let currentItem = null;
let scrambledWord = "";
let score = 0;
let streak = 0;
let highScore = localStorage.getItem("kataSakti_highScore") || 0;

// ELEMEN HTML (DOM)
const scoreEl = document.getElementById("score-val");
const streakEl = document.getElementById("streak-val");
const highScoreEl = document.getElementById("highscore-val");
const categoryEl = document.getElementById("category-name");
const wordDisplayEl = document.getElementById("scrambled-word");
const hintBoxEl = document.getElementById("hint-box");
const hintTextEl = document.getElementById("hint-text");
const guessForm = document.getElementById("guess-form");
const userInput = document.getElementById("user-input");
const messageBox = document.getElementById("message-box");
const btnHint = document.getElementById("btn-hint");
const btnSkip = document.getElementById("btn-skip");

// WEB AUDIO API FOR SOUND EFFECTS
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === 'correct') {
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } else if (type === 'wrong') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(110, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  }
}

// INISIALISASI GAME
function initGame() {
  highScoreEl.textContent = highScore;
  loadNewWord();
}

// ACAK HURUF DARI KATA
function scramble(word) {
  let array = word.split('');
  let shuffled = array.slice();
  
  // Pastikan hasil acak tidak sama persis dengan kata asli
  while (shuffled.join('') === word && word.length > 1) {
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  }
  return shuffled.join('');
}

// MUAT KATA BARU
function loadNewWord() {
  // Reset Tampilan
  userInput.value = "";
  messageBox.textContent = "";
  messageBox.className = "message-box";
  hintBoxEl.classList.add("hidden");
  btnHint.disabled = false;

  // Pilih Kata Acak dari Database
  const randomIndex = Math.floor(Math.random() * wordDatabase.length);
  currentItem = wordDatabase[randomIndex];
  scrambledWord = scramble(currentItem.word);

  // Update UI Kategori & Petunjuk
  categoryEl.textContent = currentItem.category;
  hintTextEl.textContent = currentItem.hint;

  // Render Tile Huruf
  wordDisplayEl.innerHTML = "";
  scrambledWord.split("").forEach((char) => {
    const tile = document.createElement("div");
    tile.classList.add("letter-tile");
    tile.textContent = char;
    wordDisplayEl.appendChild(tile);
  });
}

// CEK JAWABAN USER
guessForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const guess = userInput.value.trim().toUpperCase();

  if (!guess) return;

  if (guess === currentItem.word) {
    // JAWABAN BENAR
    playSound('correct');
    score += 10;
    streak += 1;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("kataSakti_highScore", highScore);
    }

    updateStats();
    showMessage("🎉 Tepat Sekali! +10 Poin", "success");

    setTimeout(() => {
      loadNewWord();
    }, 1200);

  } else {
    // JAWABAN SALAH
    playSound('wrong');
    streak = 0;
    updateStats();
    showMessage("❌ Jawaban salah, coba lagi!", "error");
    
    // Efek Shake
    const card = document.querySelector(".game-card");
    card.classList.add("shake");
    setTimeout(() => card.classList.remove("shake"), 400);
  }
});

// EVENT TOMBOL PETUNJUK
btnHint.addEventListener("click", () => {
  if (score >= 5) {
    score -= 5;
    updateStats();
    hintBoxEl.classList.remove("hidden");
    btnHint.disabled = true;
  } else {
    showMessage("⚠️ Skor minimal 5 untuk melihat petunjuk!", "error");
  }
});

// EVENT TOMBOL LEWATI KATA
btnSkip.addEventListener("click", () => {
  streak = 0;
  updateStats();
  showMessage(`⏭️ Kata dilewati! Jawabannya: ${currentItem.word}`, "error");
  setTimeout(() => {
    loadNewWord();
  }, 1500);
});

// UPDATE BOARD SKOR
function updateStats() {
  scoreEl.textContent = score;
  streakEl.textContent = `${streak} 🔥`;
  highScoreEl.textContent = highScore;
}

// TAMPILKAN PESAN FEEDBACK
function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = `message-box ${type === "success" ? "message-success" : "message-error"}`;
}

// JALANKAN SAAT HALAMAN DIMUAT
document.addEventListener("DOMContentLoaded", initGame);