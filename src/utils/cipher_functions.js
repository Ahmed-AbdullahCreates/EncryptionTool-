import * as math from 'mathjs';

// Caesar Cipher
export function caesarEncrypt(text, shift) {
    let ciphertext = "";
    
    for (let char of text) {
        if (/[a-zA-Z]/.test(char)) {
            const base = char === char.toUpperCase() ? 'A'.charCodeAt(0) : 'a'.charCodeAt(0);
            ciphertext += String.fromCharCode((char.charCodeAt(0) - base + shift) % 26 + base);
        } else {
            ciphertext += char;
        }
    }
    return ciphertext;
}

export function caesarDecrypt(text, shift) {
    let plaintext = "";
    
    for (let char of text)
     {
        if (/[a-zA-Z]/.test(char)) {
            const base = char === char.toUpperCase() ? 'A'.charCodeAt(0) : 'a'.charCodeAt(0);
            plaintext += String.fromCharCode((char.charCodeAt(0) - base - shift + 26) % 26 + base);
        } else {
            plaintext += char;
        }
    }
    
    return plaintext;
}


// New helper functions to add
function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}

function invmod(a, m) {
    for(let x = 1; x < m; x++) {
        if(((a % m) * (x % m)) % m === 1) {
            return x;
        }
    }
    return 1;
}

// Hill Cipher
export function hillEncrypt(text, matrixStr) {
    text = text.replace(/\s/g, '').toUpperCase();
    const EAM = {};
    const EAM_rev = {};
    for (let i = 0; i < 26; i++) {
        EAM[String.fromCharCode(65 + i)] = i;
        EAM_rev[i] = String.fromCharCode(65 + i);
    }

    try {
        const matrix = matrixStr.split(',').map(Number);
        if (matrix.length !== 4) {
            throw new Error("Matrix must contain exactly 4 numbers.");
        }
        const matrixArray = math.reshape(matrix, [2, 2]);
        let det = Math.round(math.det(matrixArray)) % 26;
        if (det < 0) det += 26;
        if (det === 0 || gcd(det, 26) !== 1) {
            throw new Error("Matrix is not invertible modulo 26.");
        }

        if (text.length % 2 !== 0) {
            text += 'X';
        }

        const PT_numbers = text.split('').map(char => EAM[char]);
        const PT_blocks = [];
        for (let i = 0; i < PT_numbers.length; i += 2) {
            PT_blocks.push([PT_numbers[i], PT_numbers[i + 1]]);
        }

        const CT_blocks = PT_blocks.map(block => math.mod(math.multiply(block, matrixArray), 26));
        const CT_array = [].concat(...CT_blocks);
        return CT_array.map(num => EAM_rev[num]).join('');

    } catch (e) {
        throw new Error(`Invalid matrix format: ${e.message}`);
    }
}

export function hillDecrypt(text, matrixStr) {
    text = text.replace(/\s/g, '').toUpperCase();
    const EAM = {};
    const EAM_rev = {};
    for (let i = 0; i < 26; i++) {
        EAM[String.fromCharCode(65 + i)] = i;
        EAM_rev[i] = String.fromCharCode(65 + i);
    }

    try {
        const matrix = matrixStr.split(',').map(Number);
        if (matrix.length !== 4) {
            throw new Error("Matrix must contain exactly 4 numbers.");
        }
        const matrixArray = math.reshape(matrix, [2, 2]);
        let det = Math.round(math.det(matrixArray)) % 26;
        if (det < 0) det += 26;
        if (det === 0 || gcd(det, 26) !== 1) {
            throw new Error("Matrix is not invertible modulo 26.");
        }

        // Calculate modular multiplicative inverse of determinant
        const det_inv = invmod(det, 26);

        // Calculate adjugate matrix using direct array access
        const adj = [
            [matrixArray[1][1], -matrixArray[0][1]],
            [-matrixArray[1][0], matrixArray[0][0]]
        ].map(row => row.map(val => ((val % 26) + 26) % 26));

        // Calculate inverse matrix modulo 26
        const inv_matrix = adj.map(row => 
            row.map(val => ((val * det_inv) % 26 + 26) % 26)
        );

        if (text.length % 2 !== 0) {
            text += 'X';
        }

        const CT_numbers = text.split('').map(char => EAM[char]);
        const CT_blocks = [];
        for (let i = 0; i < CT_numbers.length; i += 2) {
            CT_blocks.push([CT_numbers[i], CT_numbers[i + 1]]);
        }

        // Multiply blocks with inverse matrix and take modulo 26
        const PT_blocks = CT_blocks.map(block => {
            const result = [0, 0];
            for (let i = 0; i < 2; i++) {
                result[i] = ((inv_matrix[i][0] * block[0] + inv_matrix[i][1] * block[1]) % 26 + 26) % 26;
            }
            return result;
        });

        const PT_array = [].concat(...PT_blocks);
        return PT_array.map(num => EAM_rev[num]).join('');

    } catch (e) {
        throw new Error(`Decryption failed: ${e.message}`);
    }
}

