import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import ChineseBeginnerGuide from "./ChineseBeginnerGuide";
import ChineseLevelDetail from "./ChineseLevelDetail";
import ChineseQuiz from "./ChineseQuiz";
import ChineseReview from "./ChineseReview";
import ChineseWordLearn from "./ChineseWordLearn";
import ChineseSentenceLearn from "./ChineseSentenceLearn";
import PinyinSelect, { type PinyinSet } from "./PinyinSelect";
import PinyinChart from "./PinyinChart";
import LevelSelect from "../LevelSelect";
import SentenceLevelSelect from "../sentences/SentenceLevelSelect";
import SentencePartSelect from "../sentences/SentencePartSelect";
import { CHINESE_LEVELS } from "../../data/chinese/levels";
import { CHINESE_VOCABULARY } from "../../data/chinese/vocabulary";
import { CHINESE_SENTENCES } from "../../data/chinese/sentences";
import type { HskLevel } from "../../data/chinese/types";
import { partCount, sentencesInPart } from "../../data/sentences/parts";
import {
  loadChineseProgress,
  pushChineseRemoteProgress,
  saveChineseProgress,
  subscribeChineseRemoteProgress,
  type ChineseProgressState,
} from "../../utils/chinese/progress";

const DEFAULT_BATCH_SIZE = 6;
const PINYIN_SETS: PinyinSet[] = ["initials", "finals", "tones"];

type ChineseStage =
  | "beginner"
  | "pinyinSelect"
  | "pinyinChart"
  | "vocabLevelSelect"
  | "vocabLevelDetail"
  | "vocabLearn"
  | "vocabQuiz"
  | "vocabReview"
  | "sentenceLevelSelect"
  | "sentencePartSelect"
  | "sentenceLearn";

interface ChineseAppProps {
  syncCode: string;
}

