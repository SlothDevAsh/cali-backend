import amqp from "amqplib";

let channel: amqp.Channel;

export const connectQueues = async () => {
  try {
    const connection = await amqp.connect("amqp://localhost");
    channel = await connection.createChannel();
    await channel.assertQueue("jobQueue", { durable: true });
    console.log("Connected to message queue and jobQueue is ready.");
  } catch (error) {
    console.log("Error while connecting to message queue");
    console.log(error);
  }
};

export const getChannel = () => {
  if (!channel) {
    throw new Error("Channel is not initialized. Call connectQueues() first.");
  }
  return channel;
};
