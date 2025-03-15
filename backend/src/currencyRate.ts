/**
 * Converts a monetary amount from one currency to another using the Frankfurter API.
 * @param from - The original 3-letter currency code.
 * @param to - The target 3-letter currency code.
 * @param amount - The amount to convert.
 * @returns The converted amount as a number.
 */
export async function convertCurrency(from: string, to: string, amount: number): Promise<number> {
  // Updated API endpoint and parameters.
  const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
  
  if (!response.ok) {
    throw new Error(`Currency conversion API responded with status ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.rates || data.rates[to] === undefined) {
    throw new Error(`Conversion rate for ${to} not found in API response`);
  }
  
  const rate = data.rates[to];
  return amount * rate;
}
