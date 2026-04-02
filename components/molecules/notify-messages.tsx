import { Card } from "@heroui/react";

export function NotifyMessages(
  { messages } : {
    messages: string[];
  }
) {
  return (
    <>
    {(messages.length > 0) ?
      <div className="fixed bottom-8 right-8">
        <Card className="bg-red-300">
          <Card.Content>
            <>
              {messages.map((message, index) => (
                <p key={index}>{message}</p>
              ))}
            </>
          </Card.Content>
        </Card>
      </div>
      :
      <></>
    }
    </>
  );
};
