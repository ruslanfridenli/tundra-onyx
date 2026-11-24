(() => {
  // main.ts
  var I18N = { "en": { "scale": "Scale", "chord": "Chord degree", "play": "Playback", "octave": "Octave", "dur": "Duration", "notes": "Chord", "maj": "major", "min": "minor", "dim": "diminished", "aug": "augmented", "playchord": "\u25B6 Play chord", "strum": "\u21BB Strum", "degree": "degree" }, "de": { "scale": "Tonleiter", "chord": "Stufe", "play": "Wiedergabe", "octave": "Oktave", "dur": "Dauer", "notes": "Akkord", "maj": "Dur", "min": "Moll", "dim": "vermindert", "aug": "\xFCberm\xE4\xDFig", "playchord": "\u25B6 Akkord spielen", "strum": "\u21BB Arpeggio", "degree": "Stufe" } };
  var lang = localStorage.getItem("lang") || "en";
  var t = (k) => I18N[lang][k] || k;
  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i]").forEach((el) => el.textContent = t(el.dataset.i));
    document.querySelectorAll(".lang button").forEach((b) => b.classList.toggle("on", b.dataset.lang === lang));
  }
  document.querySelectorAll(".lang button").forEach((b) => b.onclick = () => {
    lang = b.dataset.lang;
    localStorage.setItem("lang", lang);
    applyLang();
  });
  var cv = document.getElementById("cv");
  var ctx = cv.getContext("2d");
  var $ = (id) => document.getElementById(id);
  var SCALES = {
    "C major": [0, 2, 4, 5, 7, 9, 11],
    "A minor": [0, 2, 3, 5, 7, 8, 10],
    "D dorian": [0, 2, 3, 5, 7, 9, 10],
    "E phrygian": [0, 1, 3, 5, 7, 8, 10],
    "G major": [7, 9, 11, 12, 14, 16, 17],
    "F major": [5, 7, 9, 10, 12, 14, 15],
    "E minor": [4, 6, 7, 9, 11, 12, 14],
    "B locrian": [11, 0, 1, 3, 5, 6, 7]
  };
  var NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  var ac = null;
  var scale = "C major";
  var degree = 0;
  var oct = 4;
  var dur = 0.8;
  function ensure() {
    if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
    return ac;
  }
  function noteHz(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  function chordTones() {
    const iv = SCALES[scale];
    const rootMidi = ({ C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 }[scale.split(" ")[0]] || 0) + 12 * (oct - 1);
    const d = degree % 7;
    const third = (d + 2) % 7, fifth = (d + 4) % 7;
    const q3 = (iv[(d + 2) % 7] - iv[d] + 12) % 12, q5 = (iv[(d + 4) % 7] - iv[d] + 12) % 12;
    let thirdSemi = q3 === 4 ? 4 : q3 === 3 ? 3 : 4;
    const tones = [rootMidi, rootMidi + thirdSemi, rootMidi + q5];
    const q = thirdSemi === 4 ? q5 === 7 ? "7" : "maj" : thirdSemi === 3 ? "min" : "dim";
    return { tones, q };
  }
  function play() {
    const a = ensure();
    a.resume();
    const { tones, q } = chordTones();
    const now = a.currentTime;
    tones.forEach((m, i) => {
      const o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter();
      o.type = "triangle";
      o.frequency.value = noteHz(m);
      o2.type = "sine";
      o2.frequency.value = noteHz(m) * 2;
      f.type = "lowpass";
      f.frequency.value = 2500;
      g.gain.setValueAtTime(0, now + i * 0.03);
      g.gain.linearRampToValueAtTime(0.22, now + i * 0.03 + 0.02);
      g.gain.exponentialRampToValueAtTime(1e-3, now + dur + i * 0.03);
      o.connect(f);
      o2.connect(f);
      f.connect(g);
      g.connect(a.destination);
      o.start(now + i * 0.03);
      o.stop(now + dur + i * 0.03);
      o2.start(now + i * 0.03);
      o2.stop(now + dur + i * 0.03);
    });
  }
  function render() {
    const { tones, q } = chordTones();
    const names = tones.map((m) => NAMES[m % 12] + (Math.floor(m / 12) - 1));
    $("chordname").textContent = names[0] + q.toUpperCase() + " (" + names.join(" \xB7 ") + ")";
    const w = cv.width, h = cv.height;
    ctx.fillStyle = "#07090f";
    ctx.fillRect(0, 0, w, h);
    const lo = 48, hi = 84, bw = w / (hi - lo);
    for (let m = lo; m < hi; m++) {
      const x = (m - lo) * bw;
      const black = [1, 3, 6, 8, 10].includes(m % 12);
      ctx.fillStyle = black ? "#0d1322" : "#1a2338";
      ctx.fillRect(x, 0, bw - 1, h * 0.8);
      if (tones.includes(m)) {
        ctx.fillStyle = "rgba(77,216,255,.85)";
        ctx.fillRect(x, 0, bw - 1, h * 0.8);
        ctx.fillStyle = "#04121f";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(NAMES[m % 12], x + bw / 2, h * 0.86);
      }
    }
  }
  function buildScales() {
    const w = $("scales");
    w.innerHTML = "";
    Object.keys(SCALES).forEach((s) => {
      const b = document.createElement("button");
      b.textContent = s;
      b.dataset.s = s;
      b.onclick = () => {
        scale = s;
        buildDegrees();
        render();
      };
      w.appendChild(b);
    });
  }
  function buildDegrees() {
    const w = $("degrees");
    w.innerHTML = "";
    for (let d = 0; d < 7; d++) {
      const b = document.createElement("button");
      b.textContent = "\xB0" + (d + 1) + " " + t("degree") + " " + (d + 1);
      b.onclick = () => {
        degree = d;
        render();
      };
      w.appendChild(b);
    }
    const pb = document.createElement("button");
    pb.className = "primary";
    pb.textContent = "\u25B6 " + t("playchord");
    pb.onclick = play;
    w.appendChild(pb);
  }
  $("oct").oninput = (e) => {
    oct = +e.target.value;
    render();
  };
  $("dur").oninput = (e) => {
    dur = +e.target.value;
  };
  function resize() {
    const r = cv.parentElement.getBoundingClientRect();
    cv.width = r.width * devicePixelRatio;
    cv.height = r.height * devicePixelRatio;
    render();
  }
  addEventListener("resize", resize);
  resize();
  buildScales();
  buildDegrees();
  render();
  applyLang();
})();
