import { expect, test } from 'vitest'
import { orderReducer, subtotal, total, type Product } from './order'

const coffee: Product = { id: 'coffee', name: 'Coffee', price: 25, icon: '☕' }

test('adding a product creates an order line with quantity one', () => {
  expect(orderReducer([], { type: 'add', product: coffee })).toEqual([
    { product: coffee, quantity: 1 },
  ])
})

test('reset clears every product in the order', () => {
  expect(orderReducer([{ product: coffee, quantity: 3 }], { type: 'reset' })).toEqual([])
})

test('total adds subtotals across multiple products', () => {
  const water: Product = { id: 'water', name: 'Water', price: 15, icon: '💧' }
  expect(total([
    { product: coffee, quantity: 3 },
    { product: water, quantity: 2 },
  ])).toBe(105)
})

test('subtotal multiplies a product price by its quantity', () => {
  expect(subtotal({ product: coffee, quantity: 3 })).toBe(75)
})

test('increment stops at quantity 99', () => {
  expect(orderReducer([{ product: coffee, quantity: 99 }], { type: 'increment', productId: coffee.id })).toEqual([
    { product: coffee, quantity: 99 },
  ])
})

test('adding the same product stops at quantity 99', () => {
  expect(orderReducer([{ product: coffee, quantity: 99 }], { type: 'add', product: coffee })).toEqual([
    { product: coffee, quantity: 99 },
  ])
})

test('remove deletes the selected product', () => {
  const water: Product = { id: 'water', name: 'Water', price: 15, icon: '💧' }
  expect(orderReducer([
    { product: coffee, quantity: 1 },
    { product: water, quantity: 2 },
  ], { type: 'remove', productId: coffee.id })).toEqual([{ product: water, quantity: 2 }])
})

test('decrement at one keeps the product in the order', () => {
  expect(orderReducer([{ product: coffee, quantity: 1 }], { type: 'decrement', productId: coffee.id })).toEqual([
    { product: coffee, quantity: 1 },
  ])
})

test('decrement reduces the selected product quantity', () => {
  expect(orderReducer([{ product: coffee, quantity: 3 }], { type: 'decrement', productId: coffee.id })).toEqual([
    { product: coffee, quantity: 2 },
  ])
})

test('increment increases the selected product quantity', () => {
  expect(orderReducer([{ product: coffee, quantity: 2 }], { type: 'increment', productId: coffee.id })).toEqual([
    { product: coffee, quantity: 3 },
  ])
})

test('adding an existing product increases its quantity without a duplicate line', () => {
  expect(orderReducer([{ product: coffee, quantity: 1 }], { type: 'add', product: coffee })).toEqual([
    { product: coffee, quantity: 2 },
  ])
})
