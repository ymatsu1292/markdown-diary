'use client';
import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { getTodayStr } from '@/components/atoms/dateutils';
import { MiniCalendars } from '@/components/organisms/MiniCalendars';
import { ContentViewer } from '@/components/organisms/ContentViewer';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@nextui-org/react";
import { Link, Button, Input } from "@nextui-org/react";
import { Book } from '@phosphor-icons/react';

export function MainPage() {
  console.log("MainPage: START");
  const { data: session, status } = useSession();
  const [ targetPage, setTargetPage ] = useState(getTodayStr());
  const [ calendarDate, setCalendarDate ] = useState(getTodayStr());
  const datePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  const handleTargetPageChange = (newPage: string) => {
    console.log("MainPage.handleTargetPageChange() START:", newPage);
    setTargetPage(String(newPage));
    console.log("MainPage.handleTargetPageChange() END");
  };
  
  //let calendarDate = targetPage;
  //if (!datePattern.test(targetPage)) {
    // 日付以外のページなら今日をターゲットにする
  //calendarDate = getTodayStr();
  //}
  useEffect(() => {
    if (!datePattern.test(targetPage)) {
      // 日付以外のページなら今日をターゲットにする
      setCalendarDate(getTodayStr());
    } else {
      setCalendarDate(targetPage);
    }
  }, [targetPage]);

  useEffect(() => {
    console.log("MainPage.useEffect: START");
    if (session?.error == "refresh_access_token_error") {
      signIn();
    }
    console.log("MainPage.useEffect: END");
  }, [session]);

  console.log("session=", session);
  
  console.log("MainPage: END");
  return (
    <div>
      <Navbar position="sticky" height="3rem" isBordered className="bg-blue-200 min-w-fit mx-auto">
        <NavbarBrand key="a">
          <Book size={24} /><p className="font-bold text-inherit mx-1">Markdown Diary</p>
        </NavbarBrand>
        <NavbarContent className="sm:flex gap-2" justify="center" key="b">
	  <NavbarItem key="search">
            <Input type="search" size="sm" placeholder="ページ名" defaultValue={targetPage}/>
          </NavbarItem>
          <NavbarItem key="user">
	    <Button color="primary" variant="bordered" size="sm">{session?.user?.name}</Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
      <div>
	<div className="float-left">
	  <MiniCalendars calendarDate={calendarDate} handleTargetPageChange={handleTargetPageChange}/>
	</div>
	<div className="container mx-auto">
	  <ContentViewer targetPage={targetPage}/>
	</div>
      </div>
    </div>
  );
}
