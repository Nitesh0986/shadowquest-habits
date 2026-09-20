import { useGame } from "../context/GameContext.jsx";
import ItemCard from "../components/ItemCard.jsx";

export default function Shop() {
  const { player, shopItems, purchase, equipFrame } = useGame();

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title font-display">Shop</h1>
          <div className="sub">Avatar frames. Buy one and it goes straight onto your profile.</div>
        </div>
        <div className="gold-readout">
          <span>Your gold</span>
          <strong className="font-display">{player.gold}</strong>
        </div>
      </div>

      <div className="shop-grid">
        {shopItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            playerName={player.name}
            owned={item.owned}
            equipped={item.equipped}
            onBuy={purchase}
            onEquip={equipFrame}
          />
        ))}
      </div>
    </div>
  );
}
