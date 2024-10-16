
# Backend README

## Project Overview

This backend application is designed to handle job processing and real-time updates using Express, RabbitMQ, and Socket.IO. The architecture allows for efficient task management and instant update to clients regarding job status changes.

### Basic Structure

- **Express**: A web framework for Node.js that simplifies the process of building server-side applications. It handles routing, middleware, and HTTP requests.
  
- **RabbitMQ**: A message broker that enables the application to queue jobs and process them asynchronously. This allows for reliable task distribution and execution without blocking the main server thread.

- **Socket.IO**: A library that enables real-time, bidirectional communication between clients and the server. It is used to inform clients immediately when there is a job status update, providing a seamless user experience.

## Setup Instructions

### Prerequisites

1. **Node.js**: Ensure you have Node.js installed on your machine.

2. **RabbitMQ**: You will need RabbitMQ installed. This is the most time-consuming part of the setup. Follow any guide to set up RabbitMQ on your machine and best of luck with that.😃

3. **Accessing the RabbitMQ Dashboard**: Once it is set up, you can access the RabbitMQ dashboard at `http://localhost:15672/`. The default username and password are both `guest`.


### Setup Backend
To set up the backend, follow these steps:

1. **Clone the Repository**
   ```bash
   git clone git@github.com:SlothDevAsh/calo-backend.git
   ```

2. **Install Dependencies**
    Navigate to the ```main``` folder in the repository to install dependencies using the command:
   ```bash
   yarn install
   ```

3. **Set Up Environment Variables**
   In the same folder, create a `.env` file in the root directory and add the below necessary environment variables.
   ```bash
   UNSPLASH_API_KEY = WVyfr1DYNXthvl4-T4zWNbEahyr8cCQ5VHi7ejWIUSk
   PORT = 4000
   ```

4. **Start the Server**
   ```bash
   yarn start
   ```
   This command will start the server, and you will be able to view it at `http://localhost:4000`.
   
## Time Report

| Section                      | Time Spent |
|------------------------------|------------|
| Project Overview             | 10 minutes | 
| Basic Structure              | 20 minutes |
| Setting Up RabbitMQ          | 30 minutes |
| Implementing API'S           | 30 minutes |
| Setting Up Socket.IO         | 10 minutes |
| Testing                      | 1 hour     |

## Conclusion

This backend application serves as a robust foundation for job processing and real-time communication. By following the setup instructions, you can easily deploy and run the application locally.
