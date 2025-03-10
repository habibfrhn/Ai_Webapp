/**
 * Converts a monetary amount from one currency to another using the Frankfurter API.
 * @param from - The original 3-letter currency code.
 * @param to - The target 3-letter currency code.
 * @param amount - The amount to convert.
 * @returns The converted amount as a number.
 */
export async function convertCurrency(from: string, to: string, amount: number): Promise<number> {
    const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`);
    const data = await response.json();
    const rate = data.rates[to];
    return amount * rate;
  }
  