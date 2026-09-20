import Icon from "./icons.jsx";
import { CATEGORIES, QUEST_CATEGORIES } from "../lib/game-engine/badges.js";

// Pick what part of life a quest belongs to. Shown as icon buttons so the
// same symbols that appear on badges and quest cards are learned here first.
export default function CategoryPicker({ value, onChange }) {
  return (
    <div className="field">
      <span className="field-label" id="cat-label">
        Category
      </span>
      <div className="cat-picker" role="radiogroup" aria-labelledby="cat-label">
        {QUEST_CATEGORIES.map((name) => (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={value === name}
            className="cat-option"
            style={{ "--c": CATEGORIES[name].color }}
            onClick={() => onChange(name)}
          >
            <Icon name={CATEGORIES[name].icon} size={16} strokeWidth={2} />
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
