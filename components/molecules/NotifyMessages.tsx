import { Card, CardBody, CardHeader } from '@nextui-org/react';
import { Button } from '@nextui-org/react';
import { XSquare } from '@phosphor-icons/react';

export function NotifyMessages(
  { messages } : {
    messages: string[]
  }
) {
  return (
    <>
    {(messages.length > 0) ?
      <div className="fixed bottom-8 right-8">
        <Card>
          <CardHeader>
            <Button isIconOnly aria-label="close"className="sm">
              <XSquare size={12} />
            </Button>
          </CardHeader>
          <CardBody>
            <>
              {messages.map(message => (
                <p>{message}</p>
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
