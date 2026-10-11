import { useTranslation } from "react-i18next";
import type { SpeakingLevel } from "../../data/english/speaking/sentences";
import PageHeader from "../PageHeader";

interface Props {
  levels: SpeakingLevel[];
  onSelect: (key: string) => void;
}

export default function SpeakingLevelSelect({ levels, onSelect }: Props) {
  const { t } = useTranslation();
  return (
    <div className="page page-wide">
      <PageHeader eyebrow={t("eyebrow.speaking")} title={t("speakingLevelSelect.title")} subtitle={t("speakingLevelSelect.subtitle")} />
      <div className="choice-grid">
        {levels.map((level) => (
          <button key={level.key} type="button" className="choice" onClick={() => onSelect(level.key)}>
            <span className={level.label.length <= 3 ? "choice-code" : "choice-title"}>{level.label}</span>
            <span className="choice-sub">{level.description}</span>
            <span className="choice-meta">
              {t("speakingLevelSelect.sentencesCount", { count: level.sentences.length })}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
