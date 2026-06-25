"use client";

import styles from "./VirtualGamepad.module.css";

interface GamepadKeyMap {
  up?: string;
  down?: string;
  left?: string;
  right?: string;
  actionA?: string;
  actionB?: string;
}

interface VirtualGamepadProps {
  keyMap: GamepadKeyMap;
  onPause: () => void;
  onExit?: () => void;
  skin: string;
  skins: { id: string; label: string }[];
  onSkinChange: (skin: string) => void;
}

// Maps e.key values to e.code so games using either property both respond
const KEY_TO_CODE: Record<string, string> = {
  " ": "Space",
  x: "KeyX",
  z: "KeyZ",
};

function dispatchKey(key: string, type: "keydown" | "keyup") {
  const code = KEY_TO_CODE[key] ?? key;
  window.dispatchEvent(new KeyboardEvent(type, { key, code, bubbles: true }));
}

/** Devuelve los event handlers de presión/liberación para un botón táctil.
 *  Incluye onTouchCancel para evitar que la tecla quede "trabada" cuando el
 *  navegador cancela el toque (scroll takeover, multitouch, interrupción del SO). */
function keyHandlers(keyName: string) {
  const release = (e: React.TouchEvent) => {
    e.preventDefault();
    dispatchKey(keyName, "keyup");
  };
  return {
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      dispatchKey(keyName, "keydown");
    },
    onTouchEnd: release,
    onTouchCancel: release,
    onMouseDown: () => dispatchKey(keyName, "keydown"),
    onMouseUp: () => dispatchKey(keyName, "keyup"),
    onMouseLeave: () => dispatchKey(keyName, "keyup"),
  };
}

function DpadButton({ label, keyName }: { label: string; keyName?: string }) {
  if (!keyName) return <div />;

  return (
    <button className={styles.dp} {...keyHandlers(keyName)}>
      {label}
    </button>
  );
}

export function VirtualGamepad({
  keyMap,
  onPause,
  onExit,
  skin,
  skins,
  onSkinChange,
}: VirtualGamepadProps) {
  return (
    <div className={`md:hidden ${styles.gp}`}>
      {/* D-pad + Action buttons row */}
      <div className={styles.gpBody}>
        {/* D-pad */}
        <div className={styles.dpWrapper}>
          <div />
          <DpadButton label="▲" keyName={keyMap.up} />
          <div />
          <DpadButton label="◀" keyName={keyMap.left} />
          <div className={styles.dpHub}>
            <span className={styles.dpHubGem} />
          </div>
          <DpadButton label="▶" keyName={keyMap.right} />
          <div />
          <DpadButton label="▼" keyName={keyMap.down} />
          <div />
        </div>

        {/* Action buttons */}
        <div className={styles.abWrapper}>
          {keyMap.actionB && (
            <button
              className={`${styles.ab} ${styles.abB}`}
              {...keyHandlers(keyMap.actionB)}
            >
              <span className={styles.abRing} />
              <span className={styles.abLetter}>B</span>
            </button>
          )}
          {keyMap.actionA && (
            <button
              className={`${styles.ab} ${styles.abA}`}
              {...keyHandlers(keyMap.actionA)}
            >
              <span className={styles.abRing} />
              <span className={styles.abLetter}>A</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Pause + Skin selector + Exit */}
      <div className={styles.bottomRow}>
        <button
          className={styles.metaBtn}
          onTouchStart={(e) => e.preventDefault()}
          onClick={onPause}
        >
          PAUSA
        </button>

        {skins.length > 0 && (
          <select
            className={styles.skinSelect}
            value={skin}
            onChange={(e) => onSkinChange(e.target.value)}
          >
            {skins.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        )}

        {onExit && (
          <button
            className={styles.metaBtn}
            onTouchStart={(e) => e.preventDefault()}
            onClick={onExit}
          >
            SALIR
          </button>
        )}
      </div>
    </div>
  );
}
