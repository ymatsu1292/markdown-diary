import { ListBox } from "@heroui/react";
import { PageData } from "@/types/page-data-type";

export function GrepResultList(
  { pageData, setPage } : {
    pageData: PageData,
    setPage: (page: string) => void,
  }
) {
  return (
    <div className="bg-blue-50 w-120">
      <div className="m-1 p-1">grep結果({pageData.grepText})</div>
      <div className="container mx-auto">
        <ListBox aria-label="greplist" variant="default" selectionMode="single"
          className="h-[calc(100dvh-170px)] overflow-scroll my-0 py-0 font-bold font-mono"
        >
          { pageData.grepResults.map((item) => 
            <ListBox.Item id={item[0]+":"+item[1]} key={item[0]+":"+item[1]} textValue={item[2]}
              onPress={(e) => {
                if (e.target instanceof HTMLElement && e.target.dataset != undefined && e.target.dataset.key != undefined ) {
                  setPage(e.target.dataset.key.split(":")[0].slice(0, -3));
                }
              }}
            >
              {item[0]+"["+item[1]+"]"}: {item[2]}
            </ListBox.Item>)
          }
        </ListBox>
      </div>
    </div>
  );  
}
