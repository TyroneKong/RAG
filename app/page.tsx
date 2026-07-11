"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useEffect } from "react";
import DynamicTable from "./features/users/organisms/dynamic-table";
export default function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat();

  useEffect(() => {
    messages.forEach((msg) => {
      // UIMessages wrap everything inside the parts array
      if (msg.parts) {
        msg.parts.forEach((part) => {
          // Replace 'getSchema' with the exact name of your tool if it differs
          if (
            part.type === "tool-getSchema" &&
            part.state === "output-available"
          ) {
            console.log("Found our database rows inside parts!", part.output);
          }
        });
      }
    });
  }, [messages]);

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      <div className="space-y-4">
        {messages.map((m) => (
          <div key={m.id} className="whitespace-pre-wrap">
            <div>
              <div className="font-bold">{m.role}</div>
              {m.parts.map((part) => {
                switch (part.type) {
                  case "text":
                    return <p key={part.type}>{part.text}</p>;
                  case "tool-getSchema":
                    return (
                      <div key={part.type}>
                        {part.output && <DynamicTable data={part.output} />}
                      </div>
                    );

                  case "tool-addResource":
                  case "tool-getInformation":
                    return (
                      <p key={part.type}>
                        call{part.state === "output-available" ? "ed" : "ing"}{" "}
                        tool: {part.type}
                        <span className="my-4 bg-zinc-100 p-2 rounded-sm">
                          {JSON.stringify(part.input, null, 2)}
                        </span>
                      </p>
                    );
                }
              })}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput("");
        }}
      >
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
