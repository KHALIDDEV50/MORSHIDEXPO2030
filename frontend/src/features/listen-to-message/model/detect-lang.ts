/**
 * Speak a response in its own language: Arabic script → ar-SA, otherwise en-US.
 * Mixed text follows the majority script.
 */
export function detectSpeechLang(text: string): 'ar-SA' | 'en-US' {
  const arabic = (text.match(/[؀-ۿ]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  return arabic >= latin && arabic > 0 ? 'ar-SA' : 'en-US';
}
