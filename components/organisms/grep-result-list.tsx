import { Listbox, ListboxItem } from "@heroui/react";
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
        <Listbox aria-label="greplist" variant="flat" selectionMode="single"
          itemClasses={{base: "my-0 py-0 font-bold font-mono", title: "font-serif"}}
        >
          { pageData.grepResults.map((item) => 
            <ListboxItem key={item[0]+":"+item[1]} startContent={item[0]+"["+item[1]+"]"}
              onPress={(e) => {
                if (e.target instanceof HTMLElement && e.target.dataset != undefined && e.target.dataset.key != undefined ) {
                  setPage(e.target.dataset.key.split(":")[0].slice(0, -3));
                }
              }}
            >
              {item[2]}
            </ListboxItem>)
          }
        </Listbox>
      </div>
    </div>
  );  
}
