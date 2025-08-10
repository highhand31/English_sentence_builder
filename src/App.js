import React, { useState, useEffect, useRef } from "react";
import {
  Star,
  RotateCcw,
  CheckCircle,
  Heart,
  Sparkles,
  Eye,
  Award,
  Volume2,
  Timer as TimerIcon,
  BarChart3,
} from "lucide-react";
import { sentencesByLevel } from "./sentencesData"; // 確保此檔案路徑正確

// Firebase imports - We will keep them here but commented out for future use.
// import { initializeApp } from 'firebase/app';
// import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

// =================================================================
// TODO: 重要 - Firebase 設定
// 未來若要啟用排行榜功能，請解除以下註解，並填入您的 Firebase 設定。
// 為了安全，請務必將這些金鑰移至環境變數。
/*
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
*/
// =================================================================

const SentenceBuilderGame = () => {
  // --- 中英對照題庫 ---

  const [currentLevel, setCurrentLevel] = useState(1);
  const [shuffledSentences, setShuffledSentences] = useState([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [wordOptions, setWordOptions] = useState([]);
  const [userSentence, setUserSentence] = useState([]);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState("levelSelection"); // 'levelSelection', 'playing', 'completed'
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

  // Timer state
  const [time, setTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  const currentSentenceData = shuffledSentences[currentSentenceIndex];

  // Timer logic
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning]);

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const setupLevel = (level) => {
    setCurrentLevel(level);
    const sentences = sentencesByLevel[level] || [];
    setShuffledSentences(shuffleArray(sentences));
    setCurrentSentenceIndex(0);
    setScore(0);
    setTime(0);
    setIsTimerRunning(true);
    setGameState("playing");
  };

  // Setup the first sentence when shuffledSentences is ready
  useEffect(() => {
    if (gameState === "playing" && shuffledSentences.length > 0) {
      const currentSentence = shuffledSentences[currentSentenceIndex];
      if (currentSentence && currentSentence.words) {
        setWordOptions(shuffleAndAssignIds(currentSentence.words));
        setUserSentence([]);
        setIsCorrect(null);
        setShowFeedback(false);
        setShowCorrectAnswer(false);
      }
    }
  }, [currentSentenceIndex, shuffledSentences, gameState]);

  const shuffleAndAssignIds = (words) => {
    const wordsWithIds = words.map((word, index) => ({
      word: word,
      id: `${index}-${word}-${Math.random()}`,
    }));
    return shuffleArray(wordsWithIds);
  };

  const addWordToSentence = (wordObj) => {
    setUserSentence([...userSentence, wordObj]);
    setWordOptions(wordOptions.filter((w) => w.id !== wordObj.id));
  };

  const removeWordFromSentence = (wordObj) => {
    setUserSentence(userSentence.filter((w) => w.id !== wordObj.id));
    setWordOptions([...wordOptions, wordObj]);
  };

  const checkAnswer = () => {
    if (!currentSentenceData || !currentSentenceData.words) return;

    const userAnswerStr = userSentence.map((w) => w.word).join(" ");
    const correctAnswerStr = currentSentenceData.words.join(" ");

    const correct = userAnswerStr === correctAnswerStr;
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setScore(score + 10);
    }

    setTimeout(() => {
      setShowFeedback(false);
      if (correct) {
        nextSentence();
      }
    }, 2000);
  };

  const nextSentence = () => {
    if (currentSentenceIndex < shuffledSentences.length - 1) {
      setCurrentSentenceIndex(currentSentenceIndex + 1);
    } else {
      setIsTimerRunning(false);
      setGameState("completed");
    }
  };

  const backToLevelSelection = () => {
    setGameState("levelSelection");
    setIsTimerRunning(false);
    setTime(0);
  };

  const showAnswer = () => {
    if (!currentSentenceData || !currentSentenceData.words) return;
    setShowCorrectAnswer(true);
    setTimeout(() => setShowCorrectAnswer(false), 3000);
  };

  const resetSentence = () => {
    if (!currentSentenceData || !currentSentenceData.words) return;
    setWordOptions(shuffleAndAssignIds(currentSentenceData.words));
    setUserSentence([]);
    setIsCorrect(null);
    setShowFeedback(false);
    setShowCorrectAnswer(false);
  };

  const speakChinese = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-TW";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("抱歉，您的瀏覽器不支援語音朗讀功能。");
    }
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  const LevelSelectionScreen = () => (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-teal-800 mb-8 flex items-center justify-center gap-2">
        <Sparkles className="text-amber-500" />
        英文句子重組遊戲
        <Sparkles className="text-amber-500" />
      </h1>
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          請選擇難度
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.keys(sentencesByLevel).map((level) => (
            <button
              key={level}
              onClick={() => setupLevel(Number(level))}
              className={`p-6 rounded-lg font-bold text-xl transition-all transform hover:scale-105 ${
                level === "1"
                  ? "bg-green-200 hover:bg-green-300 text-green-800"
                  : level === "2"
                  ? "bg-blue-200 hover:bg-blue-300 text-blue-800"
                  : level === "3"
                  ? "bg-yellow-200 hover:bg-yellow-300 text-yellow-800"
                  : level === "4"
                  ? "bg-orange-200 hover:bg-orange-300 text-orange-800"
                  : level === "5"
                  ? "bg-red-200 hover:bg-red-300 text-red-800"
                  : "bg-purple-200 hover:bg-purple-300 text-purple-800"
              }`}
            >
              <div className="text-3xl mb-2">
                {level === "1"
                  ? "🌱"
                  : level === "2"
                  ? "🌿"
                  : level === "3"
                  ? "🌳"
                  : level === "4"
                  ? "🎯"
                  : level === "5"
                  ? "🏆"
                  : "👑"}
              </div>
              等級 {level}
              <div className="text-sm mt-1 opacity-75">
                (
                {level === "1"
                  ? "新手"
                  : level === "2"
                  ? "簡單"
                  : level === "3"
                  ? "中級"
                  : level === "4"
                  ? "困難"
                  : level === "5"
                  ? "進階"
                  : "專家"}
                )
              </div>
            </button>
          ))}
        </div>
      </div>
      {/* <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto text-lg">
        <BarChart3 className="w-5 h-5" />
        查看排行榜
      </button> */}
    </div>
  );

  const PlayingScreen = () => (
    <>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-teal-800 mb-2 flex items-center justify-center gap-2">
          <Sparkles className="text-amber-500" />
          英文句子重組遊戲
          <Sparkles className="text-amber-500" />
        </h1>
        <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2 text-lg mb-4">
          <div className="flex items-center gap-1 bg-amber-200 px-3 py-1 rounded-full">
            <Star className="text-amber-600 w-5 h-5" />
            <span className="text-amber-800 font-semibold">得分: {score}</span>
          </div>
          <div className="flex items-center gap-1 bg-red-200 px-3 py-1 rounded-full">
            <TimerIcon className="text-red-600 w-5 h-5" />
            <span className="text-red-800 font-semibold">
              時間: {formatTime(time)}
            </span>
          </div>
          <div className="bg-sky-200 px-3 py-1 rounded-full">
            <span className="text-sky-800 font-semibold">
              等級 {currentLevel}
            </span>
          </div>
          <div className="bg-green-200 px-3 py-1 rounded-full">
            <span className="text-green-800 font-semibold">
              第 {currentSentenceIndex + 1} / {shuffledSentences.length} 題
            </span>
          </div>
        </div>
        <button
          onClick={backToLevelSelection}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          返回難度選擇
        </button>
      </div>

      {currentSentenceData && (
        <>
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 border-l-4 border-blue-500 flex items-center justify-center gap-4">
            <p className="text-2xl font-bold text-gray-800 text-center">
              {currentSentenceData.chinese}
            </p>
            <button
              onClick={() => speakChinese(currentSentenceData.chinese)}
              className="text-blue-500 hover:text-blue-700 transition-colors p-2 rounded-full hover:bg-blue-100"
              aria-label="朗讀中文意思"
            >
              <Volume2 className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 mb-6 border-l-4 border-teal-500">
            <p className="text-gray-700">
              <span className="font-semibold text-teal-700">提示: </span>
              {currentSentenceData.hint}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              請點擊單字，組成對應的英文句子：
            </h2>

            <div className="min-h-[5rem] border-2 border-dashed border-indigo-300 rounded-lg p-4 mb-4 bg-indigo-50 flex flex-wrap gap-2 items-center">
              {userSentence.length === 0 ? (
                <p className="text-indigo-400 text-center w-full">
                  你的答案會顯示在這裡
                </p>
              ) : (
                userSentence.map((wordObj) => (
                  <button
                    key={`sentence-${wordObj.id}`}
                    onClick={() => removeWordFromSentence(wordObj)}
                    className="bg-indigo-200 hover:bg-indigo-300 text-indigo-800 text-lg px-4 py-2 rounded-lg font-medium shadow-sm transition-all transform hover:scale-105 cursor-pointer border-2 border-indigo-300 hover:border-indigo-400"
                  >
                    {wordObj.word}
                    <span className="ml-2 text-indigo-600 text-xs">✕</span>
                  </button>
                ))
              )}
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                單字庫:
              </h3>
              <div className="min-h-[4rem] border-2 border-dashed border-sky-300 rounded-lg p-4 bg-sky-50 flex flex-wrap gap-2">
                {wordOptions.length === 0 ? (
                  <p className="text-sky-400 text-center w-full">
                    所有單字都已使用
                  </p>
                ) : (
                  wordOptions.map((wordObj) => (
                    <button
                      key={`option-${wordObj.id}`}
                      onClick={() => addWordToSentence(wordObj)}
                      className="bg-sky-200 hover:bg-sky-300 text-sky-800 text-lg px-4 py-2 rounded-lg font-medium shadow-sm transition-all transform hover:scale-105 cursor-pointer border-2 border-sky-300 hover:border-sky-400"
                    >
                      {wordObj.word}
                      <span className="ml-2 text-sky-600 text-xs">+</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {showCorrectAnswer && currentSentenceData.words && (
              <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  正確答案:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentSentenceData.words.map((word, index) => (
                    <div
                      key={index}
                      className="bg-green-200 text-green-800 text-lg px-3 py-2 rounded-lg font-medium shadow-sm"
                    >
                      {word}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={checkAnswer}
                disabled={userSentence.length === 0}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 text-lg"
              >
                <CheckCircle className="w-5 h-5" />
                檢查答案
              </button>
              <button
                onClick={showAnswer}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 text-lg"
              >
                <Eye className="w-5 h-5" />
                顯示答案
              </button>
              <button
                onClick={resetSentence}
                className="bg-gray-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 text-lg"
              >
                <RotateCcw className="w-5 h-5" />
                重新開始
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );

  const CompletionScreen = () => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 md:p-10 text-center shadow-2xl transform transition-all border-4 border-amber-400 max-w-lg w-full">
        <div className="text-6xl mb-4">
          <Award className="w-20 h-20 text-amber-500 mx-auto" />
        </div>
        <h3 className="text-3xl font-bold text-teal-800 mb-2">恭喜你！</h3>
        <p className="text-gray-700 text-lg mb-4">
          你已經完成了等級 {currentLevel} 的所有挑戰！
        </p>
        <div className="bg-indigo-100 border border-indigo-200 rounded-lg p-4 mb-6">
          <div className="text-lg text-indigo-800 font-semibold">最終成績</div>
          <div className="flex justify-center items-center gap-6 mt-2">
            <div className="text-center">
              <div className="text-sm text-indigo-600">總得分</div>
              <div className="text-2xl font-bold text-indigo-900">{score}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-indigo-600">完成時間</div>
              <div className="text-2xl font-bold text-indigo-900">
                {formatTime(time)}
              </div>
            </div>
          </div>
        </div>

        {/* This is where the form for leaderboard would go */}
        {/* <div className="text-left mt-6">
            <h4 className="text-xl font-semibold text-gray-800 mb-3">登上排行榜！</h4>
            <input type="text" placeholder="你的名字" className="w-full p-2 border border-gray-300 rounded-md mb-2" />
            <input type="text" placeholder="學校" className="w-full p-2 border border-gray-300 rounded-md mb-2" />
            <input type="text" placeholder="年級" className="w-full p-2 border border-gray-300 rounded-md mb-3" />
            <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium transition-colors text-lg">
              送出成績
            </button>
          </div> */}

        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={backToLevelSelection}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors text-lg"
          >
            返回難度選擇
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-teal-100 p-4 font-sans">
      <div className="max-w-4xl mx-auto">
        {gameState === "levelSelection" && <LevelSelectionScreen />}
        {gameState === "playing" && <PlayingScreen />}
        {gameState === "completed" && <CompletionScreen />}

        {showFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className={`bg-white rounded-2xl p-8 text-center shadow-2xl transform transition-all ${
                isCorrect
                  ? "border-4 border-green-400"
                  : "border-4 border-orange-400"
              }`}
            >
              {isCorrect ? (
                <div>
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-green-700 mb-2">
                    太棒了！
                  </h3>
                  <p className="text-green-600 text-lg mb-4">
                    完全正確！做得很好！
                  </p>
                  <div className="flex justify-center gap-2">
                    <Star className="text-yellow-500 w-6 h-6" />
                    <Star className="text-yellow-500 w-6 h-6" />
                    <Star className="text-yellow-500 w-6 h-6" />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">💪</div>
                  <h3 className="text-2xl font-bold text-orange-700 mb-2">
                    再試一次！
                  </h3>
                  <p className="text-orange-600 text-lg mb-4">
                    差一點點，別放棄！
                  </p>
                  <Heart className="text-red-500 w-8 h-8 mx-auto" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SentenceBuilderGame;
