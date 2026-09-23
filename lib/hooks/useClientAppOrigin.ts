"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

export function useClientAppOrigin() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => ""
  );
}
