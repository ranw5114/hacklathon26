// Turns a math expression like "x^2 - 6x + 5" or "2sin(x) + 1" into a function of x,
// so the Coop can draw graphs to scale. It never uses eval(): it only understands
// numbers, x, + − × ÷ ^, parentheses, and a few math functions.

const FUNCTIONS = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  exp: Math.exp,
};
const CONSTANTS = { pi: Math.PI, π: Math.PI, e: Math.E };

// Returns a function (x) => y, or throws an Error if the expression can't be understood.
export function compileExpression(source) {
  const tokens = tokenize(normalize(source));
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  const expect = (value) => {
    if (next()?.value !== value) throw new Error(`Expected "${value}" in ${source}`);
  };

  // Grammar, from loosest to tightest: + −, then × ÷, then unary minus, then ^, then numbers/x/( ).
  function sum() {
    let left = product();
    while (peek()?.value === "+" || peek()?.value === "-") {
      const op = next().value;
      const right = product();
      const l = left;
      left = op === "+" ? (x) => l(x) + right(x) : (x) => l(x) - right(x);
    }
    return left;
  }
  function product() {
    let left = unary();
    while (peek()?.value === "*" || peek()?.value === "/") {
      const op = next().value;
      const right = unary();
      const l = left;
      left = op === "*" ? (x) => l(x) * right(x) : (x) => l(x) / right(x);
    }
    return left;
  }
  function unary() {
    if (peek()?.value === "-") {
      next();
      const inner = unary();
      return (x) => -inner(x);
    }
    if (peek()?.value === "+") next();
    return power();
  }
  function power() {
    const base = primary();
    if (peek()?.value !== "^") return base;
    next();
    const exponent = unary(); // so 2^-x works, and x^2^3 means x^(2^3)
    return (x) => base(x) ** exponent(x);
  }
  function primary() {
    const token = next();
    if (!token) throw new Error(`Unexpected end of ${source}`);
    if (token.type === "number") return () => token.value;
    if (token.type === "x") return (x) => x;
    if (token.type === "constant") return () => CONSTANTS[token.value];
    if (token.type === "function") {
      expect("(");
      const inner = sum();
      expect(")");
      const fn = FUNCTIONS[token.value];
      return (x) => fn(inner(x));
    }
    if (token.value === "(") {
      const inner = sum();
      expect(")");
      return inner;
    }
    throw new Error(`Didn't understand "${token.value}" in ${source}`);
  }

  const result = sum();
  if (pos < tokens.length) throw new Error(`Didn't understand "${tokens[pos].value}" in ${source}`);
  return result;
}

// Accept the way people (and the AI) usually write math: x², −, ×, "y = …".
function normalize(source) {
  return String(source)
    .replace(/^\s*(y|f\s*\(\s*x\s*\))\s*=/i, "")
    .replaceAll("²", "^2")
    .replaceAll("³", "^3")
    .replace(/[−–]/g, "-")
    .replace(/[×·]/g, "*")
    .replaceAll("÷", "/")
    .replaceAll("√", "sqrt")
    .replaceAll("**", "^")
    .toLowerCase();
}

function tokenize(text) {
  const tokens = [];
  const pattern = /\s*(?:(\d+\.?\d*|\.\d+)|([a-zπ]+)|(.))/gy;
  let match;
  while (pattern.lastIndex < text.length && (match = pattern.exec(text))) {
    const [, number, word, symbol] = match;
    if (number) tokens.push({ type: "number", value: parseFloat(number) });
    else if (word) tokens.push(...splitWord(word));
    else if (symbol && symbol.trim()) tokens.push({ type: "symbol", value: symbol });
  }
  return addImplicitMultiplication(tokens);
}

// "xsin" or "pix" arrive as one word: split it into x, constants and function names.
function splitWord(word) {
  const tokens = [];
  let rest = word;
  while (rest) {
    const fn = Object.keys(FUNCTIONS).find((name) => rest.startsWith(name));
    const constant = Object.keys(CONSTANTS).find((name) => rest.startsWith(name));
    if (fn) {
      tokens.push({ type: "function", value: fn });
      rest = rest.slice(fn.length);
    } else if (constant) {
      tokens.push({ type: "constant", value: constant });
      rest = rest.slice(constant.length);
    } else if (rest[0] === "x") {
      tokens.push({ type: "x", value: "x" });
      rest = rest.slice(1);
    } else {
      throw new Error(`Unknown name "${rest}"`);
    }
  }
  return tokens;
}

// "2x", "3(x+1)", "(x+1)(x-1)" and "2sin(x)" all mean multiplication.
function addImplicitMultiplication(tokens) {
  const result = [];
  for (const token of tokens) {
    const prev = result.at(-1);
    const prevEndsValue = prev && (["number", "x", "constant"].includes(prev.type) || prev.value === ")");
    const startsValue = ["number", "x", "constant", "function"].includes(token.type) || token.value === "(";
    if (prevEndsValue && startsValue) result.push({ type: "symbol", value: "*" });
    result.push(token);
  }
  return result;
}
