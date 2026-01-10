import { useEffect, useRef, useState } from "react";

const LEVELS = [
  { id: "elementary", label: "Kid (Elementary)" },
  { id: "intermediate", label: "Adult (Intermediate)" },
];

const MODES = [
  { id: "pronunciation", label: "Pronunciation" },
  { id: "dictation", label: "Dictation" },
];

const DEFAULT_TIME = 10;
const PRONUNCIATION_TIME = 5;

// Levenshtein distance between two strings (case-sensitive)
function levenshtein(a = "", b = "") {
  const s = a.trim(); // Remove toLowerCase to make it case-sensitive
  const t = b.trim(); // Remove toLowerCase to make it case-sensitive
  const m = s.length;
  const n = t.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function similarityPercent(target, response) {
  const dist = levenshtein(target, response);
  const maxLen = Math.max(target.trim().length, response.trim().length, 1);
  const sim = 100 * (1 - dist / maxLen);
  return { distance: dist, percent: Math.max(0, Math.round(sim)) };
}

export default function ReadingModule() {
  console.log("ReadingModule component loading...");
  
  try {
  const [mode, setMode] = useState("pronunciation");
  const [level, setLevel] = useState("elementary");
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [loadingWords, setLoadingWords] = useState(true);

  const [countdown, setCountdown] = useState(DEFAULT_TIME); // Always start with DEFAULT_TIME
  const [status, setStatus] = useState("idle"); // idle | listening | typing | playing | done
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [testCompleted, setTestCompleted] = useState(false);
  const [wordResults, setWordResults] = useState([]); // Store results for each word

  const [recognized, setRecognized] = useState("");
  const [typed, setTyped] = useState("");

  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const indianVoiceRef = useRef(null);
  const lastRecognizedRef = useRef(""); // Store last recognized speech

  const currentWord = words[index] || "";

  // Set correct countdown time when mode changes
  useEffect(() => {
    const correctTime = mode === "pronunciation" ? PRONUNCIATION_TIME : DEFAULT_TIME;
    console.log("Mode:", mode, "PRONUNCIATION_TIME:", PRONUNCIATION_TIME, "DEFAULT_TIME:", DEFAULT_TIME);
    console.log("Setting countdown to:", correctTime);
    setCountdown(correctTime);
    console.log("Mode changed to:", mode, "Setting countdown to:", correctTime);
  }, [mode]);

  // Debug logging
  console.log("Current state:", {
    index,
    currentWord,
    score,
    status,
    wordsLength: words.length
  });

  useEffect(() => {
    loadIndianVoice();
    fetchWords(level);
    return () => {
      cleanupRecognition();
      clearTimer();
    };
  }, []);

  useEffect(() => {
    fetchWords(level);
  }, [level]);

  useEffect(() => {
    // Reset test state when mode changes (but keep results if test was completed)
    if (!testCompleted) {
      setIndex(0);
      setScore({ correct: 0, total: 0 });
      setWordResults([]);
      setRecognized("");
      setTyped("");
      setStatus("idle");
      clearTimer();
    }
    // Countdown is set by the other useEffect above
  }, [mode]);

  function fetchWords(targetLevel) {
    setLoadingWords(true);
    setLoadError("");
    fetch(`https://handwriting-sld-app.up.railway.app/vocab/${targetLevel}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch vocabulary: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const wordList = Array.isArray(data.words) ? data.words : [];
        if (wordList.length === 0) {
          setLoadError("No words found for this level. Please check the CSV files.");
        } else {
          setWords(wordList);
          setIndex(0);
          setScore({ correct: 0, total: 0 });
          setRecognized("");
          setTyped("");
          setCountdown(mode === "pronunciation" ? PRONUNCIATION_TIME : DEFAULT_TIME);
          setLoadError("");
        }
      })
      .catch((err) => {
        console.error("Error fetching words:", err);
        setLoadError(
          `Failed to load vocabulary. Make sure the backend server is running on port 5000. Error: ${err.message}`
        );
        setWords([]);
      })
      .finally(() => {
        setLoadingWords(false);
      });
  }

  function clearTimer() {
    if (timerRef.current) {
      console.log("CLEARING TIMER");
      clearInterval(timerRef.current);
      timerRef.current = null;
    } else {
      console.log("NO TIMER TO CLEAR");
    }
  }

  function cleanupRecognition() {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    } catch (_) {
      // no-op
    }
  }

  function loadIndianVoice() {
    if (!window.speechSynthesis) return;
    
    // Wait for voices to load (they load asynchronously)
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log("Available voices:", voices);
      
      // Try to find Indian English voice first
      let indianVoice = voices.find(voice => 
        voice.lang.includes("en-IN") || 
        voice.lang.includes("hi-IN") ||
        voice.name.includes("Indian") ||
        voice.name.includes("Hindi")
      );
      
      // If no Indian voice, try to find any English voice
      if (!indianVoice) {
        indianVoice = voices.find(voice => 
          voice.lang.includes("en") && voice.name.includes("Female")
        ) || voices.find(voice => voice.lang.includes("en"));
      }
      
      if (indianVoice) {
        console.log("Using voice:", indianVoice.name, indianVoice.lang);
        indianVoiceRef.current = indianVoice;
      } else {
        console.log("No suitable voice found, using default");
      }
    };

    // Load voices immediately if available, otherwise wait for event
    if (window.speechSynthesis.getVoices().length > 0) {
      loadVoices();
    } else {
      // Wait for voices to load
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  function startCountdown(onExpire) {
    console.log("=== STARTING COUNTDOWN ===");
    console.log("onExpire function:", onExpire);
    
    clearTimer();
    setCountdown(mode === "pronunciation" ? PRONUNCIATION_TIME : DEFAULT_TIME);
    
    let currentCount = DEFAULT_TIME;
    timerRef.current = setInterval(() => {
      currentCount = currentCount - 1;
      console.log("Countdown tick:", currentCount);
      setCountdown(currentCount);
      
      if (currentCount <= 1) {
        console.log("COUNTDOWN REACHED 0 - calling onExpire");
        clearTimer();
        onExpire?.();
        setCountdown(mode === "pronunciation" ? PRONUNCIATION_TIME : DEFAULT_TIME);
      }
    }, 1000);
  }

  function nextWord(correct) {
    console.log("=== NEXT WORD ===");
    console.log("correct:", correct);
    console.log("current score:", score);
    console.log("current index:", index);
    console.log("recognized state:", recognized);
    console.log("typed state:", typed);
    console.log("lastRecognizedRef:", lastRecognizedRef.current);
    
    // Store result for current word
    const userResponse = mode === "pronunciation" ? (lastRecognizedRef.current || recognized) : typed;
    console.log("userResponse being stored:", userResponse);
    const wordResult = {
      word: currentWord,
      userResponse: userResponse || (mode === "pronunciation" ? "No speech detected" : "No input"),
      correct: correct,
      points: correct ? 1 : 0
    };
    
    console.log("wordResult being stored:", wordResult);
    setWordResults(prev => [...prev, wordResult]);
    
    // Clear any running timer first
    clearTimer();
    
    // Force state updates with timeout to ensure React processes them
    setTimeout(() => {
      const newCorrect = score.correct + (correct ? 1 : 0);
      const newTotal = score.total + 1;
      const newIndex = index + 1;
      
      console.log("New score:", { correct: newCorrect, total: newTotal });
      console.log("New index:", newIndex);
      
      setScore({ correct: newCorrect, total: newTotal });
      
      // Check if test is completed (all words done)
      if (newIndex >= words.length) {
        console.log("TEST COMPLETED!");
        setTestCompleted(true);
        setStatus("done");
      } else {
        setIndex(newIndex);
        // DON'T reset typed until after moving to next word
        setRecognized("");
        setTyped(""); // Clear typed for next word
        lastRecognizedRef.current = ""; // Clear the ref too
        setStatus("idle"); // Ensure status is idle and stays idle
        setCountdown(mode === "pronunciation" ? PRONUNCIATION_TIME : DEFAULT_TIME);
      }
      
      // Force re-render
      setForceUpdate(prev => prev + 1);
    }, 100);
  }

  function startPronunciation() {
    if (!currentWord) return;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setLoadError("SpeechRecognition not supported in this browser.");
      return;
    }

    cleanupRecognition();
    setStatus("listening");
    setRecognized("");
    
    // Start countdown timer for pronunciation mode
    clearTimer();
    setCountdown(PRONUNCIATION_TIME);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        console.log("Pronunciation countdown update:", prev, "->", prev - 1);
        const newTime = prev - 1;
        setForceUpdate(f => f + 1); // Force re-render
        if (prev <= 1) {
          console.log("Pronunciation timer expired");
          clearInterval(timer);
          cleanupRecognition();
          // Capture whatever was recognized (including interim text)
          const finalRecognized = lastRecognizedRef.current || recognized || "No speech detected";
          console.log("Timer expired - final recognized:", finalRecognized);
          console.log("lastRecognizedRef.current at timer expire:", lastRecognizedRef.current);
          setRecognized(finalRecognized);
          lastRecognizedRef.current = finalRecognized; // Ensure ref is updated
          setTimeout(() => {
            nextWord(false);
          }, 50); // Small delay to ensure state update
          return PRONUNCIATION_TIME;
        }
        return newTime;
      });
    }, 1000);
    
    timerRef.current = timer;

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = true; // Enable interim results for real-time display
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      
      const transcript = finalTranscript || interimTranscript || "";
      console.log("Speech recognized:", transcript);
      setRecognized(transcript);
      lastRecognizedRef.current = transcript; // Store in ref
      
      // Only evaluate if we have a final result
      if (finalTranscript) {
        const { percent } = similarityPercent(currentWord, finalTranscript);
        const correct = percent >= 90; // Increased to 90% for stricter matching
        clearTimer(); // Stop timer when we get a result
        nextWord(correct);
      }
    };
    rec.onerror = (err) => {
      console.log("Speech recognition error:", err);
      if (err.error === "not-allowed" || err.error === "denied") {
        setLoadError(
          "Microphone access has been blocked by the browser or OS. Please allow mic permission for this site and reload the page."
        );
      } else {
        setLoadError(`Mic error: ${err.error || "unknown"}`);
      }
      setStatus("idle");
      clearTimer();
    };
    rec.onend = () => {
      console.log("Speech recognition ended. Status:", status, "Recognized:", recognized);
      if (status === "listening") {
        // timed out without result - capture whatever was recognized (including interim)
        const finalRecognized = lastRecognizedRef.current || recognized || "No speech detected";
        console.log("Timeout - final recognized:", finalRecognized);
        console.log("lastRecognizedRef.current at end:", lastRecognizedRef.current);
        // Update recognized state immediately, then call nextWord after a short delay
        setRecognized(finalRecognized);
        lastRecognizedRef.current = finalRecognized; // Ensure ref is updated
        setTimeout(() => {
          nextWord(false);
        }, 50); // Small delay to ensure state update
      }
    };

    recognitionRef.current = rec;
    rec.start();
  }

  function startDictation() {
    if (!currentWord) {
      console.log("ERROR: No currentWord available!");
      return;
    }
    if (!window.speechSynthesis) {
      setLoadError("Speech synthesis not supported in this browser.");
      return;
    }
    
    console.log("=== START DICTATION ===");
    console.log("Words array:", words);
    console.log("Current index:", index);
    console.log("Current word to speak:", `"${currentWord}"`);
    
    // Ensure voices are loaded
    loadIndianVoice();
    
    setStatus("playing");
    // DON'T clear typed here - let user keep their input
    const utterance = new SpeechSynthesisUtterance(currentWord);
    
    // Use Indian voice if available, otherwise fallback to en-IN or en-US
    if (indianVoiceRef.current) {
      utterance.voice = indianVoiceRef.current;
      utterance.lang = indianVoiceRef.current.lang || "en-IN";
    } else {
      utterance.lang = "en-IN"; // Try Indian English locale
    }
    
    // Set slower, clearer speech rate (0.6 = 60% of normal speed, more understandable)
    utterance.rate = 0.6;
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1.0; // Full volume
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    
    // Set to listening after speech starts and start timer
    setTimeout(() => {
      console.log("About to set status to listening...");
      console.log("Current mode:", mode);
      setStatus("listening");
      
      // Start countdown timer for dictation mode
      clearTimer();
      setCountdown(DEFAULT_TIME);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          console.log("Dictation countdown update:", prev, "->", prev - 1);
          const newTime = prev - 1;
          setForceUpdate(f => f + 1); // Force re-render
          if (prev <= 1) {
            console.log("Dictation timer expired, calling evaluateDictation");
            clearInterval(timer);
            evaluateDictation();
            return DEFAULT_TIME;
          }
          return newTime;
        });
      }, 1000);
      
      timerRef.current = timer;
      console.log("Status set to listening - TIMER STARTED NOW");
    }, 1000);
    
    // Timer is now handled by useEffect - don't call startCountdown here
  }

  function evaluateDictation() {
    console.log("=== EVALUATE DICTATION ===");
    console.log("currentWord:", `"${currentWord}"`);
    console.log("typed:", `"${typed}"`);
    console.log("status:", status);
    
    // Clear timer when submit is clicked
    clearTimer();
    
    const { percent, distance } = similarityPercent(currentWord, typed);
    const correct = percent >= 90; // Increased to 90% for stricter matching
    
    console.log("target length:", currentWord.length);
    console.log("response length:", typed.length);
    console.log("levenshtein distance:", distance);
    console.log("similarity percent:", percent);
    console.log("correct:", correct);
    console.log("==========================");
    
    nextWord(correct);
  }

  const totalWords = words.length;
  const accuracy =
    score.total === 0 ? 0 : Math.round((score.correct / score.total) * 100);

  // Force re-render with key
  const [forceUpdate, setForceUpdate] = useState(0);

  // Force update function
  const forceScoreUpdate = () => {
    setForceUpdate(prev => prev + 1);
  };

  // Create a computed value that forces re-render
  const displayScore = {
    correct: score.correct,
    total: score.total,
    forceKey: `${score.correct}-${score.total}-${forceUpdate}`
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-7 border border-slate-200">
      <div className="flex flex-wrap gap-3 items-center mb-4">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id);
              setStatus("idle");
              setRecognized("");
              setTyped("");
              clearTimer();
              setCountdown(mode === "pronunciation" ? PRONUNCIATION_TIME : DEFAULT_TIME);
              // Don't fetch new words when switching modes - keep current words
            }}
            className={`px-4 py-2 rounded-md text-sm font-semibold border transition-colors ${
              mode === m.id
                ? "bg-white text-slate-900 border-slate-900 shadow-sm"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {m.label}
          </button>
        ))}
        <button
          onClick={() => fetchWords(level)}
          className="px-4 py-2 rounded-md text-sm font-semibold border transition-colors bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
        >
          🔄 New Words
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-6">
        {LEVELS.map((lvl) => (
          <button
            key={lvl.id}
            onClick={() => setLevel(lvl.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              level === lvl.id
                ? "bg-emerald-50 text-emerald-900 border-emerald-600 shadow-sm"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {lvl.label}
          </button>
        ))}
        <div className="text-xs md:text-sm text-slate-600">
          {words.length > 0 ? (
            <span>Loaded <strong>{words.length}</strong> random words from {level === "elementary" ? "elementary_voc.csv" : "intermediate_voc.csv"}</span>
          ) : (
            <span>The selected level controls the difficulty of the words used for testing.</span>
          )}
        </div>
      </div>

      <div className="mb-6 p-5 bg-blue-50 border-2 border-blue-200 rounded-lg text-sm text-slate-900 space-y-3">
        <p className="font-bold text-base text-blue-900">Important: Before You Begin</p>
        <ul className="list-disc pl-5 space-y-2 text-slate-800">
          <li><strong>Supervision Required:</strong> This test must be conducted under the supervision of a parent, instructor, or qualified professional.</li>
          <li><strong>Setup:</strong> Sit comfortably in a quiet room with good lighting. Ensure your microphone and speakers are working properly.</li>
          <li><strong>Time Duration:</strong> Each test takes approximately 5-10 minutes. Take breaks if needed.</li>
          <li><strong>Browser Requirements:</strong> Use Google Chrome or Microsoft Edge for best results. Make sure microphone permissions are enabled.</li>
        </ul>
      </div>

      <div className="mb-4 p-5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 space-y-3">
        {mode === "pronunciation" ? (
          <>
            <p className="font-bold text-base">Pronunciation Test - How It Works</p>
            <p className="text-slate-700">This test evaluates how well you can read words aloud. It helps identify difficulties with sound-to-word matching.</p>
            <ol className="list-decimal pl-5 space-y-2 text-slate-800">
              <li>Look at the word displayed in large text on your screen.</li>
              <li>Click the <span className="font-semibold bg-emerald-100 px-2 py-0.5 rounded">Start Pronunciation</span> button below the word.</li>
              <li>When the timer starts, clearly read the word aloud into your microphone.</li>
              <li>You have <strong>5 seconds</strong> to pronounce each word. Speak clearly and at a normal pace.</li>
              <li>The system will automatically record your pronunciation and compare it to the correct word.</li>
              <li>After 5 seconds, the next word will appear automatically. Your score updates after each word.</li>
            </ol>
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
              <strong>Tip:</strong> Pronounce each word naturally. Don't rush. The system checks how accurately you match the expected pronunciation.
            </div>
          </>
        ) : (
          <>
            <p className="font-bold text-base">Dictation Test - How It Works</p>
            <p className="text-slate-700">This test evaluates how well you can spell words after hearing them. It helps identify difficulties with converting sounds into written words.</p>
            <ol className="list-decimal pl-5 space-y-2 text-slate-800">
              <li>Click the <span className="font-semibold bg-slate-100 px-2 py-0.5 rounded">Play Word & Start Timer</span> button.</li>
              <li>The system will speak a word clearly using text-to-speech. Listen carefully.</li>
              <li>Type exactly what you heard into the text box below.</li>
              <li>You have <strong>10 seconds</strong> to type each word after hearing it.</li>
              <li>Click <span className="font-semibold bg-emerald-100 px-2 py-0.5 rounded">Submit</span> if you finish before the timer ends, or wait for the timer to expire automatically.</li>
              <li>The system checks your spelling accuracy. The next word will play automatically after your response is recorded.</li>
            </ol>
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
              <strong>Tip:</strong> Type carefully and check your spelling. The system evaluates how accurately you convert the spoken word into written form.
            </div>
          </>
        )}
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-400 text-red-800 p-3 rounded mb-4">
          {loadError}
        </div>
      )}

      {loadingWords ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mb-3"></div>
          <p className="text-slate-600 text-sm">Loading vocabulary from CSV files...</p>
        </div>
      ) : words.length === 0 ? (
        <div className="text-slate-600 text-sm p-4 bg-slate-50 rounded-lg">
          No words available. Please check that the backend server is running and the CSV files exist.
        </div>
      ) : testCompleted ? (
        <div className="text-center py-8">
          <div className="mb-6">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Test Completed!</h2>
            <p className="text-slate-600 mb-6">Great job! Here are your results:</p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6 max-w-md mx-auto">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-900">{score.correct}</div>
                <div className="text-sm text-blue-700">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">{score.total}</div>
                <div className="text-sm text-slate-600">Total Words</div>
              </div>
            </div>
            
            <div className="text-center pt-4 border-t border-blue-200">
              <div className="text-4xl font-bold text-green-600 mb-2">{accuracy}%</div>
              <div className="text-sm text-slate-600">Accuracy Score</div>
            </div>
          </div>
          
          {/* Detailed Results */}
          <div className="bg-white border-2 border-slate-200 rounded-xl p-4 mb-6 max-w-2xl mx-auto max-h-64 overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 mb-3 text-center">Detailed Results</h3>
            <div className="space-y-2">
              {wordResults.map((result, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-lg border ${
                    result.correct 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">
                      Word {idx + 1}
                    </span>
                    <span className={`text-sm font-bold ${
                      result.correct ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.correct ? '+1' : '0'} pts
                    </span>
                  </div>
                  <div className="text-sm text-slate-900">
                    <div><strong>Correct:</strong> {result.word}</div>
                    <div>
                      <strong>{mode === 'pronunciation' ? 'Heard:' : 'Typed:'}</strong> 
                      <span className={result.correct ? 'text-green-700' : 'text-red-700'}>
                        {' '}{result.userResponse}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setTestCompleted(false);
                setIndex(0);
                setScore({ correct: 0, total: 0 });
                setWordResults([]);
                setRecognized("");
                setTyped("");
                setStatus("idle");
                setCountdown(mode === "pronunciation" ? PRONUNCIATION_TIME : DEFAULT_TIME);
                fetchWords(level);
              }}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white text-base font-bold shadow-lg border-2 border-green-800 hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 active:scale-95"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      ) : !currentWord ? (
        <div className="text-slate-600 text-sm">No words available.</div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase text-slate-500 font-semibold tracking-wide">
                Word {index + 1} / {totalWords}
              </div>
              <div className="text-3xl md:text-4xl font-semibold text-slate-900 mt-1">
                {mode === "pronunciation" ? currentWord : "Listen carefully and type what you hear"}
              </div>
            </div>
            <div className="text-xl md:text-2xl font-semibold text-slate-800">
              Time: {countdown}s (status: {status})
            </div>
          </div>

          {mode === "pronunciation" ? (
            <div className="space-y-3">
              <button
                onClick={startPronunciation}
                className="w-full px-6 py-3.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-base font-bold shadow-lg border-2 border-emerald-800 hover:from-emerald-700 hover:to-emerald-800 transition-all transform hover:scale-105 active:scale-95"
                style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
              >
                Start Pronunciation
              </button>
              <div className="text-xs md:text-sm text-slate-700">
                Heard text:{" "}
                <span className="font-semibold">
                  {recognized || "no speech recognised yet"}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={startDictation}
                className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-base font-bold shadow-lg border-2 border-blue-800 hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 active:scale-95"
              >
                Play Word & Start Timer
              </button>
              <input
                type="text"
                value={typed}
                onChange={(e) => {
                  console.log("INPUT CHANGED - new value:", e.target.value);
                  console.log("INPUT CHANGED - old value:", typed);
                  setTyped(e.target.value);
                  if (status === "listening") {
                    setStatus("typing");
                  }
                }}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                placeholder="Type what you heard..."
              />
              <button
                onClick={() => {
                  console.log("SUBMIT BUTTON CLICKED!");
                  evaluateDictation();
                }}
                className="w-full px-4 py-2 rounded-md text-sm font-semibold border transition-colors bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                Submit
              </button>
            </div>
          )}

          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
            <div className="text-sm md:text-base font-semibold text-slate-800">
              Score: {displayScore.correct} / {totalWords}
            </div>
            <div className="text-sm md:text-base font-semibold text-slate-900">
              Accuracy: {accuracy}%
            </div>
          </div>
        </>
      )}
    </div>
  );
  } catch (error) {
    console.error("ReadingModule error:", error);
    return <div className="bg-red-100 border border-red-400 p-4 rounded-lg">
      <h2 className="text-red-800 text-xl font-bold">Error Loading Component</h2>
      <p className="text-red-600">{error.message}</p>
    </div>;
  }
}

