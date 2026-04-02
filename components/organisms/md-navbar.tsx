"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Dropdown, Link, Input, Button, TextField, FieldError } from "@heroui/react";
import { Book, Menu } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";

export function MdNavbar(
  { goPageIfNecessary, doSearchIfNecessary } : {
    goPageIfNecessary: ((key: string, page: string) => void) | null;
    doSearchIfNecessary: ((key: string, searchText: string) => void) | null;
  }
) {
  const router = useRouter();
  const { data: session } = useSession();
  const [ searchText, setSearchText ] = useState<string>("");
  const [ pageName, setPageName ] = useState<string>("");
  
  const isInvalid = useMemo(() => {
    //const func_logger = logger.child({ "func": "MainPage.isInvalid" });
    //func_logger.debug({"message": "START"});

    const filenameNgPattern = /[\\\/:\*\?\"<>\|]/;
    if (pageName === "") {
      //func_logger.debug({"message": "END(searchText is null)", "res": false});
      return false;
    }

    const res = filenameNgPattern.test(pageName) ? true : false;
    //func_logger.debug({"message": "END", "res": res});
    return res;
  }, [pageName]);

  return (
    <nav className="sticky top-0 z-40 w-full bg-blue-200 min-w-fit mx-auto">
      <header className="flex h-10 items-center justify-between px-6">
        <div key="a">
          <Link href={process.env.NEXT_PUBLIC_BASE_PATH} className="no-underline">
            <Book size={24} /><p className="font-bold text-inherit mx-1">Markdown Diary</p>
          </Link>
        </div>
        <ul className="sm:flex gap-2" key="b">
          {doSearchIfNecessary != null ? (
            <li key="search">
              <Input type="search" placeholder="grep検索" value={searchText} onKeyPress={(e) => {
                if (e.target instanceof HTMLInputElement) {
                  doSearchIfNecessary(e.key, e.target.value);
                }
              }}
                onChange={(e) => setSearchText(e.target.value)}
                variant="primary"
                className="max-w-xs"
              />
            </li>
          ) : <></>
          }
          {goPageIfNecessary != null ? (
            <li key="page">
              <TextField name="page" aria-label="page">
                <Input placeholder="ページ名" value={pageName} onKeyPress={(e) => {
                  if (e.target instanceof HTMLInputElement && !isInvalid) {
                    goPageIfNecessary(e.key, e.target.value);
                  }
                }}
                  onChange={(e) => setPageName(e.target.value)}
                  variant={isInvalid ? "secondary" : "primary"}
                  className="max-w-xs"
                />
                <FieldError>ファイル名に使えない文字が含まれています</FieldError>
              </TextField>
            </li>
          ) : <></>
          }
          <li key="menu">
            <Dropdown>
              <Button isIconOnly variant="ghost" aria-label="Menu">
                <Menu size={24}/>
              </Button>
              <Dropdown.Popover>
                <Dropdown.Menu aria-label="Profile">
                  <Dropdown.Section>
                    <Dropdown.Item className="h-14 gap-2" key="username">
                      <p>Signed in as</p><p className="font-semibold">{session?.user?.name}</p>
                    </Dropdown.Item>
                  </Dropdown.Section>
                  <Dropdown.Section>
                    <Dropdown.Item key="main"
                      onPress={() => router.push('/')}
                    >
                       日記
                    </Dropdown.Item>
                    {/*<Dropdown.Item key="useradmin"
                      onPress={() => router.push('/users')}
                    >
                       ユーザ管理
                       </Dropdown.Item>}*/}
                  </Dropdown.Section>
                  <Dropdown.Section>
                    <Dropdown.Item variant="danger" onPress={async () => {
                      await authClient.signOut({
                        fetchOptions: {
                          onSuccess: () => {
                            router.push("/login");
                          },
                        },
                      });
                    }} key="logout">
                                      Logout
                    </Dropdown.Item>
                  </Dropdown.Section>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </li>
        </ul>
      </header>
    </nav>
  );
};
