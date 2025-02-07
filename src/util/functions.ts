export function priceToCents(price: number): number {
    return price *= 100
}

export function priceToDisplay(price: number): number {
    return price /= 100
}