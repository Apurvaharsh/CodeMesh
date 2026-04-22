import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();

app.use(cors());
app.use(express.json());

const languageMap: Record<string, number> = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
};

app.post("/run", async (req, res) => {
  try {
    const { code, language, input } = req.body;

    const submit = await axios.post(
      "http://127.0.0.1:2358/submissions?base64_encoded=false&wait=true",
      {
        source_code: code,
        language_id: languageMap[language],
        stdin: input,
      },
      {
        timeout: 30000,
      }
    );

    const data = submit.data;

    res.json({
      output:
        data.stdout ||
        data.stderr ||
        data.compile_output ||
        "No output",
    });
  } catch (error: any) {
  console.log("REAL ERROR:");
  console.log(error.response?.data || error.message);

  res.json({
    output:
      JSON.stringify(error.response?.data) ||
      error.message ||
      "Execution failed",
  });
}
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
