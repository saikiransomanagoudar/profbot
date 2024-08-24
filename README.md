# Rate My Professor

## About the Project

**Rate My Professor** is a chatbot helps students in choosing the right professor for their academic needs based on rating, subject, and skills.

## Features

- **Search Functionality**: Find professors by name, department, or university.
- **Rating System**: Rate professors based on criteria like teaching quality, clarity, and helpfulness.
- **Responsive Design**: Accessible on all devices.

## Tech Stack

- **Frontend**: React, Next.js, 
- **Backend**: Node.js, Python
- **Database**: Pinecone
- **Deployment**: Vercel

## Getting Started

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/saikiransomanagoudar/rate-my-professor.git
    cd rate-my-professor
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Create a `.env.local` file in the root directory and add the following environment variables:
    ```plaintext
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY=your_stripe_public_key
    PINECONE_API_KEY=your_pinecone_api_key
    PINECONE_ENVIRONMENT=your_pinecone_environment
    ```

### Running the Project

To start the development server:

```sh
npm run dev