// Monoalphabetic Cipher
function completeKey(key) {
    key = key.toUpperCase();
    const usedLetters = new Set();
    const uniqueKey = [...key].filter(ch => !usedLetters.has(ch) && usedLetters.add(ch)).join('');
    const remainingLetters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter(ch => !usedLetters.has(ch));
    return uniqueKey + remainingLetters.join('');
}

function validateAndCompleteKey(key) {
    if (!/^[A-Z]+$/i.test(key)) throw new Error("Key must contain only alphabetic characters.");
    if (key.length > 26) throw new Error("Key must not exceed 26 characters.");
    return completeKey(key);
}

export function monoEncrypt(text, key) {
    const substitutionTableStr = validateAndCompleteKey(key);
    const substitutionTable = {};
    for (let i = 0; i < 26; i++) {
        substitutionTable[String.fromCharCode(65 + i)] = substitutionTableStr[i];
    }
    return text.toUpperCase().split('').map(ch => substitutionTable[ch] || ch).join('');
}

export function monoDecrypt(text, key) {
    const substitutionTableStr = validateAndCompleteKey(key);
    const substitutionTable = {};
    for (let i = 0; i < 26; i++) {
        substitutionTable[substitutionTableStr[i]] = String.fromCharCode(65 + i);
    }
    return text.toUpperCase().split('').map(ch => substitutionTable[ch] || ch).join('');
}

// Polyalphabetic (Vigenère) Cipher
// function validateInputs(text, keyword) {
    
//     //if (typeof keyword !== 'string') throw new Error("Keyword must be a string.");
//     if (!/^[A-Z]+$/i.test(keyword)) throw new Error("Keyword must contain only alphabetic characters.");
//     if (!text.trim()) throw new Error("Text must not be empty.");
//     if (!keyword.trim()) throw new Error("Keyword must not be empty.");
// }

// function preprocessKeyword(keyword) {
//     return keyword.trim().toUpperCase();//
// }

// function precomputeShifts(keyword) {
//     return [...keyword].map(char => char.charCodeAt(0) - 65);
// }

export function polyEncrypt(text, keyword) {
    if (typeof text !== 'string') throw new Error("Text must be a string.");
    if (!text || !keyword) throw new Error("Text and keyword must not be empty");
    if (!/^[A-Za-z]+$/.test(keyword)) {
        throw new Error("Keyword must contain only alphabetic characters");
    
    }

    keyword = keyword.toUpperCase();
    const shifts = [...keyword].map(char => char.charCodeAt(0) - 65);

    return text.split('').map((char, i) => {
        if (char.match(/[a-z]/i)) {
            const shift = shifts[i % shifts.length];
            return caesarEncrypt(char, shift);
        }
        return char;
    }).join('');
}

export function polyDecrypt(text, keyword) {
    if (!text || !keyword) throw new Error("Text and keyword must not be empty");
    if (!/^[A-Za-z]+$/.test(keyword)) {
        throw new Error("Keyword must contain only alphabetic characters");
    }

    keyword = keyword.toUpperCase();
    const shifts = [...keyword].map(char => char.charCodeAt(0) - 65);

    return text.split('').map((char, i) => {
        if (char.match(/[a-z]/i)) {
            const shift = shifts[i % shifts.length];
            return caesarDecrypt(char, shift);
        }
        return char;
    }).join('');
}

