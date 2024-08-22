from dotenv import load_dotenv
import os
from pinecone import Pinecone, ServerlessSpec
from openai import OpenAI
import json

load_dotenv()

# Initialize Pinecone
api_key = os.getenv("PINECONE_API_KEY")
print("PINECONE_API_KEY:", api_key)  # Debugging line
pc = Pinecone(api_key=api_key)

# Name of the index
index_name = "rag"

# List existing indexes and check if 'rag' exists
existing_indexes = [index['name'] for index in pc.list_indexes().get('indexes', [])]
print("Existing indexes:", existing_indexes)  # Debugging line

if index_name not in existing_indexes:
    # Create the Pinecone index if it doesn't exist
    try:
        pc.create_index(
            name=index_name,
            dimension=1536,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
        print(f"Created index: {index_name}")
    except Exception as e:
        print(f"Error creating index: {e}")
else:
    print(f"Index {index_name} already exists")

# Load the review data
data = json.load(open("reviews.json"))

processed_data = []
client = OpenAI()

# Create embeddings for each review
for review in data["reviews"]:
    response = client.embeddings.create(
        input=review['review'], model="text-embedding-3-small"
    )
    embedding = response.data[0].embedding
    processed_data.append(
        {
            "values": embedding,
            "id": review["professor"],
            "metadata": {
                "review": review["review"],
                "subject": review["subject"],
                "stars": review["stars"],
            }
        }
    )

# Insert the embeddings into the Pinecone index
index = pc.Index(index_name)
upsert_response = index.upsert(
    vectors=processed_data,
    namespace="ns1",
)
print(f"Upserted count: {upsert_response['upserted_count']}")

# Print index statistics
print(index.describe_index_stats())