export default function ChineseApp({ syncCode }: ChineseAppProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // location.pathname is "/zh[/...]" — segments here are everything after "zh".
  const allSegments = location.pathname.split("/").filter(Boolean);
  const segments = allSegments[0] === "zh" ? allSegments.slice(1) : [];

  const section = segments[0]; // undefined | 'pinyin' | 'vocabulary' | 'sentences'
  const pinyinSetKey = section === "pinyin" ? (segments[1] as PinyinSet | undefined) : undefined;
  const pinyinSet = pinyinSetKey && PINYIN_SETS.includes(pinyinSetKey) ? pinyinSetKey : null;

  const rawLevel = section === "vocabulary" ? segments[1] : undefined;
  const matchedLevel = rawLevel
    ? CHINESE_LEVELS.find((l) => l.key.toLowerCase() === rawLevel.toLowerCase())
    : undefined;
  const levelKey = (matchedLevel?.key ?? null) as HskLevel | null;
  const subRoute = section === "vocabulary" ? segments[2] : undefined;

  // Sentence routing: /zh/sentences/{level}/{part}
  const rawSentenceLevel = section === "sentences" ? segments[1] : undefined;
  const sentenceLevel = rawSentenceLevel
    ? CHINESE_LEVELS.find((l) => l.key.toLowerCase() === rawSentenceLevel.toLowerCase())
    : undefined;
  const sentenceLevelKey = (sentenceLevel?.key ?? null) as HskLevel | null;
  const levelSentences = sentenceLevelKey ? CHINESE_SENTENCES[sentenceLevelKey] : [];
  const sentencePartCount = partCount(levelSentences.length);
  const rawPart = section === "sentences" ? segments[2] : undefined;
  const parsedPart = rawPart && /^\d+$/.test(rawPart) ? Number(rawPart) : 0;
  const sentencePart = parsedPart >= 1 && parsedPart <= sentencePartCount ? parsedPart : null;

  const stage: ChineseStage =
    section === "beginner"
      ? "beginner"
      : section === "pinyin"
        ? pinyinSet
          ? "pinyinChart"
          : "pinyinSelect"
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
            ? !sentenceLevelKey
              ? "sentenceLevelSelect"
              : sentencePart
                ? "sentenceLearn"
                : "sentencePartSelect"
            : "beginner";

  const activeTab: "beginner" | "pinyin" | "vocabulary" | "sentences" =
    section === "vocabulary" ? "vocabulary" : section === "pinyin" ? "pinyin" : section === "sentences" ? "sentences" : "beginner";
  const showTabBar = stage === "pinyinSelect" || stage === "vocabLevelSelect" || stage === "beginner" || stage === "sentenceLevelSelect";

  // Redirect unknown routes back to a sane place within /zh.
  useEffect(() => {
    if (section === "pinyin" && segments[1] && !pinyinSet) {
      navigate("/zh/pinyin", { replace: true });
    } else if (section === "vocabulary" && segments[1] && !levelKey) {
      navigate("/zh/vocabulary", { replace: true });
    } else if (section === "sentences" && segments[1] && !sentenceLevelKey) {
      navigate("/zh/sentences", { replace: true });
    } else if (section === "sentences" && sentenceLevelKey && segments[2] && !sentencePart) {
      navigate(`/zh/sentences/${sentenceLevelKey.toLowerCase()}`, { replace: true });
    } else if (section && section !== "pinyin" && section !== "vocabulary" && section !== "beginner" && section !== "sentences") {
      navigate("/zh", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, segments[1], segments[2], sentenceLevelKey, sentencePart, pinyinSet, levelKey]);

  const [progress, setProgress] = useState<ChineseProgressState>(() => loadChineseProgress(syncCode));
  const [batchSize, setBatchSize] = useState(() => progress.batchSize ?? DEFAULT_BATCH_SIZE);

  const appliedRemoteRef = useRef(false);
  const autoResumedRef = useRef(false);
  const remoteSyncedRef = useRef(false);

  useEffect(() => {
    saveChineseProgress(syncCode, progress);
  }, [syncCode, progress]);

  useEffect(() => {
    remoteSyncedRef.current = false;
    const unsubscribe = subscribeChineseRemoteProgress(syncCode, (remoteState) => {
      remoteSyncedRef.current = true;
      setProgress((current) => {
        const remoteTime = remoteState.updatedAt ?? 0;
        const localTime = current.updatedAt ?? 0;
        if (remoteTime < localTime) {
          pushChineseRemoteProgress(syncCode, current);
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

  // Resuming a saved vocabulary session only applies at the /zh root.
  useEffect(() => {
    if (autoResumedRef.current) return;
    if (location.pathname !== "/zh") return;
    const session = progress.session;
    if (!session) return;
    autoResumedRef.current = true;
    const suffix =
      session.screen === "learn" ? "/learn" : session.screen === "quiz" ? "/quiz" : "";
    navigate(`/zh/vocabulary/${session.level.toLowerCase()}${suffix}`, { replace: true });
  }, [progress.session, location.pathname, navigate]);

  const level = levelKey ? CHINESE_LEVELS.find((l) => l.key === levelKey) : undefined;
  const pool = levelKey ? CHINESE_VOCABULARY[levelKey] ?? [] : [];
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

  const updateProgress = (updater: (p: ChineseProgressState) => ChineseProgressState) => {
    setProgress((prev) => {
      const next = { ...updater(prev), updatedAt: Date.now() };
      saveChineseProgress(syncCode, next);
      if (remoteSyncedRef.current) {
        pushChineseRemoteProgress(syncCode, next);
      }
      return next;
    });
  };

  const persistSession = (session: ChineseProgressState["session"]) => {
    updateProgress((p) => ({ ...p, session }));
  };

  const handleChangeBatchSize = (size: number) => {
    setBatchSize(size);
    updateProgress((p) => ({ ...p, batchSize: size }));
  };

  const handleSelectLevel = (key: string) => {
    const wordIndex = progress.session?.level === key ? progress.session.wordIndex : 0;
    navigate(`/zh/vocabulary/${key.toLowerCase()}`);
    persistSession({ level: key as HskLevel, screen: "levelDetail", wordIndex });
  };

  const handleBackToLevels = () => {
    navigate("/zh/vocabulary");
    updateProgress((p) => ({ ...p, session: undefined }));
  };

  const handleBackToDetail = () => {
    if (!levelKey) return;
    navigate(`/zh/vocabulary/${levelKey.toLowerCase()}`);
    persistSession({ level: levelKey, screen: "levelDetail", wordIndex: resumeWordIndex });
  };

  const handleContinueLearning = () => {
    if (!levelKey) return;
    navigate(`/zh/vocabulary/${levelKey.toLowerCase()}/learn`);
    persistSession({ level: levelKey, screen: "learn", wordIndex: resumeWordIndex });
  };

  const handleWordIndexChange = (wordIndex: number) => {
    if (!levelKey) return;
    persistSession({ level: levelKey, screen: "learn", wordIndex });
  };

  const handleFinishLearn = () => {
    if (!levelKey) return;
    navigate(`/zh/vocabulary/${levelKey.toLowerCase()}/quiz`);
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
    navigate(`/zh/vocabulary/${levelKey.toLowerCase()}/learn`);
    persistSession({ level: levelKey, screen: "learn", wordIndex: 0 });
  };

  const handleStartReview = (selectedKeys?: string[]) => {
    if (!levelKey) return;
    setReviewSelection(selectedKeys);
    navigate(`/zh/vocabulary/${levelKey.toLowerCase()}/review`);
  };

  const handleBackFromReview = () => {
    if (!levelKey) return;
    navigate(`/zh/vocabulary/${levelKey.toLowerCase()}`);
  };

  return (
    <>
    <div>
      {showTabBar && (
        <ChineseTabBar
          active={activeTab}
          onChange={(tab) =>
            navigate(
              tab === "pinyin" ? "/zh/pinyin"
              : tab === "vocabulary" ? "/zh/vocabulary"
              : tab === "sentences" ? "/zh/sentences"
              : "/zh/beginner"
            )
          }
        />
      )}

      {stage === "beginner" && <ChineseBeginnerGuide />}
      {stage === "pinyinSelect" && (
        <PinyinSelect onSelect={(set) => navigate(`/zh/pinyin/${set}`)} />
      )}
      {stage === "pinyinChart" && pinyinSet && (
        <PinyinChart set={pinyinSet} onBack={() => navigate("/zh/pinyin")} />
      )}
      {stage === "vocabLevelSelect" && (
        <LevelSelect
          topicTitle={t("chinese.levelSelect.title")}
          topicSubtitle={t("chinese.levelSelect.subtitle")}
          levels={CHINESE_LEVELS}
          vocabulary={CHINESE_VOCABULARY}
          onSelect={handleSelectLevel}
          learnedWords={progress.learnedWords}
        />
      )}
      {stage === "vocabLevelDetail" && level && (
        <ChineseLevelDetail
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
        <ChineseWordLearn
          words={batch}
          accent={level.accent}
          initialIndex={resumeWordIndex}
          onIndexChange={handleWordIndexChange}
          onFinish={handleFinishLearn}
          onBack={handleBackToDetail}
        />
      )}
      {stage === "vocabQuiz" && level && (
        <ChineseQuiz
          words={batch}
          pool={pool}
          accent={level.accent}
          onComplete={handleQuizComplete}
          onDone={handleNextBatch}
          onBack={handleBackToDetail}
        />
      )}
      {stage === "vocabReview" && level && (
        <ChineseReview words={reviewWordsFiltered} pool={pool} accent={level.accent} onBack={handleBackFromReview} />
      )}
      {stage === "sentenceLevelSelect" && (
        <SentenceLevelSelect
          ns="chinese"
          levels={CHINESE_LEVELS}
          sentences={CHINESE_SENTENCES}
          onSelect={(key) => navigate(`/zh/sentences/${key.toLowerCase()}`)}
        />
      )}
      {stage === "sentencePartSelect" && sentenceLevel && sentenceLevelKey && (
        <SentencePartSelect
          ns="chinese"
          level={sentenceLevel}
          total={levelSentences.length}
          onSelect={(part) => navigate(`/zh/sentences/${sentenceLevelKey.toLowerCase()}/${part}`)}
          onBack={() => navigate("/zh/sentences")}
        />
      )}
      {stage === "sentenceLearn" && sentenceLevel && sentenceLevelKey && sentencePart && (
        <ChineseSentenceLearn
          key={`${sentenceLevelKey}-${sentencePart}`}
          sentences={sentencesInPart(levelSentences, sentencePart)}
          levelTitle={sentenceLevel.title}
          part={sentencePart}
          onBack={() => navigate(`/zh/sentences/${sentenceLevelKey.toLowerCase()}`)}
          onNextPart={
            sentencePart < sentencePartCount
              ? () => navigate(`/zh/sentences/${sentenceLevelKey.toLowerCase()}/${sentencePart + 1}`)
              : undefined
          }
        />
      )}
    </div>
    </>
  );
}

function ChineseTabBar({
  active,
  onChange,
}: {
  active: "beginner" | "pinyin" | "vocabulary" | "sentences";
  onChange: (tab: "beginner" | "pinyin" | "vocabulary" | "sentences") => void;
}) {
  const { t } = useTranslation();
  const tabs: { key: "beginner" | "pinyin" | "vocabulary" | "sentences"; labelKey: string }[] = [
    { key: "beginner", labelKey: "chinese.tabs.beginner" },
    { key: "pinyin", labelKey: "chinese.tabs.pinyin" },
    { key: "vocabulary", labelKey: "chinese.tabs.vocabulary" },
    { key: "sentences", labelKey: "chinese.tabs.sentences" },
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
