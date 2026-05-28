import {
  money,
  add,
  subtract,
  multiply,
  divide,
  format,
  eq,
  isPositive,
  RoundingMode,
} from '../src/index'

// The classic float problem — solved
console.log(0.1 + 0.2) // 0.30000000000000004 ← JS float trap

const a = money(0.1, 'USD')
const b = money(0.2, 'USD')
const c = add(a, b)
console.log(format(c, 'en-US')) // $0.30 ← exact

// Basic arithmetic
const price = money(19.99, 'USD')
const qty3 = multiply(price, 3)
console.log(format(qty3, 'en-US')) // $59.97

const tax = multiply(price, 0.08)
console.log(format(tax, 'en-US')) // $1.60

const total = add(qty3, tax)
console.log(format(total, 'en-US')) // $61.57

// Subtraction
const change = subtract(money(100, 'USD'), total)
console.log(format(change, 'en-US')) // $38.43
console.log(isPositive(change)) // true

// Division with banker's rounding (default)
const third = divide(money(10, 'USD'), 3)
console.log(format(third, 'en-US')) // $3.33

// Division with HALF_UP
const thirdUp = divide(money(10, 'USD'), 3, { rounding: RoundingMode.HALF_UP })
console.log(format(thirdUp, 'en-US')) // $3.33

// Equality
console.log(eq(money(1, 'USD'), money(1.00, 'USD'))) // true
