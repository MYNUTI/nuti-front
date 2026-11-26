import { afterEach, describe, expect, it, vi } from "vitest";

import { isRequestedHere } from "@/components/scan/requested-gtins";
import type { Gtin } from "@/lib/scan/types";
import { stubLocalStorage } from "@/test/browser";

import {
  clearLabelPhoto,
  getLabelDraft,
  getLabelPhoto,
  type LabelDraft,
  sendLabelPhoto,
  setLabelDraft,
  setLabelPhoto,
} from "./label-photo";

afterEach(() => {
  clearLabelPhoto();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("영양성분표 사진 메모리", () => {
  it("다시 찍으면 이전 주소를 풀고 새 사진으로 바꾼다", () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    const first = setLabelPhoto(new Blob(["a"]));
    const second = setLabelPhoto(new Blob(["b"]));
    expect(revoke).toHaveBeenCalledWith(first.url);
    expect(getLabelPhoto()).toBe(second);
  });

  it("지우면 주소를 풀고 사진이 없다", () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    const photo = setLabelPhoto(new Blob(["a"]));
    clearLabelPhoto();
    expect(revoke).toHaveBeenCalledWith(photo.url);
    expect(getLabelPhoto()).toBeNull();
  });

  it("보내면 사진을 지우고, 바코드가 있을 때만 요청한 바코드로 남긴다", () => {
    const store = stubLocalStorage();
    const gtin = "08801000000036" as Gtin;
    setLabelPhoto(new Blob(["a"]));
    sendLabelPhoto(gtin);
    expect(getLabelPhoto()).toBeNull();
    expect(isRequestedHere(gtin)).toBe(true);

    store.clear();
    setLabelPhoto(new Blob(["b"]));
    sendLabelPhoto(null);
    expect(getLabelPhoto()).toBeNull();
    expect(store.size).toBe(0);
  });
});

describe("3-8에서 적은 값", () => {
  const draft = { name: "웨하스" } as LabelDraft;

  it("사진을 지우거나 새로 찍으면 함께 지운다", () => {
    setLabelPhoto(new Blob(["a"]));
    setLabelDraft(draft);
    expect(getLabelDraft()).toBe(draft);
    setLabelPhoto(new Blob(["b"]));
    expect(getLabelDraft()).toBeNull();

    setLabelDraft(draft);
    clearLabelPhoto();
    expect(getLabelDraft()).toBeNull();
  });
});
