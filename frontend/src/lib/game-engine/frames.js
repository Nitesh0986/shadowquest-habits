export const FRAMES = [
  { id: "iron", name: "Iron edge", price: 40, blurb: "A riveted steel plate with heavy corner brackets." },
  { id: "rune", name: "Rune border", price: 60, blurb: "Carved stone with a rune on every side." },
  { id: "ember", name: "Ember ring", price: 90, blurb: "A ring of fire that looks like it is moving." },
  { id: "frost", name: "Frost lattice", price: 120, blurb: "Ice crystals creeping in from the corners." },
  { id: "monarch", name: "Monarch crown", price: 180, blurb: "Cut corners and a crown for the top of the ranks. Glows." },
  { id: "sigil", name: "Golden sigil", price: 250, blurb: "A triple gold rule and a star. Glows." },
];

export function getFrame(id) {
  return FRAMES.find((f) => f.id === id) ?? null;
}
