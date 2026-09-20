import { useState } from "react";
import { useGame } from "../context/GameContext.jsx";
import QuestCard from "../components/QuestCard.jsx";
import CategoryPicker from "../components/CategoryPicker.jsx";
import Icon from "../components/icons.jsx";
import { ATTRIBUTES } from "../data/constants.js";
import { DIFFICULTIES } from "../lib/game-engine/economy.js";
import { CATEGORIES, CATEGORY_ATTRIBUTE, QUEST_CATEGORIES } from "../lib/game-engine/badges.js";

// Filter by the four life categories. "General" quests still show under All.
const FILTERS = ["All", ...QUEST_CATEGORIES.filter((c) => c !== "General"), "Overdue"];
const REPEATS = ["One-time", "Daily quest", "Weekly"];

const emptyForm = { title: "", category: "Study", attribute: "Intellect", difficulty: "Normal", repeat: "One-time" };

export default function QuestLog() {
  const { quests, completeQuest, addQuest } = useGame();
  const [filter, setFilter] = useState("All");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const visible = quests.filter((q) => {
    if (filter === "All") return true;
    if (filter === "Overdue") return q.overdue;
    return q.category === filter;
  });

  function setField(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setError("");
    };
  }

  // Choosing a category also pre-selects the stat it usually trains. You can still change it.
  function setCategory(category) {
    setForm((f) => ({ ...f, category, attribute: CATEGORY_ATTRIBUTE[category] }));
  }

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Give your quest a name.");
      return;
    }
    addQuest({ ...form, title: form.title.trim() });
    setForm(emptyForm);
    setFormOpen(false);
    setFilter("All");
  }

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title font-display">Quest log</h1>
        <button type="button" className="btn-primary" onClick={() => setFormOpen((o) => !o)} aria-expanded={formOpen}>
          {formOpen ? "Close" : "New quest"}
        </button>
      </div>

      {formOpen && (
        <form className="card quest-form" onSubmit={submit} noValidate>
          <h2 className="font-display">New quest</h2>
          {error && <div className="error-msg show">{error}</div>}

          <div className="field">
            <label htmlFor="q-title">Quest name</label>
            <input id="q-title" type="text" placeholder="Read 20 pages" value={form.title} onChange={setField("title")} autoFocus />
          </div>

          <CategoryPicker value={form.category} onChange={setCategory} />

          <div className="form-row">
            <div className="field">
              <label htmlFor="q-attr">Trains</label>
              <select id="q-attr" value={form.attribute} onChange={setField("attribute")}>
                {ATTRIBUTES.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="q-diff">Difficulty</label>
              <select id="q-diff" value={form.difficulty} onChange={setField("difficulty")}>
                {Object.entries(DIFFICULTIES).map(([name, r]) => (
                  <option key={name} value={name}>
                    {name} · +{r.xp} XP · {r.gold}g
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="q-repeat">Repeat</label>
              <select id="q-repeat" value={form.repeat} onChange={setField("repeat")}>
                {REPEATS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Add quest
            </button>
            <button type="button" className="btn-outline" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="filters" role="group" aria-label="Filter quests">
        {FILTERS.map((name) => (
          <button
            key={name}
            type="button"
            className={"filter" + (filter === name ? " active" : "")}
            style={CATEGORIES[name] ? { "--c": CATEGORIES[name].color } : undefined}
            onClick={() => setFilter(name)}
            aria-pressed={filter === name}
          >
            {CATEGORIES[name] && <Icon className="ficon" name={CATEGORIES[name].icon} size={14} strokeWidth={2} />}
            {name}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <div className="big">✦</div>
          No quests under this filter. Add one to get started.
        </div>
      ) : (
        visible.map((quest) => <QuestCard key={quest.id} quest={quest} onComplete={completeQuest} />)
      )}
    </div>
  );
}
