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
app.use(cors());

// Call message queue connection
connectQueues();

// Endpoint to create a new job
app.post("/jobs", async (req: Request, res: Response) => {
  const jobId = uuidv4();
  const job: IJob = { jobId, status: JOB_STATUSES.PENDING };

  // Respond immediately with the job ID
  saveJobResult(jobId, "", JOB_STATUSES.PENDING); // Pass null for the imageUrl as it's pending

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

  // // Check if results have any entries
  if (results.length === 0) {
    res.status(404).json({ message: "No jobs found." });
  } else {
    // // Find the job by jobId in the results
    const jobResult = results.find((result) => result.jobId === jobId);

    if (jobResult) {
      // If the job is found, return its details
      res.json(jobResult);
    } else {
      // If the job is not found, return a 404 status
      res.status(404).json({ message: `Job with ID ${jobId} not found.` });
    }
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

  // Map results to return only jobId and status
  const jobsList = results.map((job: JobResult) => ({
    ...job,
  }));

  res.json(jobsList);
});

// Endpoint to process jobs
app.get("/", async (req: Request, res: Response) => {
  res.json({
    message: "working",
  });
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