// Playfair Cipher
function validateKeyPF(key) {
    key = key.toUpperCase().replace(/J/g, 'I');
    key = key.replace(/[^A-Z]/g, '');
    return new Set(key).size === key.length && key.length <= 25;
}

function createMatrix(key) {
    key = key.toUpperCase().replace(/J/g, 'I');
    const matrix = [];
    const seen = new Set();
    for (const char of key) {
        if (!seen.has(char)) {
            seen.add(char);
            matrix.push(char);
        }
    }
    for (const char of 'ABCDEFGHIKLMNOPQRSTUVWXYZ') {
        if (!seen.has(char)) {
            seen.add(char);
            matrix.push(char);
        }
    }
    return Array.from({ length: 5 }, (_, i) => matrix.slice(i * 5, i * 5 + 5));
}

function findPosition(matrix, char) {
    for (let i = 0; i < 5; i++) {
        const row = matrix[i];
        const col = row.indexOf(char);
        if (col !== -1) return [i, col];
    }
    return null;
}

function prepareText(text) {
    text = text.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
    const pairs = [];
    for (let i = 0; i < text.length; i += 2) {
        if (i + 1 < text.length && text[i] !== text[i + 1]) {
            pairs.push(text[i] + text[i + 1]);
        } else {
            pairs.push(text[i] + 'X');
        }
    }
    return pairs;
}

export function playfairEncrypt(text, key) {
    if (!validateKeyPF(key)) throw new Error("Invalid key: must have up to 25 unique alphabetic characters (J treated as I).");
    const matrix = createMatrix(key);
    const pairs = prepareText(text);
    return pairs.map(pair => {
        const [row1, col1] = findPosition(matrix, pair[0]);
        const [row2, col2] = findPosition(matrix, pair[1]);
        if (row1 === row2) {
            return matrix[row1][(col1 + 1) % 5] + matrix[row2][(col2 + 1) % 5];
        } else if (col1 === col2) {
            return matrix[(row1 + 1) % 5][col1] + matrix[(row2 + 1) % 5][col2];
        } else {
            return matrix[row1][col2] + matrix[row2][col1];
        }
    }).join('');
}

export function playfairDecrypt(text, key) {
    if (!validateKeyPF(key)) throw new Error("Invalid key: must have up to 25 unique alphabetic characters (J treated as I).");
    const matrix = createMatrix(key);
    const pairs = prepareText(text);
    return pairs.map(pair => {
        const [row1, col1] = findPosition(matrix, pair[0]);
        const [row2, col2] = findPosition(matrix, pair[1]);
        if (row1 === row2) {
            return matrix[row1][(col1 - 1 + 5) % 5] + matrix[row2][(col2 - 1 + 5) % 5];
        } else if (col1 === col2) {
            return matrix[(row1 - 1 + 5) % 5][col1] + matrix[(row2 - 1 + 5) % 5][col2];
        } else {
            return matrix[row1][col2] + matrix[row2][col1];
        }
    }).join('');
}

// One-Time Pad Cipher
function isAlphabeticKey(key) {
    return /^[a-zA-Z]+$/.test(key);
}

export function otpEncrypt(plaintext, key) {
    if (plaintext.length !== key.length) {
        throw new Error("Plaintext and key must be of the same length.");
    }

    let ciphertext = "";

    if (isAlphabeticKey(key)) {
        // Modular addition encryption
        for (let i = 0; i < plaintext.length; i++) {
            if (/[a-zA-Z]/.test(plaintext[i])) {
                const base = plaintext[i] === plaintext[i].toUpperCase() ? 'A'.charCodeAt(0) : 'a'.charCodeAt(0);
                const keyBase = key[i] === key[i].toUpperCase() ? 'A'.charCodeAt(0) : 'a'.charCodeAt(0);
                ciphertext += String.fromCharCode((plaintext[i].charCodeAt(0) - base + (key[i].charCodeAt(0) - keyBase)) % 26 + base);
            } else {
                ciphertext += plaintext[i];
            }
        }
    } else {
        // XOR encryption
        for (let i = 0; i < plaintext.length; i++) {
            ciphertext += String.fromCharCode(plaintext[i].charCodeAt(0) ^ key[i].charCodeAt(0));
        }
    }

    return ciphertext;
}

