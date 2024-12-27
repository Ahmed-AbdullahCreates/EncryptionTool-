import React, { useState, useCallback } from "react";
import {
  Lock,
  Unlock,
  Copy,
  Settings,
  Sun,
  Moon,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Save,
} from "lucide-react";
import {
  caesarEncrypt,
  caesarDecrypt,
  monoEncrypt,
  monoDecrypt,
  railFenceEncrypt,
  railFenceDecrypt,
  hillEncrypt,
  hillDecrypt,
  polyEncrypt,
  polyDecrypt,
  playfairEncrypt,
  playfairDecrypt,
  otpEncrypt,
  otpDecrypt,
  rowColEncrypt,
  rowColDecrypt,
} from "../utils/cipher_functions";

export default function EncryptionTool() {
  // Defult state
  const [mode, setMode] = useState("encrypt");
  const [algorithm, setAlgorithm] = useState("caesar");
  const [theme, setTheme] = useState("light");
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [key, setKey] = useState("");
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [includeNumbers, setIncludeNumbers] = useState(false);
  const [includeSymbols, setIncludeSymbols] = useState(false);
  const [matrix, setMatrix] = useState([
    ["", ""],
    ["", ""],
  ]);

  const addToHistory = useCallback(
    (input, output) => {
      const newEntry = {
        timestamp: new Date().toLocaleString(),
        algorithm,
        mode,
        input: input.substring(0, 20) + (input.length > 20 ? "..." : ""),
        output: output.substring(0, 20) + (output.length > 20 ? "..." : ""),
      };
      setHistory((prev) => [newEntry, ...prev].slice(0, 20));
    },
    [algorithm, mode]
  );

  const executeOperation = useCallback(() => {
    try {
      setError("");
      if (!inputText) {
        throw new Error("Please enter text to process");
      }

      let result = "";
      switch (algorithm) {
        case "caesar": {
          const shift = parseInt(key) || 0;
          if (shift < 0 || shift > 25) {
            throw new Error("Shift must be between 0 and 25");
          }
          result =
            mode === "encrypt"
              ? caesarEncrypt(inputText, shift)
              : caesarDecrypt(inputText, shift);
          break;
        }
        case "monoalphabetic": {
          if (!key || key.length !== 26 || !/^[A-Z]+$/.test(key)) {
            throw new Error("Key must be 26 uppercase letters");
          }
          result =
            mode === "encrypt"
              ? monoEncrypt(inputText, key)
              : monoDecrypt(inputText, key);
          break;
        }
        case "rail": {
          const rails = parseInt(key) || 2;
          if (rails < 2) {
            throw new Error("Number of rails must be at least 2");
          }
          result =
            mode === "encrypt"
              ? railFenceEncrypt(inputText, rails)
              : railFenceDecrypt(inputText, rails);
          break;
        }
        case "hill": {
          const matrixValues = matrix.flat().map(Number);
          if (matrixValues.some(isNaN) || matrixValues.length !== 4) {
            throw new Error("Matrix must contain exactly 4 numbers");
          }
          result =
            mode === "encrypt"
              ? hillEncrypt(inputText, matrixValues.join(","))
              : hillDecrypt(inputText, matrixValues.join(","));
          break;
        }
        case "polyalphabetic": {
          result =
            mode === "encrypt"
              ? polyEncrypt(inputText, key)
              : polyDecrypt(inputText, key);
          break;
        }
        case "playfair": {
          result =
            mode === "encrypt"
              ? playfairEncrypt(inputText, key)
              : playfairDecrypt(inputText, key);
          break;
        }
        case "otp": {
          if (inputText.length !== key.length) {
            throw new Error("Key length must match text length");
          }
          result =
            mode === "encrypt"
              ? otpEncrypt(inputText, key)
              : otpDecrypt(inputText, key);
          break;
        }
        case "rowColumn": {
          result =
            mode === "encrypt"
              ? rowColEncrypt(inputText, key)
              : rowColDecrypt(inputText, key);
          break;
        }
        default:
          throw new Error("Algorithm not implemented");
      }

      setOutputText(result);
      addToHistory(inputText, result);
    } catch (error) {
      setErrorWithTimeout(error.message);
    }
  }, [algorithm, inputText, key, mode, matrix, addToHistory]);

  // const addToHistory = (input, output) => {
  //   const newEntry = {
  //     timestamp: new Date().toLocaleString(),
  //     algorithm,
  //     mode,
  //     input: input.substring(0, 20) + (input.length > 20 ? '...' : ''),
  //     output: output.substring(0, 20) + (output.length > 20 ? '...' : '')
  //   };
  //   setHistory(prev => [newEntry, ...prev].slice(0, 10));
  // };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setInputText(e.target?.result || "");
    };
    reader.readAsText(file);
  };

  const downloadOutput = () => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${algorithm}-${mode}-output.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateOTPKey = () => {
    if (!inputText) {
      setError("Please enter text before generating a key");
      return;
    }

    let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (includeNumbers) characters += "0123456789";
    if (includeSymbols) characters += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    const keyLength = inputText.length;
    let generatedKey = "";
    for (let i = 0; i < keyLength; i++) {
      generatedKey += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    setKey(generatedKey);
  };

  const exportHistory = () => {
    const historyText = history
      .map(
        (entry) =>
          `${entry.timestamp}\n` +
          `Operation: ${entry.mode} (${entry.algorithm})\n` +
          `Input: ${entry.input}\n` +
          `Output: ${entry.output}\n` +
          "----------------------------------------"
      )
      .join("\n\n");

    const blob = new Blob([historyText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "encryption_history.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const setErrorWithTimeout = (message) => {
    setError(message);
    setTimeout(() => setError(""), 5000); // Clear error after 5 seconds
  };
  const ErrorMessage = ({ message }) => {
    if (!message) return null;

    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-xl z-50">
        <div
          className={`
          relative overflow-hidden
          p-4 rounded-lg shadow-lg
          border border-red-500/20
          bg-white/95 dark:bg-gray-900/95
          backdrop-blur-md
          transform transition-all duration-300 ease-out
          animate-in fade-in slide-in-from-top
        `}
        >
          {/* Gradient accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-400 to-red-500" />

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-red-600 dark:text-red-400 mb-1">
                Error
              </h3>
              <p className="text-gray-700 dark:text-gray-300">{message}</p>
            </div>

            <button
              onClick={() => setError("")}
              className="
                -mr-1 -mt-1 p-1 rounded-md
                text-gray-400 hover:text-gray-600 
                dark:text-gray-500 dark:hover:text-gray-300
                transition-colors duration-200
              "
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };
  // const ErrorMessage = ({ message }) => {
  //   if (!message) return null;
  //   return (
  //     <div
  //       style={{
  //         position: 'fixed',
  //         top: 0,
  //         left: 0,
  //         right: 0,
  //         zIndex: 9999,
  //         margin: '0 auto',
  //         width: '90%',
  //         maxWidth: '600px',
  //         padding: '1rem',
  //         borderRadius: '8px',
  //         backdropFilter: 'blur(6px)',
  //         border: '2px solid',
  //         borderImage: 'linear-gradient(45deg, #f00, #0f0, #00f) 1',
  //         backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
  //         color: theme === 'light' ? '#000' : '#fff',
  //         transition: 'opacity 0.5s ease-in-out',
  //       }}
  //     >
  //       <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Error</strong>
  //       <span>{message}</span>
  //       <button
  //         onClick={() => setError('')}
  //         style={{
  //           float: 'right',
  //           background: 'none',
  //           border: 'none',
  //           color: 'inherit',
  //           fontSize: '1.2rem',
  //           cursor: 'pointer',
  //         }}
  //       >
  //         &times;
  //       </button>
  //     </div>
  //   );
  // };

  // return (
  //   <div className={`min-h-screen p-8 transition-colors duration-300 ${
  //     theme === 'dark'
  //       ? 'bg-gray-900 text-white'
  //       : 'bg-gray-50 text-gray-900'
  //   }`}>
  //     <ErrorMessage message={error} />
  //     <div className={`max-w-4xl mx-auto rounded-xl shadow-xl transform transition-all duration-300 hover:scale-[1.01] ${
  //       theme === 'dark'
  //         ? 'bg-gray-800/95 border border-gray-700 backdrop-blur-sm'
  //         : 'bg-white border border-gray-200'
  //     }`}>

  return (
    <div
      className={`min-h-screen p-8 transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <ErrorMessage message={error} />
      <div
        className={`max-w-4xl mx-auto rounded-xl shadow-xl transform transition-all duration-300 hover:scale-[1.01] ${
          theme === "dark"
            ? "bg-gray-800/95 border border-gray-700 backdrop-blur-sm"
            : "bg-white border border-gray-200"
        }`}
      >
        {/* Enhanced Header */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-25"></div>
                <h1 className="relative text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                  Encryption & Decryption Tool
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-3 py-1 text-xs rounded-full ${
                    theme === "dark"
                      ? "bg-blue-900/30 text-blue-400"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {mode === "encrypt" ? "Encryption Mode" : "Decryption Mode"}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  theme === "dark"
                    ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
              >
                {theme === "light" ? (
                  <div className="flex items-center space-x-2">
                    <Moon className="w-5 h-5" />
                    <span className="text-sm hidden sm:inline">Dark Mode</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Sun className="w-5 h-5" />
                    <span className="text-sm hidden sm:inline">Light Mode</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        <div
          className={`p-6 space-y-6 transition-colors duration-300 ${
            theme === "dark"
              ? "border-t border-gray-700"
              : "border-t border-gray-200"
          }`}
        >
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded animate-shake">
              {error}
            </div>
          )}

          <div className="flex justify-center">
            <div className="relative p-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-xl w-72">
              <div className="absolute inset-1 bg-white dark:bg-gray-800 rounded-lg" />
              <div className="relative flex p-1 space-x-1 rounded-lg bg-gray-100 dark:bg-gray-700">
                <div
                  className={`absolute top-1 bottom-1 w-1/2 transition-transform duration-500 ease-in-out rounded-md 
                    shadow-md backdrop-blur-sm ${
                      mode === "decrypt"
                        ? "translate-x-full bg-gradient-to-r from-purple-500/90 to-purple-600/90"
                        : "bg-gradient-to-r from-blue-500/90 to-blue-600/90"
                    }`}
                  style={{ zIndex: 1 }}
                />
                <button
                  className={`relative z-10 flex-1 flex items-center justify-center space-x-2 py-3 rounded-md 
                    transition-colors duration-300 font-medium ${
                      mode === "encrypt"
                        ? "text-white"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  onClick={() => setMode("encrypt")}
                >
                  <Lock
                    className={`w-4 h-4 transition-transform duration-300 ${
                      mode === "encrypt" ? "scale-110" : "scale-90"
                    }`}
                  />
                  <span
                    className={`transition-transform duration-300 ${
                      mode === "encrypt" ? "scale-110" : "scale-90"
                    }`}
                  >
                    Encrypt
                  </span>
                </button>
                <button
                  className={`relative z-10 flex-1 flex items-center justify-center space-x-2 py-3 rounded-md 
                    transition-colors duration-300 font-medium ${
                      mode === "decrypt"
                        ? "text-white"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  onClick={() => setMode("decrypt")}
                >
                  <Unlock
                    className={`w-4 h-4 transition-transform duration-300 ${
                      mode === "decrypt" ? "scale-110" : "scale-90"
                    }`}
                  />
                  <span
                    className={`transition-transform duration-300 ${
                      mode === "decrypt" ? "scale-110" : "scale-90"
                    }`}
                  >
                    Decrypt
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-1 rounded-xl shadow-lg">
              <div
                className={`rounded-lg p-2 ${
                  theme === "dark" ? "bg-gray-800/95" : "bg-white"
                }`}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "caesar", name: "Caesar Cipher", icon: "🔄" },
                    {
                      id: "monoalphabetic",
                      name: "Monoalphabetic",
                      icon: "📝",
                    },
                    { id: "rail", name: "Rail Fence", icon: "🚂" },
                    { id: "hill", name: "Hill Cipher", icon: "🔢" },
                    {
                      id: "polyalphabetic",
                      name: "Polyalphabetic",
                      icon: "🔀",
                    },
                    { id: "playfair", name: "Playfair", icon: "🎲" },
                    { id: "otp", name: "One-Time Pad", icon: "🎯" },
                    { id: "rowColumn", name: "Row-Column", icon: "📊" },
                  ].map((alg) => (
                    <button
                      key={alg.id}
                      onClick={() => setAlgorithm(alg.id)}
                      className={`relative group flex items-center p-3 rounded-lg transition-all duration-300 ${
                        algorithm === alg.id
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-100"
                          : theme === "dark"
                          ? "hover:bg-gray-700/50 text-gray-300 hover:scale-95"
                          : "hover:bg-gray-100 text-gray-600 hover:scale-95"
                      }`}
                    >
                      <span className="text-xl mr-3 group-hover:scale-125 transition-transform duration-300">
                        {alg.icon}
                      </span>
                      <span
                        className={`font-medium ${
                          algorithm === alg.id
                            ? "text-white"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {alg.name}
                      </span>
                      {algorithm === alg.id && (
                        <span className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg opacity-10 animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 px-4">
              <span className="animate-pulse">💡</span>
              <span>Select an encryption algorithm to continue</span>
            </div>
          </div>

          <div
            className={`space-y-2 p-4 rounded-lg ${
              theme === "dark"
                ? "bg-gray-700 border border-gray-600"
                : "bg-gray-50 border border-gray-200"
            }`}
          >
            <label className="block text-sm font-medium">
              {algorithm === "caesar"
                ? "Shift (0-25)"
                : algorithm === "rail"
                ? "Number of Rails"
                : algorithm === "hill"
                ? "Matrix (2x2)"
                : algorithm === "otp"
                ? "Key (same length as text)"
                : algorithm === "monoalphabetic"
                ? "Substitution Key (26 letters)"
                : "Key"}
            </label>
            {algorithm === "hill" ? (
              <div className="flex flex-col items-center space-y-6">
                <div className="p-8 bg-gradient-to-br from-white via-gray-50 to-blue-50/20 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-2xl border border-blue-100 dark:border-gray-700/50 backdrop-blur-sm">
                  <div className="inline-grid grid-cols-[auto_repeat(2,1fr)] gap-4">
                    <div className="w-8"></div>
                    {["Column 1", "Column 2"].map((col, i) => (
                      <div
                        key={i}
                        className="text-center font-bold text-gray-900 dark:text-gray-100 text-lg mb-2 px-4 py-2 bg-gray-100/50 dark:bg-gray-700/50 rounded-lg"
                      >
                        {col}
                      </div>
                    ))}

                    {matrix.map((row, rowIndex) => (
                      <React.Fragment key={rowIndex}>
                        <div className="flex items-center font-bold pr-4 text-gray-900 dark:text-gray-100">
                          Row {rowIndex + 1}
                        </div>
                        {row.map((value, colIndex) => (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            className="relative group"
                          >
                            <input
                              type="number"
                              className={`w-20 h-20 text-2xl text-center p-2 
                                ${
                                  theme === "dark"
                                    ? "bg-gray-700 text-white hover:bg-gray-600"
                                    : "bg-white text-gray-900 hover:bg-gray-50"
                                }
                                border-2 rounded-xl focus:outline-none focus:ring-4
                                ${
                                  !value
                                    ? "border-red-300 dark:border-red-700 bg-red-50/5 dark:bg-red-900/5"
                                    : value && !isNaN(value)
                                    ? "border-emerald-300 dark:border-emerald-600 bg-emerald-50/5 dark:bg-emerald-900/5"
                                    : "border-gray-300 dark:border-gray-600"
                                }
                                focus:border-blue-500 dark:focus:border-blue-400
                                shadow-lg hover:shadow-xl transition-all duration-300
                                transform hover:scale-110 active:scale-95
                                group-hover:ring-4 group-hover:ring-blue-200 dark:group-hover:ring-blue-900`}
                              value={value}
                              onChange={(e) => {
                                const val = e.target.value;
                                const newMatrix = [...matrix];
                                newMatrix[rowIndex][colIndex] = val;
                                setMatrix(newMatrix);
                              }}
                              placeholder="0"
                            />
                            {!value && (
                              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-semibold text-red-500 dark:text-red-400 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                Required
                              </span>
                            )}
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50 px-6 py-3 rounded-full shadow-inner">
                  <span className="animate-pulse">💡</span>
                  <span>Enter numbers for the 2x2 matrix determinant</span>
                </div>
              </div>
            ) : algorithm === "otp" ? (
              <div className="space-y-6 p-6 bg-gradient-to-br from-white via-gray-50 to-purple-50/20 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-xl shadow-lg border border-purple-100 dark:border-gray-700/50">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-1 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Key Options
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      <label className="relative inline-flex items-center p-3 bg-white dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all cursor-pointer group">
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={includeNumbers}
                          onChange={(e) => setIncludeNumbers(e.target.checked)}
                        />
                        <div
                          className={`w-4 h-4 border-2 rounded mr-3 transition-colors ${
                            includeNumbers
                              ? "bg-blue-500 border-blue-500"
                              : "border-gray-400 group-hover:border-blue-500"
                          }`}
                        >
                          {includeNumbers && (
                            <svg
                              className="w-3 h-3 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                            >
                              <polyline
                                points="20 6 9 17 4 12"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          Include Numbers (0-9)
                        </span>
                      </label>

                      <label className="relative inline-flex items-center p-3 bg-white dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all cursor-pointer group">
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={includeSymbols}
                          onChange={(e) => setIncludeSymbols(e.target.checked)}
                        />
                        <div
                          className={`w-4 h-4 border-2 rounded mr-3 transition-colors ${
                            includeSymbols
                              ? "bg-blue-500 border-blue-500"
                              : "border-gray-400 group-hover:border-blue-500"
                          }`}
                        >
                          {includeSymbols && (
                            <svg
                              className="w-3 h-3 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                            >
                              <polyline
                                points="20 6 9 17 4 12"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          Include Symbols (!@#$...)
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={generateOTPKey}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Generate Key
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([key], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "otp-key.txt";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      disabled={!key}
                      className={`flex items-center px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                        !key
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                      }`}
                    >
                      <Save className="w-5 h-5 mr-2" />
                      Save Key
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    className={`w-full p-4 pr-36 border-2 rounded-lg text-lg font-mono ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Your OTP key will appear here..."
                  />
                  {key && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded">
                        Length: {key.length}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50 px-4 py-2 rounded-lg">
                  <span className="animate-pulse">ℹ️</span>
                  <span>
                    Key length must match the input text length for OTP
                    encryption
                  </span>
                </div>
              </div>
            ) : (
              algorithm === "rowColumn" && (
                <div className="space-y-6 p-6 bg-gradient-to-br from-white via-gray-50 to-green-50/20 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-xl shadow-lg border border-green-100 dark:border-gray-700/50">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Row-Column Transposition
                      </h3>
                      <div className="text-sm px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                        {mode === "encrypt" ? "Encryption" : "Decryption"} Mode
                      </div>
                    </div>

                    <div className="relative group">
                      <input
                        type="text"
                        className={`w-full p-4 pr-36 border-2 rounded-lg text-lg font-mono tracking-wider
                        ${
                          theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        transition-all duration-300 group-hover:shadow-lg`}
                        value={key}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          setKey(val);
                        }}
                        placeholder="Enter permutation key (e.g., '3142')"
                      />
                      {key && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <span className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-600 rounded-lg font-medium text-sm">
                            Length: {key.length}
                          </span>
                          <button
                            onClick={() => setKey("")}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {key && inputText && (
                      <div className="mt-4 p-6 bg-white/90 dark:bg-gray-800/50 rounded-xl shadow-inner space-y-4 border border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Matrix Preview
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>
                              Rows: {Math.ceil(inputText.length / key.length)}
                            </span>
                            <span>•</span>
                            <span>Columns: {key.length}</span>
                          </div>
                        </div>

                        <div className="relative">
                          <div
                            className="grid gap-2 pb-6"
                            style={{
                              gridTemplateColumns: `repeat(${key.length}, minmax(0, 1fr))`,
                            }}
                          >
                            {key.split("").map((k, i) => (
                              <div key={i} className="flex justify-center">
                                <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg font-medium">
                                  Col {k}
                                </span>
                              </div>
                            ))}
                            {Array.from({
                              length: Math.ceil(inputText.length / key.length),
                            }).map((_, rowIndex) => (
                              <React.Fragment key={rowIndex}>
                                {Array.from({ length: key.length }).map(
                                  (_, colIndex) => {
                                    const charIndex =
                                      rowIndex * key.length + colIndex;
                                    const char = inputText[charIndex] || "";
                                    return (
                                      <div
                                        key={colIndex}
                                        className={`aspect-square flex items-center justify-center text-lg font-mono
                                      ${
                                        theme === "dark"
                                          ? "bg-gray-700"
                                          : "bg-white"
                                      }
                                      ${
                                        char
                                          ? "border-2 border-blue-500/30"
                                          : "border border-gray-300 dark:border-gray-600"
                                      }
                                      rounded-xl shadow-sm transition-all duration-200 
                                      hover:scale-105 hover:shadow-md hover:border-blue-500/50
                                      ${
                                        charIndex >= inputText.length
                                          ? "opacity-25"
                                          : "opacity-100"
                                      }`}
                                      >
                                        {char}
                                      </div>
                                    );
                                  }
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                          <div className="absolute -left-6 top-14 flex flex-col gap-2">
                            {Array.from({
                              length: Math.ceil(inputText.length / key.length),
                            }).map((_, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm"
                              >
                                Row {i + 1}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg">
                      <span className="animate-pulse">💡</span>
                      <div className="flex-1">
                        <p className="font-medium text-center mb-2">
                          How it works:
                        </p>
                        <div className="space-y-1 text-center">
                          <p>
                            Enter a sequence of numbers (e.g., "3142") to define
                            the column order.
                          </p>
                          <p>
                            The text will be arranged in rows and columns, then
                            read out according to the key sequence.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
            {algorithm === "rail" && (
              <div className="space-y-6 p-6 bg-gradient-to-br from-white via-gray-50 to-indigo-50/20 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-xl shadow-lg border border-indigo-100 dark:border-gray-700/50">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Rail Fence Pattern
                    </h3>
                    <div className="text-sm px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full">
                      {mode === "encrypt" ? "Encryption" : "Decryption"} Mode
                    </div>
                  </div>

                  <div className="relative group">
                    <input
                      type="number"
                      min="2"
                      className={`w-full p-4 pr-36 border-2 rounded-lg text-lg font-mono tracking-wider
                        ${
                          theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }
                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                        transition-all duration-300 group-hover:shadow-lg`}
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      placeholder="Enter number of rails (min: 2)"
                    />
                    {key && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button
                          onClick={() => setKey(Math.max(2, parseInt(key) - 1))}
                          className="p-1.5 text-gray-400 hover:text-indigo-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M20 12H4"
                            />
                          </svg>
                        </button>
                        <span className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-600 rounded-lg font-medium text-sm">
                          Rails: {key}
                        </span>
                        <button
                          onClick={() => setKey(parseInt(key) + 1)}
                          className="p-1.5 text-gray-400 hover:text-indigo-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {key && inputText && parseInt(key) >= 2 && (
                    <div className="mt-4 p-6 bg-white/90 dark:bg-gray-800/50 rounded-xl shadow-inner space-y-4 border border-gray-100 dark:border-gray-700/50">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Pattern Preview
                      </h4>
                      <div className="relative overflow-x-auto">
                        <div className="flex flex-col gap-2">
                          {Array.from({ length: parseInt(key) }).map(
                            (_, rail) => (
                              <div
                                key={rail}
                                className="flex items-center gap-2"
                              >
                                <span className="w-8 text-sm font-medium text-gray-500 dark:text-gray-400">
                                  Rail {rail + 1}
                                </span>
                                <div className="flex gap-1">
                                  {inputText.split("").map((char, idx) => {
                                    const cycle = 2 * (parseInt(key) - 1);
                                    const pos = idx % cycle;
                                    const isOnRail =
                                      rail === pos || rail === cycle - pos;
                                    return (
                                      <div
                                        key={idx}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-mono
                                        transition-all duration-300 transform
                                        ${
                                          isOnRail
                                            ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 scale-110 border-2 border-indigo-300 dark:border-indigo-700"
                                            : "bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 scale-90"
                                        }
                                      `}
                                      >
                                        {isOnRail ? char : "·"}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg">
                    <span className="animate-pulse">💡</span>
                    <div className="flex-1">
                      <p className="font-medium text-center mb-2">
                        How it works:
                      </p>
                      <div className="space-y-1 text-center">
                        <p>
                          Text is written in a zigzag pattern on {key || "n"}{" "}
                          rails and read off row by row.
                        </p>
                        <p>
                          The pattern creates a unique transposition based on
                          the rail count.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {algorithm === "polyalphabetic" && (
              <div className="space-y-6 p-6 bg-gradient-to-br from-white via-gray-50 to-cyan-50/20 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-xl shadow-lg border border-cyan-100 dark:border-gray-700/50">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Polyalphabetic Cipher
                    </h3>
                    <div className="text-sm px-3 py-1.5 bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 rounded-full">
                      {mode === "encrypt" ? "Encryption" : "Decryption"} Mode
                    </div>
                  </div>

                  <div className="relative group">
                    <input
                      type="text"
                      className={`w-full p-4 pr-36 border-2 rounded-lg text-lg font-mono tracking-wider uppercase
                        ${
                          theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }
                        focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500
                        transition-all duration-300 group-hover:shadow-lg`}
                      value={key}
                      onChange={(e) =>
                        setKey(
                          e.target.value.replace(/[^A-Za-z]/g, "").toUpperCase()
                        )
                      }
                      placeholder="Enter key word (e.g., 'CIPHER')"
                    />
                    {key && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-600 rounded-lg font-medium text-sm">
                          Length: {key.length}
                        </span>
                        <button
                          onClick={() => setKey("")}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {key && inputText && (
                    <div className="mt-4 p-6 bg-white/90 dark:bg-gray-800/50 rounded-xl shadow-inner space-y-6 border border-gray-100 dark:border-gray-700/50">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Pattern Preview
                        </h4>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <span className="w-20 text-sm font-medium text-gray-500 dark:text-gray-400">
                              Input:
                            </span>
                            <div className="flex gap-1 overflow-x-auto pb-2">
                              {inputText.split("").map((char, idx) => (
                                <div
                                  key={idx}
                                  className="w-8 h-8 flex items-center justify-center text-sm font-mono bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                                >
                                  {char.toUpperCase()}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-20 text-sm font-medium text-gray-500 dark:text-gray-400">
                              Key:
                            </span>
                            <div className="flex gap-1 overflow-x-auto pb-2">
                              {inputText.split("").map((_, idx) => (
                                <div
                                  key={idx}
                                  className="w-8 h-8 flex items-center justify-center text-sm font-mono bg-cyan-50 dark:bg-cyan-900/30 rounded-lg border-2 border-cyan-200 dark:border-cyan-800"
                                >
                                  {key[idx % key.length]}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
                        <div className="flex items-center gap-2">
                          <span className="w-20 text-sm font-medium text-gray-500 dark:text-gray-400">
                            Shift:
                          </span>
                          <div className="flex gap-1 overflow-x-auto pb-2">
                            {inputText.split("").map((_, idx) => (
                              <div
                                key={idx}
                                className="w-8 h-8 flex items-center justify-center text-xs font-mono bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                              >
                                +{key[idx % key.length].charCodeAt(0) - 65}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg">
                    <span className="animate-pulse">💡</span>
                    <div className="flex-1">
                      <p className="font-medium text-center mb-2">
                        How it works:
                      </p>
                      <div className="space-y-1 text-center">
                        <p>
                          Each letter in the key represents a shift value (A=0,
                          B=1, ..., Z=25).
                        </p>
                        <p>
                          The key repeats to match the input length, creating a
                          unique shift for each character.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {algorithm === "playfair" && (
              <div className="space-y-6 p-6 bg-gradient-to-br from-white via-gray-50 to-pink-50/20 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-xl shadow-lg border border-pink-100 dark:border-gray-700/50">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Playfair Cipher
                    </h3>
                    <div className="text-sm px-3 py-1.5 bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 rounded-full">
                      {mode === "encrypt" ? "Encryption" : "Decryption"} Mode
                    </div>
                  </div>

                  <div className="relative group">
                    <input
                      type="text"
                      className={`w-full p-4 pr-36 border-2 rounded-lg text-lg font-mono tracking-wider uppercase
                        ${
                          theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }
                        focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500
                        transition-all duration-300 group-hover:shadow-lg`}
                      value={key}
                      onChange={(e) =>
                        setKey(
                          e.target.value.replace(/[^A-Za-z]/g, "").toUpperCase()
                        )
                      }
                      placeholder="Enter keyword (e.g., 'MONARCHY')"
                    />
                    {key && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-600 rounded-lg font-medium text-sm">
                          Length: {key.length}
                        </span>
                        <button
                          onClick={() => setKey("")}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {key && (
                    <div className="mt-4 p-6 bg-white/90 dark:bg-gray-800/50 rounded-xl shadow-inner space-y-6 border border-gray-100 dark:border-gray-700/50">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Key Matrix (5x5)
                        </h4>
                        <div className="grid grid-cols-5 gap-1.5 max-w-md mx-auto">
                          {Array.from({ length: 25 }).map((_, idx) => {
                            const letter =
                              getPlayfairMatrix(key)[Math.floor(idx / 5)][
                                idx % 5
                              ];
                            return (
                              <div
                                key={idx}
                                className={`aspect-square flex items-center justify-center text-lg font-mono rounded-lg border-2
                                  ${
                                    letter === key[key.indexOf(letter)] &&
                                    key.includes(letter)
                                      ? "bg-pink-50 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300"
                                      : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                                  }
                                  transition-all duration-300 hover:scale-105`}
                              >
                                {letter}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {inputText && (
                        <div className="space-y-3">
                          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
                          <div className="flex flex-col gap-3">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Digraph Preview
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="w-20 text-sm font-medium text-gray-500 dark:text-gray-400">
                                Pairs:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {preparePlayfairText(inputText)
                                  .match(/.{1,2}/g)
                                  ?.map((pair, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-0.5"
                                    >
                                      {pair.split("").map((char, charIdx) => (
                                        <div
                                          key={charIdx}
                                          className="w-8 h-8 flex items-center justify-center text-sm font-mono bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                                        >
                                          {char}
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg">
                    <span className="animate-pulse">💡</span>
                    <div className="flex-1">
                      <p className="font-medium text-center mb-2">
                        How it works:
                      </p>
                      <div className="space-y-1 text-center">
                        <p>
                          A 5x5 grid is created using the keyword (I/J share a
                          cell).
                        </p>
                        <p>
                          Text is split into pairs and encrypted based on their
                          positions in the grid.
                        </p>
                        <p>
                          Special rules apply when letters are in the same row,
                          column, or form a rectangle.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {algorithm === "monoalphabetic" && (
              <div className="space-y-6 p-6 bg-gradient-to-br from-white via-gray-50 to-violet-50/20 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-xl shadow-lg border border-violet-100 dark:border-gray-700/50">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Monoalphabetic Substitution
                    </h3>
                    <div className="text-sm px-3 py-1.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-full">
                      {mode === "encrypt" ? "Encryption" : "Decryption"} Mode
                    </div>
                  </div>

                  <div className="relative group">
                    <input
                      type="text"
                      maxLength="26"
                      className={`w-full p-4 pr-36 border-2 rounded-lg text-lg font-mono tracking-wider uppercase
                        ${
                          theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }
                        focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                        transition-all duration-300 group-hover:shadow-lg`}
                      value={key}
                      onChange={(e) =>
                        setKey(
                          e.target.value.replace(/[^A-Za-z]/g, "").toUpperCase()
                        )
                      }
                      placeholder="Enter substitution key (26 unique letters)"
                    />
                    {key && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1.5 rounded-lg font-medium text-sm
                          ${
                            key.length === 26
                              ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                              : "bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {key.length}/26
                        </span>
                        <button
                          onClick={() => setKey("")}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 p-6 bg-white/90 dark:bg-gray-800/50 rounded-xl shadow-inner space-y-6 border border-gray-100 dark:border-gray-700/50">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Alphabet Mapping
                      </h4>
                      <div className="grid grid-cols-13 gap-1 max-w-4xl mx-auto">
                        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                          .split("")
                          .map((char, idx) => (
                            <div
                              key={idx}
                              className="flex flex-col items-center gap-1"
                            >
                              <div className="w-8 h-8 flex items-center justify-center text-sm font-mono bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                {char}
                              </div>
                              <div className="w-0.5 h-4 bg-violet-200 dark:bg-violet-800" />
                              <div
                                className={`w-8 h-8 flex items-center justify-center text-sm font-mono rounded-lg border-2
                              ${
                                key[idx]
                                  ? "bg-violet-50 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                                  : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400"
                              }`}
                              >
                                {key[idx] || "?"}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {key.length === 26 && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
                        <span>✓</span>
                        <span className="text-sm">
                          Valid substitution key with all 26 letters
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg">
                    <span className="animate-pulse">💡</span>
                    <div className="flex-1">
                      <p className="font-medium text-center mb-2">
                        How it works:
                      </p>
                      <div className="space-y-1 text-center">
                        <p>
                          Each letter in the alphabet is substituted with its
                          corresponding letter in the key.
                        </p>
                        <p>
                          The key must contain all 26 letters of the alphabet in
                          any order.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
                      for (let i = alphabet.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [alphabet[i], alphabet[j]] = [alphabet[j], alphabet[i]];
                      }
                      setKey(alphabet.join(""));
                    }}
                    className="flex items-center justify-center px-4 py-2 bg-violet-600 text-white rounded-lg transition-all duration-300 hover:bg-violet-700 hover:scale-105 active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate Random Key
                  </button>
                </div>
              </div>
            )}
            {algorithm === "caesar" && (
              <div className="space-y-6 p-6 bg-gradient-to-br from-white via-gray-50 to-orange-50/20 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-xl shadow-lg border border-orange-100 dark:border-gray-700/50">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Caesar Shift
                    </h3>
                    <div className="text-sm px-3 py-1.5 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-full">
                      {mode === "encrypt" ? "Encryption" : "Decryption"} Mode
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="25"
                      value={key || 0}
                      onChange={(e) => setKey(e.target.value)}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="absolute -top-2 left-0 right-0 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>|</span>
                      <span>|</span>
                      <span>|</span>
                      <span>|</span>
                      <span>|</span>
                    </div>
                    <div className="mt-2 flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>0</span>
                      <span>5</span>
                      <span>10</span>
                      <span>15</span>
                      <span>20</span>
                      <span>25</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setKey(Math.max(0, parseInt(key || 0) - 1))
                      }
                      className="p-2 text-gray-400 hover:text-orange-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M20 12H4"
                        />
                      </svg>
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="25"
                      className={`w-20 p-2 text-center text-lg font-mono border-2 rounded-lg
                        ${
                          theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }
                        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500`}
                      value={key || 0}
                      onChange={(e) =>
                        setKey(
                          Math.min(
                            25,
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        )
                      }
                    />
                    <button
                      onClick={() =>
                        setKey(Math.min(25, parseInt(key || 0) + 1))
                      }
                      className="p-2 text-gray-400 hover:text-orange-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-4 p-6 bg-white/90 dark:bg-gray-800/50 rounded-xl shadow-inner space-y-6 border border-gray-100 dark:border-gray-700/50">
                    <div className="flex flex-col gap-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Alphabet Shift Preview
                      </h4>
                      <div className="grid grid-cols-26 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                          .split("")
                          .map((char, idx) => (
                            <div
                              key={idx}
                              className="w-8 h-8 flex items-center justify-center text-sm font-mono bg-gray-50 dark:bg-gray-800 rounded"
                            >
                              {char}
                            </div>
                          ))}
                      </div>
                      <div className="grid grid-cols-26 gap-px bg-orange-200/30 dark:bg-orange-900/30 rounded-lg p-1">
                        {Array.from({ length: 26 }).map((_, idx) => {
                          const shift = parseInt(key || 0);
                          const newIdx = (idx + shift) % 26;
                          const char = String.fromCharCode(65 + newIdx);
                          return (
                            <div
                              key={idx}
                              className="w-8 h-8 flex items-center justify-center text-sm font-mono bg-orange-50 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded"
                            >
                              {char}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {inputText && (
                      <div className="space-y-3">
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Example:
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-mono">
                              {inputText[0]?.toUpperCase() || "A"}
                            </span>
                            <span className="text-xs text-gray-400">→</span>
                            <span className="text-sm font-mono text-orange-600 dark:text-orange-400">
                              {String.fromCharCode(
                                65 +
                                  ((inputText[0]?.toUpperCase().charCodeAt(0) -
                                    65 +
                                    parseInt(key || 0)) %
                                    26)
                              ) || "A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg">
                    <span className="animate-pulse">💡</span>
                    <div className="flex-1">
                      <p className="font-medium text-center mb-2">
                        How it works:
                      </p>
                      <div className="space-y-1 text-center">
                        <p>
                          Each letter in the text is shifted forward by{" "}
                          {key || 0} positions in the alphabet.
                        </p>
                        <p>The shift wraps around from Z back to A.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                    Input Text
                  </span>
                  <div className="relative">
                    <span
                      className={`absolute -inset-1 rounded-full ${
                        inputText.length > 0
                          ? "animate-ping bg-blue-400/20"
                          : ""
                      }`}
                    ></span>
                    <span
                      className="relative px-2 py-1 text-xs bg-gradient-to-r from-blue-100/80 to-purple-100/80 
                      dark:from-blue-900/30 dark:to-purple-900/30 text-blue-600 dark:text-blue-300 
                      rounded-full border border-blue-200/50 dark:border-blue-700/50"
                    >
                      {inputText.length} chars
                    </span>
                  </div>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInputText("")}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      inputText
                        ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-110 active:scale-95"
                        : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    }`}
                    disabled={!inputText}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <label
                    className="p-2 cursor-pointer text-gray-500 hover:text-blue-500 
                    hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg 
                    transition-all duration-300 hover:scale-110 active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      className="hidden"
                      accept=".txt"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>
              <div className="relative group">
                <div
                  className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-30 
                  group-hover:opacity-100 transition duration-1000 group-hover:duration-200"
                ></div>
                <div className="relative">
                  <textarea
                    className={`w-full h-40 p-4 text-base font-mono border-2 rounded-lg resize-none
                      transition-all duration-300 placeholder-gray-400
                      ${
                        theme === "dark"
                          ? "bg-gray-800/80 border-gray-600 text-gray-100 focus:border-blue-400"
                          : "bg-white border-gray-200 text-gray-900 focus:border-blue-500"
                      }
                      focus:outline-none focus:ring-2 focus:ring-blue-500/20
                      ${!inputText && "group-hover:border-blue-500/50"}
                      backdrop-blur-sm
                    `}
                    placeholder="Enter your text here..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    spellCheck={false}
                  />
                  <div
                    className={`absolute right-3 bottom-3 flex items-center gap-2 px-3 py-1.5 
                    rounded-full text-xs font-medium transition-opacity duration-300
                    ${
                      theme === "dark"
                        ? "bg-gray-700/50 text-gray-400"
                        : "bg-gray-100/50 text-gray-500"
                    } backdrop-blur-sm
                    ${inputText ? "opacity-100" : "opacity-0"}`}
                  >
                    <span>Lines: {inputText.split("\n").length}</span>
                    <span className="w-px h-3 bg-gray-400/30"></span>
                    <span>
                      Words:{" "}
                      {inputText.trim()
                        ? inputText.trim().split(/\s+/).length
                        : 0}
                    </span>
                  </div>
                  {!inputText && (
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      <div
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r 
                        from-blue-500/10 to-purple-500/10 rounded-lg backdrop-blur-sm
                        border border-blue-500/20 dark:border-blue-400/20"
                      >
                        <span className="animate-pulse"></span>
                        <span
                          className="text-sm bg-gradient-to-r from-blue-500 to-purple-500 
                          bg-clip-text text-transparent font-medium"
                        >
                          Start typing or drop a text file
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 text-xs text-gray-500 dark:text-gray-400"></div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <span className="text-green-500 dark:text-green-400">
                    Output Text
                  </span>
                  <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-full">
                    {outputText.length} characters
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(outputText)}
                    disabled={!outputText}
                    className={`p-1.5 rounded-lg transition-colors duration-200 ${
                      outputText
                        ? "text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={downloadOutput}
                    disabled={!outputText}
                    className={`p-1.5 rounded-lg transition-colors duration-200 ${
                      outputText
                        ? "text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                        : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="relative">
                <textarea
                  className={`w-full h-40 p-4 text-base font-mono border-2 rounded-lg resize-none
                    ${
                      theme === "dark"
                        ? "bg-gray-700/50 border-gray-600 text-gray-100"
                        : "bg-gray-50 border-gray-200 text-gray-900"
                    }
                    focus:outline-none`}
                  value={outputText}
                  readOnly
                  placeholder="Output will appear here..."
                  spellCheck={false}
                />
                {!outputText && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-500/5 rounded-lg">
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">
                        Click Execute to see the result
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg blur opacity-20" />
            <div
              className={`relative flex flex-wrap items-center gap-4 p-4 rounded-lg border backdrop-blur-sm ${
                theme === "dark"
                  ? "bg-gray-800/90 border-gray-700"
                  : "bg-white/90 border-gray-200"
              }`}
            >
              <button
                onClick={executeOperation}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 
                  bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
                  text-white font-medium rounded-lg shadow-lg hover:shadow-xl 
                  transition-all duration-300 transform hover:scale-105 active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={!inputText}
              >
                <Settings className="w-5 h-5 animate-spin-slow" />
                <span>Execute</span>
                <span className="px-2 py-0.5 text-xs bg-blue-700/50 rounded-full">
                  {mode === "encrypt" ? "Encrypt" : "Decrypt"}
                </span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(outputText)}
                  disabled={!outputText}
                  className="group flex items-center gap-2 px-4 py-3 
                    bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                    hover:bg-gray-200 dark:hover:bg-gray-600
                    rounded-lg transition-all duration-300 
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Copy to clipboard"
                >
                  <Copy className="w-5 h-5 transition-transform group-hover:scale-110 group-active:scale-95" />
                  <span className="hidden sm:inline">Copy</span>
                  {outputText && (
                    <span className="hidden sm:inline px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded-full">
                      {outputText.length} chars
                    </span>
                  )}
                </button>

                <button
                  onClick={downloadOutput}
                  disabled={!outputText}
                  className="group flex items-center gap-2 px-4 py-3 
                    bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                    hover:bg-gray-200 dark:hover:bg-gray-600
                    rounded-lg transition-all duration-300 
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download output"
                >
                  <Download className="w-5 h-5 transition-transform group-hover:scale-110 group-active:scale-95" />
                  <span className="hidden sm:inline">Save</span>
                </button>

                <button
                  onClick={() => {
                    setInputText("");
                    setOutputText("");
                    setKey("");
                    setMatrix([
                      ["", ""],
                      ["", ""],
                    ]);
                  }}
                  className="group flex items-center gap-2 px-4 py-3 
                    bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400
                    hover:bg-red-200 dark:hover:bg-red-900/50
                    rounded-lg transition-all duration-300"
                  title="Clear all inputs"
                >
                  <RefreshCw className="w-5 h-5 transition-transform group-hover:scale-110 group-active:scale-95" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </div>
            </div>
          </div>

          <div
            className={`mt-8 p-6 rounded-xl transition-all duration-300 ${
              theme === "dark"
                ? "bg-gray-800/80 border border-gray-700 backdrop-blur-sm"
                : "bg-white border border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                  Operation History
                </h2>
                <span
                  className="px-3 py-1 text-xs font-medium bg-blue-100/80 dark:bg-blue-900/30 
        text-blue-600 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800"
                >
                  {history.length} entries
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportHistory}
                  disabled={!history.length}
                  className="group flex items-center gap-2 px-4 py-2 
          bg-gradient-to-r from-emerald-500 to-green-600 
          hover:from-emerald-600 hover:to-green-700
          text-white rounded-lg shadow-md hover:shadow-lg 
          transition-all duration-300 transform hover:scale-105 
          active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 transition-transform group-hover:rotate-12" />
                  <span className="font-medium">Export History</span>
                </button>

                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to clear the history?"
                      )
                    ) {
                      clearHistory();
                    }
                  }}
                  disabled={!history.length}
                  className="group flex items-center gap-2 px-4 py-2
          bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400
          hover:bg-red-200 dark:hover:bg-red-900/50
          rounded-lg transition-all duration-300"
                >
                  <Trash2 className="w-4 h-4 transition-transform group-hover:rotate-12" />
                  <span className="font-medium">Clear</span>
                </button>
              </div>
            </div>

            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div
                  className="w-20 h-20 mb-4 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 
        flex items-center justify-center"
                >
                  <Settings className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  No operations yet
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Your encryption/decryption history will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((entry, index) => (
                  <div
                    key={index}
                    className={`group p-4 rounded-lg transition-all duration-300 transform hover:scale-[1.01]
            ${
              theme === "dark"
                ? "bg-gray-800 hover:bg-gray-750 border border-gray-700"
                : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
            }
          `}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg 
                ${
                  entry.mode === "encrypt"
                    ? "bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "bg-purple-100/50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                }`}
                        >
                          {entry.mode === "encrypt" ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">
                              {entry.mode}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700">
                              {entry.algorithm}
                            </span>
                          </div>
                          <time className="text-xs text-gray-500 dark:text-gray-400">
                            {entry.timestamp}
                          </time>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => {
                            setInputText(entry.input);
                            setMode(entry.mode);
                            setAlgorithm(entry.algorithm);
                          }}
                          className="p-2 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-50 
                  dark:hover:bg-blue-900/20 transition-colors duration-200"
                          title="Reuse this operation"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 pl-12">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-500 dark:text-gray-400">
                            Input:
                          </span>
                          <code className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-700/50 rounded">
                            {entry.input}
                          </code>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-500 dark:text-gray-400">
                            Output:
                          </span>
                          <code className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-700/50 rounded">
                            {entry.output}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {theme === "dark" && (
            <>
              <div className="fixed inset-0 bg-gradient-to-b from-black/10 to-transparent pointer-events-none" />
              <div className="fixed inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const getPlayfairMatrix = (key) => {
  const alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ"; // Note: I/J are combined
  const matrix = Array(5)
    .fill()
    .map(() => Array(5).fill(""));
  const used = new Set();

  let row = 0,
    col = 0;

  // First, place the key letters
  for (let char of key.toUpperCase()) {
    if (char === "J") char = "I";
    if (!used.has(char)) {
      matrix[row][col] = char;
      used.add(char);
      col++;
      if (col === 5) {
        col = 0;
        row++;
      }
    }
  }

  // Then fill with remaining alphabet
  for (let char of alphabet) {
    if (!used.has(char)) {
      matrix[row][col] = char;
      col++;
      if (col === 5) {
        col = 0;
        row++;
      }
    }
  }

  return matrix;
};

// Preprocessing the input text
const preparePlayfairText = (text) => {
  return text
    .toUpperCase()
    .replace(/[^A-Z]/g, "") // Remove non-alphabetic characters
    .replace(/J/g, "I") // Replace J with I
    .replace(/(.)\1/g, "$1X$1") // Handle repeated characters within the digraph
    .replace(/^(.)$/, "$1X"); // Handle odd-length text
};
