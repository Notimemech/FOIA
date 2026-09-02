import React, { useState } from 'react';

/**
 * RouletteCardDeck — Fan card deck animation & spin controller for IELTS Speaking Roulette.
 */
function RouletteCardDeck({ topics, onSelectCard, onSpinRandom, isSpinning }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Distribute cards in a radial arc
  const totalCards = topics.length || 15;
  const maxAngle = 70; // total arc span in degrees
  const angleStep = maxAngle / Math.max(1, totalCards - 1);
  const startAngle = -maxAngle / 2;

  return (
    <div className="sr-deck-view">
      <div className="sr-fan-container">
        {topics.map((t, idx) => {
          const angle = startAngle + idx * angleStep;
          const rad = (angle * Math.PI) / 180;
          const xOffset = Math.sin(rad) * 260;
          const yOffset = -Math.cos(rad) * 40 + 40;

          const spinTransform = isSpinning
            ? `rotate(${angle + 720}deg) translate(${xOffset * 0.2}px, ${yOffset}px) scale(0.9)`
            : `rotate(${angle}deg) translate(${xOffset}px, ${yOffset}px)`;

          const colorCls = `sr-card-${t.colorTheme || 'sage'}`;

          return (
            <div
              key={t.id || idx}
              className={`sr-fan-card ${colorCls}`}
              style={{
                transform: spinTransform,
                zIndex: hoveredIdx === idx ? 99 : idx + 1,
                transition: isSpinning
                  ? `transform 1s cubic-bezier(0.2, 0.8, 0.2, 1) ${idx * 0.03}s`
                  : 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
