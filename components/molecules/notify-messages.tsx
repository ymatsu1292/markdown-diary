import { Card, CardBody } from "@heroui/react";

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
          <CardBody>
            <>
              {messages.map((message, index) => (
                <p key={index}>{message}</p>
              ))}
            </>
          </CardBody>
        </Card>
      </div>
      :
      <></>
    }
    </>
  );
};
