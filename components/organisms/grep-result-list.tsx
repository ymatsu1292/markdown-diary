import { Table, Selection } from "@heroui/react";
import type { PageData } from "@/types/page-data-type";
import type { GrepResult } from "@/types/grep-type";

export function GrepResultList(
  { pageData, setPage } : {
    pageData: PageData,
    setPage: (page: string) => void,
  }
) {
  return (
    <div className="bg-blue-50 w-120">
      <div className="m-1 p-1">grep結果【{pageData.grepText}】</div>
      <div className="container mx-auto">
        <Table className="text-xs">
          <Table.ScrollContainer>
            <Table.Content aria-label="grep results"
              selectionMode="single"
              onSelectionChange={(keys: Selection) => {
                const regex = /^(.*)\.md:[0-9]+$/;
                if (keys != "all" && [...keys].length > 0) {
                  // console.log([...keys][0]);
                  // let o1 = [...keys];
                  // let o2 = o1[0];
                  // let o3 = String(o2);
                  // let o4 = regex.exec(o3) || ["", ""];
                  // let o5 = o4[1];
                  let regexResult = regex.exec(String([...keys][0])) || ["", ""];
                  setPage(regexResult[1]);
                }
              }}
            >
              <Table.Header className="hidden">
                <Table.Column key="fname" isRowHeader className="p-0 m-0" minWidth={100}>ファイル名:行</Table.Column>
                <Table.Column key="value" className="p-0 m-0"> 値</Table.Column>
              </Table.Header>
              <Table.Body>
                <Table.Collection items={pageData.grepResults}>
                  {(item) => (
                    <Table.Row key={item["key"]}>
                      <Table.Cell key="fname+linenum" className="p-1 text-xs text-left">{item.fname+":"+item.linenum}</Table.Cell>
                      <Table.Cell key="value" className="p-1 text-xs text-left">{item.value}</Table.Cell>
                    </Table.Row>
                  )}
                </Table.Collection>
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>
    </div>
  );  
}
