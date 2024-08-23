"use client";
import { useState } from "react";
import { Box, Button, Stack, TextField } from "@mui/material";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm an AI assistant. How can I help you today?",
    },
  ]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      role: "user",
      content: message.trim(),
    };

    setMessages((prev) => [...prev, userMessage, { role: "assistant", content: "" }]);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([...messages, userMessage]),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantMessage = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        assistantMessage += chunkValue;

        setMessages((prev) => {
          const updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1].content = assistantMessage;
          return updatedMessages;
        });
      }
    } catch (error) {
      console.error("Error fetching assistant response:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        direction="column"
        width="600px"
        height="800px"
        border="1px solid #ccc"
        borderRadius="8px"
        padding={2}
        spacing={2}
        sx={{ backgroundColor: "#f9f9f9", overflow: "hidden" }}
      >
        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          padding={2}
          sx={{ backgroundColor: "#fff", borderRadius: "8px" }}
        >
          {messages.map((msg, index) => (
            <Box
              key={index}
              alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
              bgcolor={msg.role === "user" ? "#e1f5fe" : "#e8f5e9"}
              color="#000"
              padding={2}
              borderRadius="8px"
              maxWidth="80%"
              boxShadow="0 1px 3px rgba(0,0,0,0.1)"
            >
              {msg.content}
            </Box>
          ))}
          {loading && (
            <Box alignSelf="flex-start" padding={2}>
              Typing...
            </Box>
          )}
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Type your message..."
            fullWidth
            variant="outlined"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={loading}
          />
          <Button variant="contained" color="primary" onClick={sendMessage} disabled={loading}>
            Send
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
