const WORDS: string[] = [
  // Animals
  'cat', 'dog', 'fish', 'bird', 'lion', 'tiger', 'bear', 'wolf', 'fox', 'deer',
  'horse', 'cow', 'pig', 'sheep', 'goat', 'duck', 'frog', 'snake', 'rabbit', 'mouse',
  'elephant', 'giraffe', 'zebra', 'monkey', 'penguin', 'dolphin', 'whale', 'shark', 'octopus', 'crab',
  'butterfly', 'bee', 'ant', 'spider', 'eagle', 'owl', 'parrot', 'flamingo', 'crocodile', 'turtle',
  // Food
  'pizza', 'burger', 'cake', 'bread', 'apple', 'banana', 'cherry', 'lemon', 'mango', 'grape',
  'cookie', 'donut', 'icecream', 'candy', 'chocolate', 'hotdog', 'taco', 'sushi', 'pasta', 'soup',
  'sandwich', 'popcorn', 'pretzel', 'waffle', 'pancake', 'salad', 'steak', 'lobster', 'shrimp', 'egg',
  'carrot', 'broccoli', 'corn', 'potato', 'tomato', 'strawberry', 'watermelon', 'pineapple', 'coconut', 'avocado',
  // Objects
  'chair', 'table', 'lamp', 'clock', 'phone', 'book', 'pen', 'key', 'bag', 'hat',
  'shoe', 'sock', 'glove', 'ring', 'crown', 'sword', 'shield', 'bow', 'arrow', 'map',
  'camera', 'guitar', 'piano', 'drum', 'trumpet', 'violin', 'brush', 'paint', 'pencil', 'eraser',
  'scissors', 'stapler', 'ruler', 'compass', 'thermometer', 'umbrella', 'balloon', 'kite', 'magnet', 'battery',
  // Places
  'house', 'castle', 'tower', 'bridge', 'beach', 'mountain', 'forest', 'cave', 'island', 'lake',
  'river', 'ocean', 'desert', 'jungle', 'volcano', 'school', 'hospital', 'library', 'museum', 'farm',
  'rocket', 'airplane', 'train', 'bus', 'boat', 'submarine', 'spaceship', 'helicopter', 'car', 'bicycle',
  // Actions / concepts
  'swim', 'jump', 'run', 'sleep', 'dance', 'sing', 'cook', 'fly', 'read', 'write',
  'laugh', 'cry', 'yawn', 'sneeze', 'wave', 'hug', 'fight', 'climb', 'dive', 'spin',
  // Pop culture & fun
  'zombie', 'vampire', 'witch', 'wizard', 'dragon', 'fairy', 'ghost', 'robot', 'alien', 'ninja',
  'pirate', 'cowboy', 'astronaut', 'superhero', 'princess', 'knight', 'mummy', 'tornado', 'rainbow', 'thunder',
  'snowman', 'snowflake', 'fire', 'ice', 'star', 'moon', 'sun', 'cloud', 'lightning', 'storm',
  // Bonus harder words
  'skateboard', 'firework', 'telescope', 'microscope', 'parachute', 'trampoline', 'boomerang', 'hammock',
  'hourglass', 'chandelier', 'avalanche', 'quicksand', 'shipwreck', 'lighthouse', 'catapult',
];

const used = new Set<string>();

export function pickWords(count: number): string[] {
  const available = WORDS.filter(w => !used.has(w));
  if (available.length < count) {
    used.clear();
  }
  const pool = available.length >= count ? available : WORDS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, count);
  picked.forEach(w => used.add(w));
  return picked;
}

export function resetUsed(): void {
  used.clear();
}
