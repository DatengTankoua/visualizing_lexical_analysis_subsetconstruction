import { useTolgee } from "@tolgee/react";

export default function LanguageToggle() {
  const tolgee = useTolgee(["language"]);
  const lang = tolgee.getLanguage();

  const cls = (active: boolean) =>
    `px-2 py-1 border rounded text-sm transition ${
      active ? "bg-gray-200" : "hover:bg-gray-100"
    }`;

  return (
    <div className="flex items-center gap-2">
      <button className={cls(lang === "de")} onClick={() => tolgee.changeLanguage("de")}>
        DE
      </button>
      <button className={cls(lang === "en")} onClick={() => tolgee.changeLanguage("en")}>
        EN
      </button>
    </div>
  );
}
