import React, { useState } from 'react';

/**
 * RouletteCardDeck — Fan card deck animation & spin controller for IELTS Speaking Roulette.
 */
function RouletteCardDeck({ topics, onSelectCard, onSpinRandom, isSpinning }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Distribute cards in a radial arc
  const totalCards = topics.length || 15;
  const maxAngle = 90; // wider arc span in degrees
  const angleStep = maxAngle / Math.max(1, totalCards - 1);
  const startAngle = -maxAngle / 2;

  return (
    <div className="sr-deck-view">
      <div className="sr-fan-container">
        {topics.map((t, idx) => {
          const angle = startAngle + idx * angleStep;
          const rad = (angle * Math.PI) / 180;
          const xOffset = Math.sin(rad) * 450;
          const yOffset = -Math.cos(rad) * 60 + 60;

          const spinTransform = isSpinning
            ? `translate(0px, 50px) scale(0.8) rotate(${Math.random() * 20 - 10}deg)`
            : `translate(${xOffset}px, ${yOffset}px) rotate(${angle}deg)`;

          const colorCls = `sr-card-${t.colorTheme || 'sage'}`;

          return (
            <div
              key={t.id || idx}
              className={`sr-fan-card ${colorCls}`}
              style={{
                transform: spinTransform,
                zIndex: hoveredIdx === idx ? 99 : idx + 1,
                transition: 'transform 0.4s ease-out, box-shadow 0.2s ease',
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onSelectCard(t)}
              title={`Click to draw: ${t.topic}`}
            >
              <span className="sr-fan-card-topic">{t.topic}</span>
              <span className="sr-fan-card-mark">?</span>
              <div className="sr-fan-card-deco" />
            </div>
          );
        })}
      </div>

      <div className="sr-spin-action-box">
        <button
          type="button"
          className="sr-btn-spin"
          onClick={onSpinRandom}
          disabled={isSpinning}
        >
          {isSpinning ? '🎰 Spinning...' : 'Spin the deck'}
        </button>
        <span className="sr-spin-hint">Tap a card or the button to draw a random question</span>
      </div>
    </div>
  );
}

export default RouletteCardDeck;
