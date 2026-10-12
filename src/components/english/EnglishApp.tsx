import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import EnglishBeginnerGuide from "./EnglishBeginnerGuide";
import ExerciseQuiz from "./ExerciseQuiz";
import LevelDetail from "./LevelDetail";
import Quiz from "./Quiz";
import Review from "./Review";
import SpeakingLevelSelect from "./SpeakingLevelSelect";
import SpeakingSession from "./SpeakingSession";
import TopicSelect from "./TopicSelect";
import WordLearn from "./WordLearn";
import LevelSelect from "../LevelSelect";
import {
  GRAMMAR_CATEGORIES,
  WORD_TYPE_CATEGORIES,
} from "../../data/english/exercises";
import { SPEAKING_LEVELS } from "../../data/english/speaking/sentences";
import {
  findTopicForLevel,
  getLevelsForTopic,
  getVocabularyForTopic,
  Topic,
  TOPICS,
} from "../../data/english/vocabulary";
import {
  loadProgress,
  ProgressState,
  pushRemoteProgress,
  saveProgress,
  subscribeRemoteProgress,
} from "../../utils/english/progress";

const DEFAULT_BATCH_SIZE = 6;
type ExerciseSection = "grammar" | "word-types";

type Stage =
  | "beginner"
  | "topicSelect"
  | "select"
  | "levelDetail"
  | "learn"
  | "quiz"
  | "review"
  | "exerciseQuiz"
  | "speakingHome"
  | "speakingSession";

interface EnglishAppProps {
  syncCode: string;
}

