# Chat Session Flow

This describes the flow of data during a typical chat session.

```mermaid
sequenceDiagram
    participant User
    participant Frontend (React)
    participant Backend (Express)
    participant Edge Function (Deno)
    participant OpenAI API

    User->>+Frontend (React): Enters message and submits
    Frontend (React)->>+Backend (Express): POST /api/chat/message with history
    Backend (Express)->>+Edge Function (Deno): Invokes 'chat-with-liara' function
    Edge Function (Deno)->>+OpenAI API: Sends prompt with history & context
    OpenAI API-->>-Edge Function (Deno): Streams back response chunks
    Edge Function (Deno)-->>-Backend (Express): Streams response
    Backend (Express)-->>-Frontend (React): Streams response
    Frontend (React)-->>-User: Displays real-time response
    
    par
        Frontend (React)->>Backend (Express): Save User Message to DB
    and
        Backend (Express)->>Backend (Express): Save AI Response to DB
    end
```

1.  **User Sends Message:** The user types a message in the `ChatInput` component and submits it.
2.  **API Call:** The frontend calls the `POST /api/chat/message` endpoint on the backend.
3.  **Edge Function:** The backend server invokes the `chat-with-liara` Supabase Edge Function, passing the message history and personality context.
4.  **OpenAI:** The Edge Function communicates with the OpenAI API to get a response.
5.  **Response Stream:** The response is streamed back through the backend to the frontend.
6.  **UI Update:** The `ChatPage` displays the incoming message chunks in real-time.
7.  **History Save:** Both the user's message and the AI's full response are saved to the `chat_history` table. 