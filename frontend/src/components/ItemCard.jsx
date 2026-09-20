import Avatar from "./Avatar.jsx";

// One avatar frame for sale, shown on the player's own initial so they can
// see exactly how it will look.
export default function ItemCard({ item, playerName, owned, equipped, onBuy, onEquip }) {
  return (
    <div className="item">
      <div className="item-thumb">
        <Avatar name={playerName} frame={item.id} size={112} />
        {equipped && <span className="item-flag">Equipped</span>}
      </div>
      <div className="item-body">
        <div className="item-name">{item.name}</div>
        <div className="item-blurb">{item.blurb}</div>
        <div className="item-price">{item.price}g</div>
        {owned ? (
          <button type="button" className="btn-outline item-btn owned" onClick={() => onEquip(item.id)}>
            {equipped ? "Unequip" : "Equip"}
          </button>
        ) : (
          <button type="button" className="btn-outline item-btn" onClick={() => onBuy(item.id)}>
            Purchase
          </button>
        )}
      </div>
    </div>
  );
}
