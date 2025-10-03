const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

const WORKBOOK_PATH = "./config/question_master.xlsx";   // input
const OUTPUT_PATH = "./config/question_master.json";     // output

function createColumnMapping(headerRow) {
  const mapping = {};
  headerRow.forEach((header, index) => {
    if (!header) return;
    const h = header.toString().toLowerCase().trim();
    if (h.includes("question key")) mapping.questionKey = index;
    else if (h.includes("question level")) mapping.questionLevel = index;
    else if (h === "question" || h.includes("question details")) mapping.question = index;
    else if (h.includes("input 1")) mapping.input1 = index;
    else if (h.includes("input 2")) mapping.input2 = index;
    else if (h === "answer") mapping.answer = index;
    else if (h === "symbol") mapping.symbol = index;
    else if (h === "valid") mapping.valid = index;
    else if (h === "combo") mapping.combo = index;
    else if (h.includes("final level")) mapping.finalLevel = index;
  });
  return mapping;
}

function parseQuestionLevel(rawLevel) {
  if (!rawLevel) return { difficulty: "unknown", levelNumber: null };
  const parts = rawLevel.split(/\s+/);
  const difficultyPart = (parts[0] || "").toLowerCase().trim();
  const levelPart = parts[1] || "";
  const difficulty = ["easy", "medium", "hard"].includes(difficultyPart)
    ? difficultyPart
    : "unknown";
  const levelNumber = levelPart ? parseInt(levelPart, 10) : null;
  return { difficulty, levelNumber };
}

function convertExcelToJson() {
  console.log("Reading Excel file:", WORKBOOK_PATH);
  const workbook = xlsx.readFile(WORKBOOK_PATH);
  const sheetNames = workbook.SheetNames.filter((n) => n.startsWith("QM"));
  if (!sheetNames.length) {
    console.error("No QM sheets found!");
    return;
  }

  const allRows = [];

  sheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    if (rawData.length < 3) return;

    const headerRow = rawData[1];
    const mapping = createColumnMapping(headerRow);
    const dataRows = rawData.slice(2);

    dataRows.forEach((row, i) => {
      if (!row[0]) return; // skip empty
      const rawLevel = String(row[mapping.questionLevel] || "").trim();
      const { difficulty, levelNumber } = parseQuestionLevel(rawLevel);

      const finalLevelVal = row[mapping.finalLevel];
      let finalLevel = 1;
      if (finalLevelVal) {
        const str = String(finalLevelVal).toLowerCase();
        const match = str.match(/level\s*(\d+)/);
        finalLevel = match ? parseInt(match[1], 10) : parseInt(finalLevelVal, 10) || 1;
      }

      allRows.push({
        questionKey: String(row[mapping.questionKey] || "").trim(),
        questionLevel: rawLevel,
        difficulty,
        levelNumber,
        question: String(row[mapping.question] || "").trim(),
        input1: row[mapping.input1] || "",
        input2: row[mapping.input2] || "",
        answer: row[mapping.answer] || "",
        symbol: String(row[mapping.symbol] || "").trim(),
        valid: row[mapping.valid] || "",
        combo: row[mapping.combo] || "",
        finalLevel,
      });
    });
  });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allRows, null, 2), "utf8");
  console.log(`✅ Done! Exported ${allRows.length} questions to ${OUTPUT_PATH}`);
}

convertExcelToJson();
