import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import AlphabetSelect from "./AlphabetSelect";
import AlphabetTable from "./AlphabetTable";
import JapaneseBeginnerGuide from "./JapaneseBeginnerGuide";
import JapaneseLevelDetail from "./JapaneseLevelDetail";
import JapaneseQuiz from "./JapaneseQuiz";
import JapaneseReview from "./JapaneseReview";
import JapaneseWordLearn from "./JapaneseWordLearn";
import JapaneseSentenceLearn from "./JapaneseSentenceLearn";
import LevelSelect from "../LevelSelect";
import SentenceCategorySelect from "../sentences/SentenceCategorySelect";
import type { AlphabetSet } from "../../data/japanese/alphabet";
import { JAPANESE_LEVELS } from "../../data/japanese/levels";
import { JAPANESE_VOCABULARY } from "../../data/japanese/vocabulary";
import { JAPANESE_SENTENCES } from "../../data/japanese/sentences";
import type { JlptLevel } from "../../data/japanese/types";
import { SENTENCE_DIFFICULTIES, type SentenceCategory, type SentenceDifficulty } from "../../data/sentences/categories";
import {
  loadJapaneseProgress,
  pushJapaneseRemoteProgress,
  saveJapaneseProgress,
  subscribeJapaneseRemoteProgress,
  type JapaneseProgressState,
} from "../../utils/japanese/progress";

const DEFAULT_BATCH_SIZE = 6;
const ALPHABET_SETS: AlphabetSet[] = ["hiragana", "katakana", "kanji"];

type JapaneseStage =
  | "beginner"
  | "alphabetSelect"
  | "alphabetTable"
  | "vocabLevelSelect"
  | "vocabLevelDetail"
  | "vocabLearn"
  | "vocabQuiz"
  | "vocabReview"
  | "sentenceSelect"
  | "sentenceLearn";

interface JapaneseAppProps {
  syncCode: string;
}

