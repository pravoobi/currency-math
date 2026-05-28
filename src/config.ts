import { RoundingMode } from './rounding'

export interface CurrencyMathConfig {
  rounding: RoundingMode
  defaultLocale: string
}

const config: CurrencyMathConfig = {
  rounding: RoundingMode.HALF_EVEN,
  defaultLocale: new Intl.DateTimeFormat().resolvedOptions().locale,
}

export function setConfig(partial: Partial<CurrencyMathConfig>): void {
  Object.assign(config, partial)
}

export function getConfig(): Readonly<CurrencyMathConfig> {
  return config
}
