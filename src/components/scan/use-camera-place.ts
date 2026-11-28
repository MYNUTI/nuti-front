"use client";

import { useSyncExternalStore } from "react";

import { type CameraPlace, detectCameraPlace } from "./camera-place";

// 기기 판별은 브라우저에서만 된다. 서버 렌더에서는 null이라 쓰는 쪽은 아무것도 그리지 않는다
let cachedPlace: CameraPlace | undefined;
const subscribe = () => () => {};
const getPlace = () => (cachedPlace ??= detectCameraPlace());
const getServerPlace = () => null;

/** 카메라를 열 수 있는 곳인지(앱 안 브라우저 · PC). 3-1 「카메라를 못 여는 곳」 · 0-4 앱 안 브라우저 안내가 쓴다 */
export function useCameraPlace(): CameraPlace | null {
  return useSyncExternalStore(subscribe, getPlace, getServerPlace);
}
