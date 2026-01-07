"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection, Avatar } from "@heroui/react";
import { Link, Input, Button } from "@heroui/react";
import { Book, Menu } from "lucide-react";

import { signOut, useSession } from "@/lib/auth-client";

export function MdNavbar(
  { doSearchIfNecessary } : {
    doSearchIfNecessary: ((key: string, page: string) => void) | null,
  }
) {
  const router = useRouter();
  const { data: session } = useSession();
  const [ searchText, setSearchText ] = useState<string>("");
  const isInvalid = useMemo(() => {
    //const func_logger = logger.child({ "func": "MainPage.isInvalid" });
    //func_logger.debug({"message": "START"});

    const filenameNgPattern = /[\\\/:\*\?\"<>\|]/;
    if (searchText === "") {
      //func_logger.debug({"message": "END(searchText is null)", "res": false});
      return false;
    }

    const res = filenameNgPattern.test(searchText) ? true : false;
    //func_logger.debug({"message": "END", "res": res});
    return res;
  }, [searchText]);
  
  return (
    <Navbar position="sticky" height="3rem" isBordered className="bg-blue-200 min-w-fit mx-auto">
      <NavbarBrand key="a">
        <Link href={process.env.NEXT_PUBLIC_BASE_PATH} color="foreground">
          <Book size={24} /><p className="font-bold text-inherit mx-1">Markdown Diary</p>
        </Link>
      </NavbarBrand>
      <NavbarContent className="sm:flex gap-2" justify="center" key="b">
        {doSearchIfNecessary != null ? (
        <NavbarItem key="search">
          <Input type="search" size="sm" placeholder="ページ名" value={searchText} onKeyPress={(e) => {
            if (e.target instanceof HTMLInputElement) {
              doSearchIfNecessary(e.key, e.target.value);
            }
          }}
            onValueChange={setSearchText}
            isInvalid={isInvalid} errorMessage={isInvalid && "ファイル名に使えない文字が含まれています"}
            color={isInvalid ? "danger" : "default"}
            className="max-w-xs"
          />
        </NavbarItem>
        ) : <></>
        }
        <NavbarItem key="menu">
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button isIconOnly variant="light" title="menu"><Menu size={24}/></Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile" variant="flat">
              <DropdownSection showDivider>
                <DropdownItem className="h-14 gap-2" key="username">
                  <p>Signed in as</p><p className="font-semibold">{session?.user?.name}</p>
                </DropdownItem>
              </DropdownSection>
              <DropdownSection showDivider>
                <DropdownItem key="main"
                  onPress={() => router.push('/')}
                >
                   日記
                </DropdownItem>
                <DropdownItem key="useradmin"
                  onPress={() => router.push('/users')}
                >
                   ユーザ管理
                </DropdownItem>
              </DropdownSection>
              <DropdownSection>
                <DropdownItem color="danger" onPress={async () => {
                  await signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        router.push("/login");
                      },
                    },
                  });
                }} key="logout">
                                  Logout
                </DropdownItem>
            </DropdownSection>
              </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
};
