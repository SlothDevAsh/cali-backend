import express, { Request, Response } from "express";
import cors from "cors";
import { IJob, JOB_STATUSES, JobResult } from "./interfaces/job.interface";
import { v4 as uuidv4 } from "uuid";
import { connectQueues, getChannel } from "./queues";
import { saveJobResult, startJobProcessor } from "./jobs/jobProcessor";
import * as dotenv from "dotenv";
import fs from "fs";
import { filePath } from "./config";
dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to enable CORS
app.use(
  cors({
    origin: "*",
  })
);

// Endpoint to create a new job
app.post("/jobs", async (req: Request, res: Response) => {
  const jobId = uuidv4();
  const job: IJob = { jobId, status: JOB_STATUSES.PENDING };

  saveJobResult(jobId, "", JOB_STATUSES.PENDING); // pendin state

  // Respond immediately to the client with the job ID
  res.json({ jobId });

  // Notify Job Processor to handle the job asynchronously
  try {
    const result = getChannel().sendToQueue(
      "jobQueue",
      Buffer.from(JSON.stringify(job)),
      { persistent: true }
    );

    if (result) {
      console.log(`Job ${jobId} added to the queue.`);
    } else {
      console.error(`Failed to add job ${jobId} to the queue.`);
    }
  } catch (err) {
    console.error("Error while publishing to RabbitMQ:", err);
  }
});

// Route to get a specific job by jobId
app.get("/jobs/:jobId", async (req: Request, res: Response) => {
  const { jobId } = req.params;
  let results: JobResult[] = [];

  // // Check if the job results file exists
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, "utf-8");
    results = JSON.parse(data);
  }

  // // Find the job by jobId in the results
  const jobResult = results.find((result) => result.jobId === jobId);

  if (jobResult) {
    // If the job is found, return its details
    res.json(jobResult);
  } else {
    // If the job is not found, return a 404 status
    res.status(404).json({ message: `Job with ID ${jobId} not found.` });
  }
});

// Route to get the list of jobs
app.get("/jobs", (req: Request, res: Response) => {
  // Read existing results
  let results: JobResult[] = [];
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, "utf-8");
    results = JSON.parse(data);
  }

  // Sort results by timestamp in descending order to get the latest job first
  results.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Map results to return only jobId and status
  const jobsList = results.map((job: JobResult) => ({
    ...job,
  }));

  res.json(jobsList);
});

async function startServer() {
  await connectQueues(); // Connect to RabbitMQ
  await startJobProcessor(); // Start the job processor

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Error starting the server:", error);
});
