import { Card, CardBody, CardHeader } from '@nextui-org/react';
import type { PressEvent } from '@react-types/shared';

export function NotifyMessages(
  { messages, onPress } : {
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
