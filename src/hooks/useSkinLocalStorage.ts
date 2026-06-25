import { useSyncExternalStore } from "react";

const SKIN_EVENT = "skin-change";

function subscribeSkin(cb: () => void) {
  window.addEventListener(SKIN_EVENT, cb);
  return () => window.removeEventListener(SKIN_EVENT, cb);
}

export const useSkinLocalStorage = <T>(key: string, initialValue?: T) => {
  const skin = useSyncExternalStore(
    subscribeSkin,
    () => (localStorage.getItem(key) ?? initialValue ?? "classic") as T,
    () => (initialValue ?? "classic") as T,
  );

  function handleSkinChange(s: T) {
    localStorage.setItem(key, s as string);
    window.dispatchEvent(new CustomEvent(SKIN_EVENT));
  }

  return { skin, handleSkinChange };
};
