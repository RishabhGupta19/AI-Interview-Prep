export const fakeEmbed = (text) => {
// Simple deterministic numeric vector from char codes (toy only)
const sum = Array.from(text).reduce((s, ch) => s + ch.charCodeAt(0), 0);
return [sum % 1000];
};


export const cosineSim = (a, b) => {
// a and b are arrays of numbers
const dot = a.reduce((s, v, i) => s + v * (b[i] || 0), 0);
const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
if (!magA || !magB) return 0;
return dot / (magA * magB);
};