export function otpDecrypt(ciphertext, key) {
    if (ciphertext.length !== key.length) {
        throw new Error("Ciphertext and key must be of the same length.");
    }

    let plaintext = "";

    if (isAlphabeticKey(key)) {
        // Modular subtraction decryption
        for (let i = 0; i < ciphertext.length; i++) {
            if (/[a-zA-Z]/.test(ciphertext[i])) {
                const base = ciphertext[i] === ciphertext[i].toUpperCase() ? 'A'.charCodeAt(0) : 'a'.charCodeAt(0);
                const keyBase = key[i] === key[i].toUpperCase() ? 'A'.charCodeAt(0) : 'a'.charCodeAt(0);
                plaintext += String.fromCharCode((ciphertext[i].charCodeAt(0) - base - (key[i].charCodeAt(0) - keyBase) + 26) % 26 + base);
            } else {
                plaintext += ciphertext[i];
            }
        }
    } else {
        // XOR decryption (same as XOR encryption)
        for (let i = 0; i < ciphertext.length; i++) {
            plaintext += String.fromCharCode(ciphertext[i].charCodeAt(0) ^ key[i].charCodeAt(0));
        }
    }

    return plaintext;
}
// Rail Fence Cipher
export function railFenceEncrypt(text, rails) {
    text = text.trim();
    if (!text) throw new Error("Text input cannot be empty or just whitespace.");
    if (typeof rails !== 'number' || rails < 2) throw new Error("Number of rails must be at least 2.");

    const fence = Array.from({ length: rails }, () => []);
    let rail = 0;
    let direction = 1;

    for (const char of text) {
        fence[rail].push(char);
        rail += direction;
        if (rail === rails - 1 || rail === 0) direction = -direction;
    }

    return fence.flat().join('');
}

export function railFenceDecrypt(text, rails) {
    text = text.trim();
    if (!text) throw new Error("Text input cannot be empty or just whitespace.");
    if (typeof rails !== 'number' || rails < 2) throw new Error("Number of rails must be at least 2.");

    const fence = Array.from({ length: rails }, () => Array(text.length).fill(''));
    let rail = 0;
    let direction = 1;

    for (let i = 0; i < text.length; i++) {
        fence[rail][i] = '*';
        rail += direction;
        if (rail === rails - 1 || rail === 0) direction = -direction;
    }

    let index = 0;
    for (let i = 0; i < rails; i++) {
        for (let j = 0; j < text.length; j++) {
            if (fence[i][j] === '*') fence[i][j] = text[index++];
        }
    }

    let result = '';
    rail = 0;
    direction = 1;
    for (let i = 0; i < text.length; i++) {
        result += fence[rail][i];
        rail += direction;
        if (rail === rails - 1 || rail === 0) direction = -direction;
    }

    return result;
}

// Row-Column Transposition Cipher
function validateRowColInput(text, key) {
    if (!/^[A-Z]+$/i.test(key) || key.length === 0) throw new Error("Key must be a non-empty alphabetic string.");
    return true;
}

export function rowColEncrypt(text, key) {
    if (!validateRowColInput(text, key)) return '';

    key = key.toUpperCase();
    const cols = key.length;
    const rows = Math.ceil(text.length / cols);
    text = text.padEnd(rows * cols, 'X');

    const grid = Array.from({ length: rows }, (_, i) => text.slice(i * cols, i * cols + cols).split(''));
    const order = [...key].map((char, i) => [i, char]).sort((a, b) => a[1].localeCompare(b[1])).map(([i]) => i);

    return order.map(col => grid.map(row => row[col]).join('')).join('');
}

export function rowColDecrypt(text, key) {
    if (!validateRowColInput(text, key)) return '';

    key = key.toUpperCase();
    const cols = key.length;
    const rows = text.length / cols;

    const order = [...key].map((char, i) => [i, char]).sort((a, b) => a[1].localeCompare(b[1])).map(([i]) => i);
    const grid = Array.from({ length: rows }, () => Array(cols).fill(''));

    let pos = 0;
    for (const col of order) {
        for (let row = 0; row < rows; row++) {
            grid[row][col] = text[pos++];
        }
    }

    return grid.map(row => row.join('')).join('');
}