export default function EnglishApp({ syncCode }: EnglishAppProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const segments = location.pathname.split("/").filter(Boolean);
  const rawTopic = segments[0];

  // Determine if this is the beginner section
  const isBeginner = rawTopic === "beginner";

  // Determine if this is a speaking section
  const isSpeaking = rawTopic === "speaking";
  const speakingLevelKey = isSpeaking ? segments[1]?.toLowerCase() : undefined;
  const speakingLevel = speakingLevelKey
    ? SPEAKING_LEVELS.find((l) => l.key === speakingLevelKey)
    : undefined;

  // Determine if this is an exercise section (grammar / word-types) — each
  // section is a single mixed pool now, so there's no per-category route.
  const exerciseSection: ExerciseSection | null =
    rawTopic === "grammar" || rawTopic === "word-types" ? rawTopic : null;

  // Resolve the exercise category object
  const exerciseCategories = exerciseSection === "grammar" ? GRAMMAR_CATEGORIES : WORD_TYPE_CATEGORIES;
  const exerciseCategory = exerciseSection ? exerciseCategories[0] : undefined;

  // Vocabulary routing (unchanged)
  const topicKey = (TOPICS.some((t) => t.key === rawTopic) ? rawTopic : null) as Topic | null;
  const rawLevel = segments[1];
  const levels = topicKey ? getLevelsForTopic(topicKey) : [];
  const matchedLevel = topicKey
    ? levels.find((l) => l.key.toLowerCase() === rawLevel?.toLowerCase())
    : undefined;
  const levelKey = matchedLevel ? matchedLevel.key : null;
  const subRoute = segments[2];

  const stage: Stage = isBeginner
    ? "beginner"
    : isSpeaking
      ? speakingLevelKey && speakingLevel
        ? "speakingSession"
        : "speakingHome"
      : exerciseSection
        ? "exerciseQuiz"
        : !topicKey
          ? "topicSelect"
          : !levelKey
            ? "select"
            : subRoute === "quiz"
              ? "quiz"
              : subRoute === "learn"
                ? "learn"
                : subRoute === "review"
                  ? "review"
                  : "levelDetail";

  // Redirect unknown routes
  useEffect(() => {
    if (segments[0] && !topicKey && !exerciseSection && !isSpeaking && !isBeginner) {
      navigate("/", { replace: true });
    } else if (topicKey && segments[1] && !levelKey) {
      navigate(`/${topicKey}`, { replace: true });
    } else if (exerciseSection && segments[1]) {
      // Old per-category routes (e.g. /grammar/tenses) no longer exist —
      // each section is now a single mixed pool.
      navigate(`/${exerciseSection}`, { replace: true });
    } else if (isSpeaking && speakingLevelKey && !speakingLevel) {
      navigate("/speaking", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments[0], segments[1], topicKey, levelKey, exerciseSection, isSpeaking, isBeginner, speakingLevelKey]);

  const [progress, setProgress] = useState<ProgressState>(() => loadProgress(syncCode));
  const [batchSize, setBatchSize] = useState(() => progress.batchSize ?? DEFAULT_BATCH_SIZE);

  const appliedRemoteRef = useRef(false);
  const autoResumedRef = useRef(false);
  const remoteSyncedRef = useRef(false);

  useEffect(() => {
    saveProgress(syncCode, progress);
  }, [syncCode, progress]);

  useEffect(() => {
    remoteSyncedRef.current = false;
    const unsubscribe = subscribeRemoteProgress(syncCode, (remoteState) => {
      remoteSyncedRef.current = true;
      setProgress((current) => {
        const remoteTime = remoteState.updatedAt ?? 0;
        const localTime = current.updatedAt ?? 0;
        if (remoteTime < localTime) {
          pushRemoteProgress(syncCode, current);
          return current;
        }
        if (!appliedRemoteRef.current) {
          appliedRemoteRef.current = true;
          if (remoteState.batchSize) setBatchSize(remoteState.batchSize);
        }
        return remoteState;
      });
    });
    return unsubscribe;
  }, [syncCode]);

  useEffect(() => {
    if (autoResumedRef.current) return;
    if (location.pathname !== "/") return;
    const session = progress.session;
    if (!session) return;
    autoResumedRef.current = true;
    const sessionTopic = session.topic ?? findTopicForLevel(session.level) ?? "oxford";
    const suffix =
      session.screen === "learn" ? "/learn" : session.screen === "quiz" ? "/quiz" : "";
    navigate(`/${sessionTopic}/${session.level.toLowerCase()}${suffix}`, { replace: true });
  }, [progress.session, location.pathname, navigate]);

  const level = levelKey ? levels.find((l) => l.key === levelKey) : undefined;
  const vocabulary = topicKey ? getVocabularyForTopic(topicKey) : {};
  const pool = levelKey ? vocabulary[levelKey] ?? [] : [];
  const learnedWords = (levelKey && progress.learnedWords[levelKey]) || [];
  const resumeWordIndex =
    levelKey && progress.session?.level === levelKey ? progress.session.wordIndex : 0;

  const learnedSet = useMemo(() => new Set(learnedWords), [learnedWords]);
  const batch = useMemo(() => {
    if (!pool.length) return [];
    return pool.filter((w) => !learnedSet.has(w.en)).slice(0, batchSize);
  }, [pool, learnedSet, batchSize]);
  const reviewWords = useMemo(
    () => pool.filter((w) => learnedSet.has(w.en)),
    [pool, learnedSet],
  );

  const [reviewSelection, setReviewSelection] = useState<string[] | undefined>(undefined);
  const reviewWordsFiltered = useMemo(() => {
    if (reviewSelection) {
      const sel = new Set(reviewSelection);
      return reviewWords.filter((w) => sel.has(w.en));
    }
    return reviewWords;
  }, [reviewWords, reviewSelection]);

  const updateProgress = (updater: (p: ProgressState) => ProgressState) => {
    setProgress((prev) => {
      const next = { ...updater(prev), updatedAt: Date.now() };
      saveProgress(syncCode, next);
      if (remoteSyncedRef.current) {
        pushRemoteProgress(syncCode, next);
      }
      return next;
    });
  };

  const persistSession = (session: ProgressState["session"]) => {
    updateProgress((p) => ({ ...p, session }));
  };

  const handleChangeBatchSize = (size: number) => {
    setBatchSize(size);
    updateProgress((p) => ({ ...p, batchSize: size }));
  };

  const handleSelectTopic = (topic: Topic) => navigate(`/${topic}`);

  const handleSelectLevel = (key: string) => {
    if (!topicKey) return;
    const wordIndex = progress.session?.level === key ? progress.session.wordIndex : 0;
    navigate(`/${topicKey}/${key.toLowerCase()}`);
    persistSession({ topic: topicKey, level: key, screen: "levelDetail", wordIndex });
  };

  const handleBackToTopics = () => {
    navigate("/");
    updateProgress((p) => ({ ...p, session: undefined }));
  };

  const handleBackToLevels = () => {
    if (!topicKey) return;
    navigate(`/${topicKey}`);
    updateProgress((p) => ({ ...p, session: undefined }));
  };

  const handleBackToDetail = () => {
    if (!topicKey || !levelKey) return;
    navigate(`/${topicKey}/${levelKey.toLowerCase()}`);
    persistSession({ topic: topicKey, level: levelKey, screen: "levelDetail", wordIndex: resumeWordIndex });
  };

  const handleContinueLearning = () => {
    if (!topicKey || !levelKey) return;
    navigate(`/${topicKey}/${levelKey.toLowerCase()}/learn`);
    persistSession({ topic: topicKey, level: levelKey, screen: "learn", wordIndex: resumeWordIndex });
  };

  const handleWordIndexChange = (wordIndex: number) => {
    if (!topicKey || !levelKey) return;
    persistSession({ topic: topicKey, level: levelKey, screen: "learn", wordIndex });
  };

  const handleFinishLearn = () => {
    if (!topicKey || !levelKey) return;
    navigate(`/${topicKey}/${levelKey.toLowerCase()}/quiz`);
    persistSession({ topic: topicKey, level: levelKey, screen: "quiz", wordIndex: 0 });
  };

  const handleQuizComplete = () => {
    if (!topicKey || !levelKey) return;
    const updatedSet = new Set(progress.learnedWords[levelKey] ?? []);
    batch.forEach((w) => updatedSet.add(w.en));
    const updatedLearnedWords = Array.from(updatedSet);
    updateProgress((p) => ({
      ...p,
      learnedWords: { ...p.learnedWords, [levelKey]: updatedLearnedWords },
      session: { topic: topicKey, level: levelKey, screen: "quiz", wordIndex: 0 },
    }));
  };

  const handleNextBatch = () => {
    if (!topicKey || !levelKey) return;
    navigate(`/${topicKey}/${levelKey.toLowerCase()}/learn`);
    persistSession({ topic: topicKey, level: levelKey, screen: "learn", wordIndex: 0 });
  };

  // Review mode is a no-save practice loop: navigating in and out of it
  // never touches persisted progress or the resumable session.
  const handleStartReview = (selectedKeys?: string[]) => {
    if (!topicKey || !levelKey) return;
    setReviewSelection(selectedKeys);
    navigate(`/${topicKey}/${levelKey.toLowerCase()}/review`);
  };

  const handleBackFromReview = () => {
    if (!topicKey || !levelKey) return;
    navigate(`/${topicKey}/${levelKey.toLowerCase()}`);
  };

  const topicInfo = topicKey ? TOPICS.find((t) => t.key === topicKey) : undefined;

  // Determine active main tab
  const activeTab = isBeginner ? "beginner" : isSpeaking ? "speaking" : (exerciseSection ?? "vocabulary");

  // Which stages show the main tab bar
  const showTabBar = stage === "beginner" || stage === "topicSelect" || stage === "speakingHome" || stage === "exerciseQuiz";

  return (
    <>
      <div>
        {/* Main tab bar (shown on home & exercise category screens) */}
        {showTabBar && (
          <MainTabBar
            active={activeTab}
            onChange={(tab) => {
              if (tab === "vocabulary") navigate("/");
              else navigate(`/${tab}`);
            }}
          />
        )}

        {stage === "beginner" && <EnglishBeginnerGuide />}
        {stage === "topicSelect" && (
          <TopicSelect
            topics={TOPICS}
            onSelect={handleSelectTopic}
          />
        )}
        {stage === "exerciseQuiz" && exerciseSection && exerciseCategory && (
          <ExerciseQuiz
            category={exerciseCategory}
            syncCode={syncCode}
            onBack={() => navigate("/")}
          />
        )}
        {stage === "select" && topicInfo && (
          <LevelSelect
            topicTitle={topicInfo.title}
            topicSubtitle={topicInfo.subtitle}
            levels={levels}
            vocabulary={vocabulary}
            onSelect={handleSelectLevel}
            learnedWords={progress.learnedWords}
            onBackToTopics={handleBackToTopics}
          />
        )}
        {stage === "levelDetail" && level && (
          <LevelDetail
            level={level}
            pool={pool}
            learnedWords={learnedWords}
            batchSize={batchSize}
            onChangeBatchSize={handleChangeBatchSize}
            onContinue={handleContinueLearning}
            onReview={handleStartReview}
            onBack={handleBackToLevels}
          />
        )}
        {stage === "learn" && level && (
          <WordLearn
            words={batch}
            accent={level.accent}
            initialIndex={resumeWordIndex}
            onIndexChange={handleWordIndexChange}
            onFinish={handleFinishLearn}
            onBack={handleBackToDetail}
          />
        )}
        {stage === "quiz" && level && (
          <Quiz
            words={batch}
            pool={pool}
            accent={level.accent}
            onComplete={handleQuizComplete}
            onDone={handleNextBatch}
            onBack={handleBackToDetail}
          />
        )}
        {stage === "review" && level && (
          <Review
            words={reviewWordsFiltered}
            pool={pool}
            accent={level.accent}
            onBack={handleBackFromReview}
          />
        )}
        {stage === "speakingHome" && (
          <SpeakingLevelSelect
            levels={SPEAKING_LEVELS}
            onSelect={(key) => navigate(`/speaking/${key}`)}
          />
        )}
        {stage === "speakingSession" && speakingLevel && (
          <SpeakingSession
            level={speakingLevel}
            onBack={() => navigate("/speaking")}
          />
        )}
      </div>
    </>
  );
}

const TABS = [
  { key: "beginner", labelKey: "tabs.beginner" },
  { key: "vocabulary", labelKey: "tabs.vocabulary" },
  { key: "grammar", labelKey: "tabs.grammar" },
  { key: "word-types", labelKey: "tabs.wordTypes" },
  { key: "speaking", labelKey: "tabs.speaking" },
] as const;

function MainTabBar({
  active,
  onChange,
}: {
  active: string;
  onChange: (tab: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <nav className="tabs-wrap">
    <div className="tabs" role="tablist">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
          >
            {t(tab.labelKey)}
          </button>
        );
      })}
    </div>
    </nav>
  );
}
