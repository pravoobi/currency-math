import { Money, money } from './money'

export interface SerializedMoney {
  amount: string
  currency: string
}

export function serialize(m: Money): SerializedMoney {
  return { amount: m.amount.toString(), currency: m.currency }
}

export function deserialize(data: SerializedMoney): Money {
  return money(BigInt(data.amount), data.currency)
}

export function toStorageInt(m: Money): bigint {
  return m.amount
}

export function toStorageString(m: Money): string {
  return m.amount.toString()
}

export function fromStorageInt(amount: bigint, currency: string): Money {
  return money(amount, currency)
}

export function fromStorageString(amount: string, currency: string): Money {
  return money(BigInt(amount), currency)
}
