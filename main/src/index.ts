import express, { Request, Response } from "express";
import cors from "cors";
import { IJob, JOB_STATUSES } from "./interfaces/job.interface";
import { v4 as uuidv4 } from "uuid";
import { connectQueues, getChannel } from "./queues";
import { saveJobResult, startJobProcessor } from "./jobs/jobProcessor";
import * as dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to enable CORS
app.use(cors());

const jobs: { [key: string]: IJob } = {}; // Use the Job interface for jobs

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
