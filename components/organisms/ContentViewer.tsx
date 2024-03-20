import { Tabs, Tab, Card, CardBody } from '@nextui-org/react';

export function ContentViewer(
  { targetPage } : {
    targetPage: string
  }
) {
  console.log("ContentViewer: START");
  console.log("ContentViewer: END");
  return (
    <div className="container mx-auto bg-gray-200">
      <Tabs aria-label="viewer" className="p-2 m-2">
        <Tab key="editor" title="編集">
	  <Card className="p-2 ml-2">
            <CardBody>
	      <div id="editor">dummy</div>
	    </CardBody>
          </Card>
	</Tab>
      </Tabs>
    </div>
  );
}
