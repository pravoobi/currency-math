import {
  money,
  add,
  multiply,
  allocate,
  format,
  serialize,
  deserialize,
} from '../src/index'

// Invoice: 3 line items, apply 8% tax, split payment 60/40 between two parties

const lineItems = [
  { description: 'Consulting (8h)', amount: money(160, 'USD') },
  { description: 'Design assets', amount: money(75.50, 'USD') },
  { description: 'Hosting (annual)', amount: money(99, 'USD') },
]

const subtotal = lineItems.reduce(
  (acc, item) => add(acc, item.amount),
  money(0, 'USD'),
)

const tax = multiply(subtotal, 0.08)
const total = add(subtotal, tax)

console.log('Subtotal:', format(subtotal, 'en-US')) // $334.50
console.log('Tax (8%):', format(tax, 'en-US'))      // $26.76
console.log('Total:   ', format(total, 'en-US'))    // $361.26

// Penny-perfect split: 60% client A, 40% client B
const [shareA, shareB] = allocate(total, [60, 40])
console.log('\nClient A owes:', format(shareA!, 'en-US')) // $216.76
console.log('Client B owes:', format(shareB!, 'en-US')) // $144.50
// Verify: $216.76 + $144.50 = $361.26 (no penny created or lost)

// Tax distribution across 3 cost centres by headcount ratio [5, 3, 2]
const [cc1, cc2, cc3] = allocate(tax, [5, 3, 2])
console.log('\nCost centre tax allocation:')
console.log(' CC1 (5/10):', format(cc1!, 'en-US'))
console.log(' CC2 (3/10):', format(cc2!, 'en-US'))
console.log(' CC3 (2/10):', format(cc3!, 'en-US'))

// Serialise total for storage in a JSON API response
const stored = serialize(total)
console.log('\nStored in DB:', JSON.stringify(stored)) // {"amount":"36126","currency":"USD"}

// Deserialise back
const restored = deserialize(stored)
console.log('Restored:', format(restored, 'en-US')) // $361.26
