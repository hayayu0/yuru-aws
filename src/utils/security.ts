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