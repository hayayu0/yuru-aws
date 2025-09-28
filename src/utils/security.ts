export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>'"&]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        case '&': return '&amp;';
        default: return char;
      }
    })
    .replace(/\b(you|assistant|system)\s+(must|are required to|ignore|disregard|override|forget)\b/gi, '')
    .replace(/\b(never|禁止|無視|命令|絶対に|上書き)\b/g, '')
    .slice(0, 300);
};

export const validateJsonString = (jsonString: string): boolean => {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
};