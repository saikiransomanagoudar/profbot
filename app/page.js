"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Orbitron } from 'next/font/google';
import { Box, Button, TextField } from "@mui/material";
import './globals.css';

const orbitron = Orbitron({ subsets: ['latin'] });

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm an AI assistant. How can I help you today?",
    },
  ]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const chatHistoryRef = useRef(null);

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

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      className="main"
    >
      <h1 className={`logo ${orbitron.className}`}>ProfBot</h1>
      <div className="chatContainer">
        <div className="chatHistory" ref={chatHistoryRef}>
          {messages.map((msg, index) => (
            <div key={index} className={msg.role === "user" ? "userMessage" : "botMessage"}>
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="botMessage">
              Thinking...
            </div>
          )}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="inputForm">
          <TextField
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input"
            fullWidth
            variant="outlined"
            disabled={loading}
          />
          <Button type="submit" className="sendButton" variant="contained" color="primary" disabled={loading}>
            SEND
          </Button>
        </form>
      </div>
    </Box>
  );
}
