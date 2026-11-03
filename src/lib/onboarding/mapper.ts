import type {
  Bootstrap,
  BootstrapDto,
  HealthConsent,
  HealthConsentDto,
  SampleProduct,
  SamplePickerDto,
} from "@/lib/onboarding/types";

export function toBootstrap(dto: BootstrapDto): Bootstrap {
  return { ...dto, currentPolicyVersion: dto.currentPolicyVersion ?? null };
}

export function toHealthConsent(dto: HealthConsentDto): HealthConsent {
  return {
    healthConsented: dto.healthConsented,
    agreedAt: dto.agreedAt ?? null,
  };
}

export function toSampleProducts(dto: SamplePickerDto): SampleProduct[] {
  return dto.items.map((item) => ({
    id: String(item.productId),
    name: item.name,
    imageUrl: item.imageUrl,
    grade: item.grade,
  }));
}
