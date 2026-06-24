"use client";

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

function DpadButton({
  label,
  keyName,
  className,
}: {
  label: string;
  keyName?: string;
  className?: string;
}) {
  if (!keyName) return <div className={className} />;

  return (
    <button
      className={`flex items-center justify-center bg-gray-700 border border-gray-500 text-white text-lg font-bold select-none active:bg-gray-500 ${className ?? ""}`}
      {...keyHandlers(keyName)}
    >
      {label}
    </button>
  );
}

export function VirtualGamepad({
  keyMap,
  onPause,
  skin,
  skins,
  onSkinChange,
}: VirtualGamepadProps) {
  return (
    <div className="md:hidden w-full bg-gray-900 border-t border-gray-700 p-3 flex flex-col gap-3">
      {/* D-pad + Action buttons row */}
      <div className="flex items-center justify-between">
        {/* D-pad */}
        <div className="grid grid-cols-3 grid-rows-3 w-36 h-36">
          <div />
          <DpadButton label="▲" keyName={keyMap.up} className="rounded-t" />
          <div />
          <DpadButton label="◀" keyName={keyMap.left} className="rounded-l" />
          <div className="bg-gray-800 border border-gray-600 rounded" />
          <DpadButton label="▶" keyName={keyMap.right} className="rounded-r" />
          <div />
          <DpadButton label="▼" keyName={keyMap.down} className="rounded-b" />
          <div />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 items-end">
          {keyMap.actionB && (
            <button
              className="w-14 h-14 rounded-full bg-blue-700 border-2 border-blue-400 text-white font-bold text-sm select-none active:bg-blue-500"
              {...keyHandlers(keyMap.actionB)}
            >
              B
            </button>
          )}
          {keyMap.actionA && (
            <button
              className="w-14 h-14 rounded-full bg-red-700 border-2 border-red-400 text-white font-bold text-sm select-none active:bg-red-500"
              {...keyHandlers(keyMap.actionA)}
            >
              A
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Pause + Skin selector */}
      <div className="flex items-center justify-between gap-2">
        <button
          className="px-4 py-2 bg-yellow-700 border border-yellow-500 text-white text-xs font-bold rounded select-none active:bg-yellow-500"
          onTouchStart={(e) => e.preventDefault()}
          onClick={onPause}
        >
          PAUSA
        </button>

        {skins.length > 0 && (
          <select
            className="flex-1 bg-gray-800 border border-gray-600 text-white text-xs rounded px-2 py-2"
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
      </div>
    </div>
  );
}
