import { BarcodeDetector } from "barcode-detector/ponyfill";
import { type BarcodeFormat, prepareWasm } from "react-zxing";
// next.config.ts의 turbopack rule이 .wasm을 asset으로 처리해 URL을 돌려준다.
// import attribute(`with { turbopackModuleType: "asset" }`)만으로는 빌드가 실패했다.
import wasmUrl from "zxing-wasm/reader/zxing_reader.wasm";

/**
 * 상품 바코드에만 좁힌다. 미지정 시 QR·DataMatrix까지 시도해 프레임당 처리 시간이
 * 늘어나는데, 디코딩이 메인 스레드에서 돌기 때문에 이건 성능 결정이다.
 *
 * UPC-E는 제외한다 — 압축 표현이라 UPC-A 확장 알고리즘이 따로 필요하고, 국내 상품은
 * EAN-13(880 프리픽스)이 사실상 전부다.
 */
const SCAN_FORMATS: BarcodeFormat[] = ["ean_13", "ean_8", "upc_a"];

let detectorPromise: Promise<BarcodeDetector> | undefined;

/**
 * WASM을 준비한다. 카메라 경로와 사진 경로 양쪽이 반드시 이 모듈을 거쳐야 한다.
 *
 * `prepareWasm`은 모듈 전역 싱글톤이라 첫 호출의 `wasmUrl`이 굳고, 이후 다른 값으로
 * 부르면 영구 reject된다. 그래서 `wasmUrl`을 export하지 않는다 — 호출자가 URL을 만질
 * 방법이 없어야 불일치가 구조적으로 불가능해진다.
 */
export function ensureWasmReady(): Promise<void> {
  return prepareWasm({ wasmUrl });
}

/**
 * 사진 경로 전용 디코더. 인스턴스를 재사용한다 — 매번 만들면 WASM 초기화 비용이 든다.
 *
 * 실패하면 캐시를 비워 재시도를 허용한다(`prepareWasm`과 같은 방식).
 */
export function getPhotoDetector(): Promise<BarcodeDetector> {
  detectorPromise ??= ensureWasmReady().then(
    () => new BarcodeDetector({ formats: SCAN_FORMATS }),
  );

  const pending = detectorPromise;
  pending.catch(() => {
    if (detectorPromise === pending) detectorPromise = undefined;
  });
  return pending;
}

/**
 * `useZxing`에 그대로 펼쳐 넣는다 — `useZxing({ ...scannerOptions, ... })`.
 *
 * 두 경로가 일치해야 하는 값을 한 객체로 묶어, 빠뜨리는 실수를 구조적으로 막는다.
 * 마운트 후에는 바뀌면 안 되므로(값이 바뀌면 카메라가 재시작된다) 모듈 상수다.
 */
export const scannerOptions: Readonly<{
  wasmUrl: string;
  formats: BarcodeFormat[];
}> = { wasmUrl, formats: SCAN_FORMATS };
