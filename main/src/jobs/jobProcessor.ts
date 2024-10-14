import { filePath } from "../config";
import { JOB_STATUSES, JobResult } from "../interfaces/job.interface";
import { getChannel } from "../queues";
import axios from "axios";
import fs from "fs";

export const saveJobResult = (
  jobId: string,
  imageUrl: string,
  status: JOB_STATUSES
) => {
  const jobResult: JobResult = {
    jobId,
    imageUrl,
    status: status,
    timestamp: new Date(),
  };

  // Read existing results
  let results: JobResult[] = [];
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, "utf-8");
    results = JSON.parse(data);
  } else {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), "utf-8");
  }

  const existingJobIndex = results.findIndex(
    (result) => result.jobId === jobId
  );

  if (existingJobIndex !== -1) {
    // Update the existing job result
    results[existingJobIndex] = { ...results[existingJobIndex], ...jobResult };
  } else {
    // If not found, push new result
    results.push(jobResult);
  }

  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2), "utf-8");
};

export const startJobProcessor = async () => {
  const channel = getChannel();

  await channel.consume("jobQueue", async (msg) => {
    if (msg) {
      const { jobId } = JSON.parse(msg.content.toString());

      // Simulate job processing delay
      const delay = Math.floor(Math.random() * 61) * 5 + 5; // Random delay between 5 and 300 seconds (with 5 sec step)

      // Wait for the delay
      await new Promise((resolve) => setTimeout(resolve, delay * 1000));

      // Fetching a random Unsplash image from food category
      try {
        const url = `https://api.unsplash.com/photos/random?query=food&count=1&client_id=${process.env.UNSPLASH_API_KEY}`;

        const response = await axios.get(url);

        const imageUrl = response.data[0].urls.regular;

        saveJobResult(jobId, imageUrl, JOB_STATUSES.RESOLVED);

        // Acknowledge the message
        channel.ack(msg);
      } catch (error) {
        saveJobResult(jobId, "", JOB_STATUSES.REJECTED);

        channel.nack(msg, false, true); // Negatively acknowledge the message (do not nack all messages up to this one), keeping it in the queue for retrying due to a transient error.
      }
    }
  });
};