export default function JapaneseApp({ syncCode }: JapaneseAppProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // location.pathname is "/jp[/...]" — segments here are everything after "jp".
  const allSegments = location.pathname.split("/").filter(Boolean);
  const segments = allSegments[0] === "jp" ? allSegments.slice(1) : [];

  const section = segments[0]; // undefined | 'alphabet' | 'vocabulary' | 'sentences'
  const alphabetSetKey = section === "alphabet" ? (segments[1] as AlphabetSet | undefined) : undefined;
  const alphabetSet = alphabetSetKey && ALPHABET_SETS.includes(alphabetSetKey) ? alphabetSetKey : null;

  const rawLevel = section === "vocabulary" ? segments[1] : undefined;
  const matchedLevel = rawLevel
    ? JAPANESE_LEVELS.find((l) => l.key.toLowerCase() === rawLevel.toLowerCase())
    : undefined;
  const levelKey = (matchedLevel?.key ?? null) as JlptLevel | null;
  const subRoute = section === "vocabulary" ? segments[2] : undefined;

  // Sentence routing: /jp/sentences/{category}/{difficulty}
  const sentenceCategory = section === "sentences" ? (segments[1] as SentenceCategory | undefined) : undefined;
  const sentenceDifficulty = section === "sentences" ? (segments[2] as SentenceDifficulty | undefined) : undefined;
  const validSentenceCats = ["daily_life", "nature", "food", "work", "travel", "family"] as const;
  const validCat = sentenceCategory && (validSentenceCats as readonly string[]).includes(sentenceCategory) ? sentenceCategory as SentenceCategory : null;
  const validDiff = sentenceDifficulty && (SENTENCE_DIFFICULTIES as string[]).includes(sentenceDifficulty) ? sentenceDifficulty : null;

  const stage: JapaneseStage =
    section === "beginner"
      ? "beginner"
      : section === "alphabet"
        ? alphabetSet
          ? "alphabetTable"
          : "alphabetSelect"
        : section === "vocabulary"
          ? !levelKey
            ? "vocabLevelSelect"
            : subRoute === "quiz"
              ? "vocabQuiz"
              : subRoute === "learn"
                ? "vocabLearn"
                : subRoute === "review"
                  ? "vocabReview"
                  : "vocabLevelDetail"
          : section === "sentences"
            ? validCat && validDiff
              ? "sentenceLearn"
              : "sentenceSelect"
            : "beginner";

  const activeTab: "beginner" | "alphabet" | "vocabulary" | "sentences" =
    section === "vocabulary" ? "vocabulary" : section === "alphabet" ? "alphabet" : section === "sentences" ? "sentences" : "beginner";
  const showTabBar = stage === "beginner" || stage === "alphabetSelect" || stage === "vocabLevelSelect" || stage === "sentenceSelect";

  // Redirect unknown routes back to a sane place within /jp.
  useEffect(() => {
    if (section === "alphabet" && segments[1] && !alphabetSet) {
      navigate("/jp/alphabet", { replace: true });
    } else if (section === "vocabulary" && segments[1] && !levelKey) {
      navigate("/jp/vocabulary", { replace: true });
    } else if (section === "sentences" && segments[1] && (!validCat || (segments[2] && !validDiff))) {
      navigate("/jp/sentences", { replace: true });
    } else if (section && section !== "alphabet" && section !== "vocabulary" && section !== "beginner" && section !== "sentences") {
      navigate("/jp", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, segments[1], alphabetSet, levelKey]);

  const [progress, setProgress] = useState<JapaneseProgressState>(() => loadJapaneseProgress(syncCode));
  const [batchSize, setBatchSize] = useState(() => progress.batchSize ?? DEFAULT_BATCH_SIZE);

  const appliedRemoteRef = useRef(false);
  const autoResumedRef = useRef(false);
  const remoteSyncedRef = useRef(false);

  useEffect(() => {
    saveJapaneseProgress(syncCode, progress);
  }, [syncCode, progress]);

  useEffect(() => {
    remoteSyncedRef.current = false;
    const unsubscribe = subscribeJapaneseRemoteProgress(syncCode, (remoteState) => {
      remoteSyncedRef.current = true;
      setProgress((current) => {
        const remoteTime = remoteState.updatedAt ?? 0;
        const localTime = current.updatedAt ?? 0;
        if (remoteTime < localTime) {
          pushJapaneseRemoteProgress(syncCode, current);
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

  // Resuming a saved vocabulary session only applies at the /jp root.
  useEffect(() => {
    if (autoResumedRef.current) return;
    if (location.pathname !== "/jp") return;
    const session = progress.session;
    if (!session) return;
    autoResumedRef.current = true;
    const suffix =
      session.screen === "learn" ? "/learn" : session.screen === "quiz" ? "/quiz" : "";
    navigate(`/jp/vocabulary/${session.level.toLowerCase()}${suffix}`, { replace: true });
  }, [progress.session, location.pathname, navigate]);

  const level = levelKey ? JAPANESE_LEVELS.find((l) => l.key === levelKey) : undefined;
  const pool = levelKey ? JAPANESE_VOCABULARY[levelKey] ?? [] : [];
  const learnedWords = (levelKey && progress.learnedWords[levelKey]) || [];
  const resumeWordIndex =
    levelKey && progress.session?.level === levelKey ? progress.session.wordIndex : 0;

  const learnedSet = useMemo(() => new Set(learnedWords), [learnedWords]);
  const batch = useMemo(() => {
    if (!pool.length) return [];
    return pool.filter((w) => !learnedSet.has(w.id)).slice(0, batchSize);
  }, [pool, learnedSet, batchSize]);
  const reviewWords = useMemo(() => pool.filter((w) => learnedSet.has(w.id)), [pool, learnedSet]);

  const [reviewSelection, setReviewSelection] = useState<string[] | undefined>(undefined);
  const reviewWordsFiltered = useMemo(() => {
    if (reviewSelection) {
      const sel = new Set(reviewSelection);
      return reviewWords.filter((w) => sel.has(w.id));
    }
    return reviewWords;
  }, [reviewWords, reviewSelection]);

  const updateProgress = (updater: (p: JapaneseProgressState) => JapaneseProgressState) => {
    setProgress((prev) => {
      const next = { ...updater(prev), updatedAt: Date.now() };
      saveJapaneseProgress(syncCode, next);
      if (remoteSyncedRef.current) {
        pushJapaneseRemoteProgress(syncCode, next);
      }
      return next;
    });
  };

  const persistSession = (session: JapaneseProgressState["session"]) => {
    updateProgress((p) => ({ ...p, session }));
  };

  const handleChangeBatchSize = (size: number) => {
    setBatchSize(size);
    updateProgress((p) => ({ ...p, batchSize: size }));
  };

  const handleSelectLevel = (key: string) => {
    const wordIndex = progress.session?.level === key ? progress.session.wordIndex : 0;
    navigate(`/jp/vocabulary/${key.toLowerCase()}`);
    persistSession({ level: key as JlptLevel, screen: "levelDetail", wordIndex });
  };

  const handleBackToLevels = () => {
    navigate("/jp/vocabulary");
    updateProgress((p) => ({ ...p, session: undefined }));
  };

  const handleBackToDetail = () => {
    if (!levelKey) return;
    navigate(`/jp/vocabulary/${levelKey.toLowerCase()}`);
    persistSession({ level: levelKey, screen: "levelDetail", wordIndex: resumeWordIndex });
  };

  const handleContinueLearning = () => {
    if (!levelKey) return;
    navigate(`/jp/vocabulary/${levelKey.toLowerCase()}/learn`);
    persistSession({ level: levelKey, screen: "learn", wordIndex: resumeWordIndex });
  };

  const handleWordIndexChange = (wordIndex: number) => {
    if (!levelKey) return;
    persistSession({ level: levelKey, screen: "learn", wordIndex });
  };

  const handleFinishLearn = () => {
    if (!levelKey) return;
    navigate(`/jp/vocabulary/${levelKey.toLowerCase()}/quiz`);
    persistSession({ level: levelKey, screen: "quiz", wordIndex: 0 });
  };

  const handleQuizComplete = () => {
    if (!levelKey) return;
    const updatedSet = new Set(progress.learnedWords[levelKey] ?? []);
    batch.forEach((w) => updatedSet.add(w.id));
    const updatedLearnedWords = Array.from(updatedSet);
    updateProgress((p) => ({
      ...p,
      learnedWords: { ...p.learnedWords, [levelKey]: updatedLearnedWords },
      session: { level: levelKey, screen: "quiz", wordIndex: 0 },
    }));
  };

  const handleNextBatch = () => {
    if (!levelKey) return;
    navigate(`/jp/vocabulary/${levelKey.toLowerCase()}/learn`);
    persistSession({ level: levelKey, screen: "learn", wordIndex: 0 });
  };

  const handleStartReview = (selectedKeys?: string[]) => {
    if (!levelKey) return;
    setReviewSelection(selectedKeys);
    navigate(`/jp/vocabulary/${levelKey.toLowerCase()}/review`);
  };

  const handleBackFromReview = () => {
    if (!levelKey) return;
    navigate(`/jp/vocabulary/${levelKey.toLowerCase()}`);
  };

  return (
    <>
    <div>
      {showTabBar && (
        <JapaneseTabBar
          active={activeTab}
          onChange={(tab) =>
            navigate(
              tab === "alphabet" ? "/jp/alphabet"
              : tab === "vocabulary" ? "/jp/vocabulary"
              : tab === "sentences" ? "/jp/sentences"
              : "/jp/beginner"
            )
          }
        />
      )}

      {stage === "beginner" && <JapaneseBeginnerGuide />}
      {stage === "alphabetSelect" && (
        <AlphabetSelect onSelect={(set) => navigate(`/jp/alphabet/${set}`)} />
      )}
      {stage === "alphabetTable" && alphabetSet && (
        <AlphabetTable set={alphabetSet} onBack={() => navigate("/jp/alphabet")} />
      )}
      {stage === "vocabLevelSelect" && (
        <LevelSelect
          topicTitle={t("japanese.levelSelect.title")}
          topicSubtitle={t("japanese.levelSelect.subtitle")}
          levels={JAPANESE_LEVELS}
          vocabulary={JAPANESE_VOCABULARY}
          onSelect={handleSelectLevel}
          learnedWords={progress.learnedWords}
        />
      )}
      {stage === "vocabLevelDetail" && level && (
        <JapaneseLevelDetail
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
      {stage === "vocabLearn" && level && (
        <JapaneseWordLearn
          words={batch}
          accent={level.accent}
          initialIndex={resumeWordIndex}
          onIndexChange={handleWordIndexChange}
          onFinish={handleFinishLearn}
          onBack={handleBackToDetail}
        />
      )}
      {stage === "vocabQuiz" && level && (
        <JapaneseQuiz
          words={batch}
          pool={pool}
          accent={level.accent}
          onComplete={handleQuizComplete}
          onDone={handleNextBatch}
          onBack={handleBackToDetail}
        />
      )}
      {stage === "vocabReview" && level && (
        <JapaneseReview words={reviewWordsFiltered} pool={pool} accent={level.accent} onBack={handleBackFromReview} />
      )}
      {stage === "sentenceSelect" && (
        <SentenceCategorySelect
          lang="jp"
          onSelect={(cat, diff) => navigate(`/jp/sentences/${cat}/${diff}`)}
        />
      )}
      {stage === "sentenceLearn" && validCat && validDiff && (
        <JapaneseSentenceLearn
          sentences={JAPANESE_SENTENCES[validCat][validDiff]}
          category={validCat}
          difficulty={validDiff}
          onBack={() => navigate("/jp/sentences")}
        />
      )}
    </div>
    </>
  );
}

function JapaneseTabBar({
  active,
  onChange,
}: {
  active: "beginner" | "alphabet" | "vocabulary" | "sentences";
  onChange: (tab: "beginner" | "alphabet" | "vocabulary" | "sentences") => void;
}) {
  const { t } = useTranslation();
  const tabs: { key: "beginner" | "alphabet" | "vocabulary" | "sentences"; labelKey: string }[] = [
    { key: "beginner", labelKey: "japanese.tabs.beginner" },
    { key: "alphabet", labelKey: "japanese.tabs.alphabet" },
    { key: "vocabulary", labelKey: "japanese.tabs.vocabulary" },
    { key: "sentences", labelKey: "japanese.tabs.sentences" },
  ];
  return (
    <nav className="tabs-wrap">
    <div className="tabs" role="tablist">
      {tabs.map((tab) => {
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
