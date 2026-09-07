"use client";
import { useSWRConfig } from "swr";
import type { UseOverlayStateReturn } from "@heroui/react";
import { useSession, authClient } from "@/lib/auth-client";
import { useState } from "react";
import { Modal } from "@heroui/react";
import { Input, Button, TextField, FieldError, Switch } from "@heroui/react";
import { Select, Label, ListBox } from "@heroui/react";
import { Eye } from "lucide-react";

import type { UserData, Role } from "@/types/users-data-type";
import { baseUserData } from "@/types/users-data-type";

const roles: { key: Role; label: string; }[] = [
  {key: "admin", label: "管理者"},
  {key: "user", label: "一般ユーザ"},
];

export function UserEditModal({
  modalState, origUser, setOrigUser, editUser, setEditUser, page, filterKey, filter
} : {
  modalState: UseOverlayStateReturn;
  origUser: UserData;
  setOrigUser: (userData: UserData) => void;
  editUser: UserData;
  setEditUser: (userData: UserData) => void;  
  page: number;
  filterKey: string;
  filter: string;
}) {
  const { mutate } = useSWRConfig();
  const { data: session } = useSession();
  const [ passwordIsVisible, setPasswordIsVisible ] = useState<boolean>(false);
  const togglePasswordIsVisible = () => setPasswordIsVisible(!passwordIsVisible);
  const [ oldPasswordIsVisible, setOldPasswordIsVisible ] = useState<boolean>(false);
  const toggleOldPasswordIsVisible = () => setOldPasswordIsVisible(!oldPasswordIsVisible);
  const [ errorMessage, setErrorMessage ] = useState<string>("");

  let hasError: boolean = false;
  
  const usernameErrors: string[] = [];
  if (editUser.username.length < 2) {
    usernameErrors.push("ユーザ名は3文字以上にしてください");
    hasError = true;
  }
  if (!editUser.username.match(/^[A-Za-z0-9_-]+$/)) {
    usernameErrors.push("ユーザ名にはアルファベット・数字・-・_のみ利用可能です");
    hasError = true;
  }
  
  const nameErrors: string[] = [];
  if (editUser.name.length === 0) {
    nameErrors.push("ユーザ名は1文字以上にしてください");
    hasError = true;
  }
  
  const emailErrors: string[] = [];
  if (!editUser.email.match(/^.+@.+$/)) {
    emailErrors.push("メールアドレスには@が必要です");
    hasError = true;
  }
  
  const passwordErrors: string[] = [];
  if ((editUser.id == "" || editUser.newPassword.length > 0) && editUser.newPassword.length < 8) {
    passwordErrors.push("パスワードは8文字以上にしてください");
    hasError = true;
  }
  
  const onSubmit = async () => {
    let result = true;
    if (origUser.id == "") {
      // 新規
      const { data: newUser, error } = await authClient.admin.createUser({
        email: editUser.email,
        password: editUser.newPassword,
        name: editUser.name,
        role: editUser.role,
        data: { username: editUser.username, displayUsername: editUser.name },
      });
      if (error) {
        setErrorMessage(error?.message || "system error");
        result = false;
      } else {
        if (editUser.banned) {
          //console.log("banned", newUser);
          await authClient.admin.banUser({
            userId: newUser.user.id,
            banReason: editUser.banReason,
            banExpiresIn: parseInt(editUser.banExpiresIn)
          });
        }
      }
    } else if (session?.user?.role === "admin") {
      // 更新
      setErrorMessage("");
      const updateData: { [key: string]: string } = {};
      if (origUser.email != editUser.email) {
        updateData["email"] = editUser.email;
      }
      if (origUser.name != editUser.name) {
        updateData["name"] = editUser.name;
      }
      if (origUser.username != editUser.username) {
        updateData["username"] = editUser.username;
      }
      if (Object.keys(updateData).length > 0) {
        const { error: error2 } = await authClient.admin.updateUser({
          userId: editUser.id,
          data: updateData,
        });
        //console.log("data6=", data);
        setErrorMessage(error2?.message || "");
        if (error2 !== null) {
          result = false;
        }
      }
      if (editUser.newPassword !== "") {
        const { error: error2 } = await authClient.admin.setUserPassword({
          userId: editUser.id,
          newPassword: editUser?.newPassword || "",
        });
        setErrorMessage(error2?.message || "");
        if (error2 !== null) {
          result = false;
          setErrorMessage(error2?.message || "system error");
        }
      }
      if (result && origUser.role != editUser.role) {
        const { error: error3 } = await authClient.admin.setRole({
          userId: editUser.id,
          role: editUser.role,
        });
        if (error3 !== null) {
          result = false;
          setErrorMessage(error3?.message || "system error");
        }
      }
      if (editUser.banned && !origUser.banned) {
        //console.log("banned(update)");
        await authClient.admin.banUser({
          userId: editUser.id,
          banReason: editUser.banReason,
          banExpiresIn: parseInt(editUser.banExpiresIn)
        });
      } else if (!editUser.banned && origUser.banned) {
        //console.log("unban(update)");
        await authClient.admin.unbanUser({
          userId: editUser.id,
        });
      }
    } else {
      // 更新
      setErrorMessage("");
      const updateData: { [key: string]: string } = {};
      if (origUser.email != editUser.email) {
        updateData["email"] = editUser.email;
      }
      if (origUser.name != editUser.name) {
        updateData["name"] = editUser.name;
      }
      if (origUser.username != editUser.username) {
        updateData["username"] = editUser.username;
      }
      if (Object.keys(updateData).length > 0) {
        await authClient.updateUser(updateData);
      }
      // 一般ユーザのパスワード変更
      if (editUser.password != "" && editUser.newPassword != "") {
        const { error: error2 } = await authClient.changePassword({
          newPassword: editUser.newPassword,
          currentPassword: editUser.password,
          revokeOtherSessions: true,
        });
        if (error2 != null) {
          setErrorMessage(error2?.message || "");
          result = false;
        }
      }
    }
    return result;
  };

  return (
    <Modal isOpen={modalState.isOpen}>
      <Button variant="primary" className="mx-2 my-1 p-1 rounded-lg" onPress={() => {
        setOrigUser(baseUserData);
        setEditUser(baseUserData);
        modalState.open();
      }}>ユーザ追加</Button>
      <Modal.Backdrop>
        <Modal.Container size="lg">
          <Modal.Dialog>
            <Modal.Header className="flex flex-col gap-1">{
              editUser.id == "" ? <>ユーザ追加</> : <>ユーザ情報編集</>
            }</Modal.Header>
            <Modal.Body>
              <div className="flex flex-col m-2 p-2">
                <div className="flex flex-row items-center">
                  <Label className="w-25" id="userid-label">ユーザID</Label>
                  <TextField isDisabled name="userId"
                    defaultValue={editUser.id}
                    aria-labelledby="userid-label"
                  >
                    <Input key="userId"
                      className="m-1 p-1 w-75"
                    />
                  </TextField>
                </div>
                <div className="flex flex-row items-center">
                  <Label className="w-25" id="username-label">ユーザ名</Label>
                  <TextField isRequired isInvalid={usernameErrors.length > 0}
                    name="username"
                    value={editUser.username}
                    onChange={(value) => setEditUser({...editUser, username: value} as UserData)}
                    aria-labelledby="username-label"
                  >
                    <Input key="username"
                      className="m-1 p-1 w-75"
                      variant={editUser.username == origUser.username ? "primary" : "secondary"}
                    />
                    {usernameErrors.map((error, i) => (
                      <FieldError key={i}>{error}</FieldError>
                    ))}
                  </TextField>
                </div>
                <div className="flex flex-row items-center">
                  <Label className="w-25" id="name-label">氏名</Label>
                  <TextField isInvalid={nameErrors.length > 0}
                    name="name"
                    value={editUser.name}
                    onChange={(value) => setEditUser({...editUser, name: value} as UserData)}
                    aria-labelledby="name-label"
                  >
                    <Input key="name"
                      className="m-1 p-1 w-75"
                      variant={editUser.name == origUser.name ? "primary" : "secondary"}
                    />
                    {nameErrors.map((error, i) => (
                      <FieldError key={i}>{error}</FieldError>
                    ))}
                  </TextField>
                </div>
                <div className="flex flex-row items-center">
                  <Label className="w-25" id="email-label">メールアドレス</Label>
                  <TextField isRequired isInvalid={emailErrors.length > 0}
                    name="email"
                    value={editUser.email}
                    onChange={(value) => setEditUser({...editUser, email: value} as UserData)}
                    aria-labelledby="email-label"
                  >
                    <Input key="email" autoComplete=""
                      className="m-1 p-1 w-75"
                      variant={(editUser.email == origUser.email) ? "primary" : "secondary"}
                      data-invalid={emailErrors.length > 0}
                      disabled={session?.user?.role === "admin" ? false : true}
                    />
                    {emailErrors.map((error, i) => (
                      <FieldError key={"ee"+i}>{error}</FieldError>
                    ))}
                  </TextField>
                </div>
                {session?.user?.role != "admin" ?
                  <div className="flex flex-row items-center">
                    <Label className="w-25" id="old-passwd-label">旧パスワード</Label>
                    <TextField name="old-password"
                      value={editUser.password}
                      onChange={(value) => setEditUser({...editUser, password: value} as UserData)}
                      aria-labelledby="old-passwd-label"
                    >
                      <Input key="old-password" autoComplete="new-password"
                        className="m-1 p-1 w-75"
                        variant={(editUser.password == "") ? "primary" : "secondary"}
                        type={oldPasswordIsVisible ? "text" : "password"}
                      />
                    </TextField>
                    <button className="focus:outline-solid outline-transparent" type="button"
                      onClick={toggleOldPasswordIsVisible}>
                      <Eye />
                    </button>
                  </div>
                  :
                  <></>
                }
                <div className="flex flex-row items-center">
                  <Label className="w-25" id="new-password-label">新パスワード</Label>
                  <TextField name="new-password" isRequired isInvalid={passwordErrors.length > 0}
                    value={editUser.newPassword}
                    onChange={(value) => setEditUser({...editUser, newPassword: value} as UserData)}
                    aria-labelledby="new-password-label"
                  >
                    <Input key="new-password" autoComplete="new-password"
                      className="m-1 p-1 w-75"
                      variant={(editUser.newPassword == "") ? "primary" : "secondary"}
                      type={passwordIsVisible ? "text" : "password"}
                      data-invalid={passwordErrors.length > 0}
                    />
                    {passwordErrors.map((error, i) => (
                      <FieldError key={i}>{error}</FieldError>
                    ))}
                  </TextField>
                  <button className="focus:outline-solid outline-transparent" type="button"
                    onClick={togglePasswordIsVisible}>
                    <Eye />
                  </button>
                </div>
                <div className="flex items-center">
                  <Label className="w-25" id="role-label">ロール</Label>
                  <Select key="role" 
                    className="ml-1 w-75"
                    selectedKey={editUser.role}
                    onChange={(value) => setEditUser({...editUser, role: value as Role} as UserData)}
                    isDisabled={editUser.id == session?.user?.id}
                    aria-labelledby="role-label"
                  >
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {roles.map((role) => (
                          <ListBox.Item id={role.key} textValue={role.label} key={role.key}>
                            {role.label}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}              
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
                {session?.user?.role === "admin" ?
                  <div>
                    <div className="flex items-center my-1">
                      <Label className="w-25" id="ban-label">BAN</Label>
                      <Switch
                        isSelected={editUser.banned}
                        onChange={(value) => setEditUser({...editUser, banned: value})} size="lg"
                        className="ml-1"
                      >
                        <Switch.Control>
                          <Switch.Thumb>
                          </Switch.Thumb>
                        </Switch.Control>
                      </Switch>
                    </div>
                    <div className="flex items-center my-1">
                      <Label className="w-25" id="ban-reason-label">BAN理由</Label>
                      <TextField name="ban-reason" onChange={(value) => setEditUser({...editUser, banReason: value} as UserData)}
                        value={editUser.banReason}
                        aria-labelledby="ban-reason-label">
                        <Input key="ban-reason"
                          className="mt-0 p-1 w-75"
                          variant="primary"
                        />
                      </TextField>
                    </div>
                    <div className="flex items-center">
                      <Label className="w-25" id="ban-expire-label">BAN時間(秒)</Label>
                      <TextField name="ban-expires" type="number"
                        aria-labelledby="ban-expires-label"
                        value={editUser.banExpiresIn} 
                        onChange={(value) => setEditUser({...editUser, banExpiresIn: value} as UserData)}
                      >
                        <Input key="ban-expires"
                          min="0"
                        />
                      </TextField>
                    </div>
                  </div>
                  : <></>
                }
                <Label id="error-message">
                  {errorMessage}
                </Label>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button variant="primary"
                  onPress={async () => {
                    const res = await onSubmit();
                    if (res) {
                      //console.log(`api/users?page=${page}&key=${filterKey}&filter=${filter}`);
                      await mutate(`api/users?page=${page}&key=${filterKey}&filter=${filter}`);
                      modalState.close();
                    }
                  }}
                  isDisabled={hasError}
                >{
                  editUser.id == "" ? <>追加</> : <>更新</>
                }</Button>
                {editUser.id === "" ? <></> :
                <Button variant="danger"
                  onPress={async () => {
                    const { error } = await authClient.admin.removeUser({
                      userId: editUser.id
                    });
                    if (error) {
                      alert(error);
                    } else {
                      //console.log(`api/users?page=${page}&key=${filterKey}&filter=${filter}`);
                      await mutate(`api/users?page=${page}&key=${filterKey}&filter=${filter}`);
                      modalState.close();
                    }
                  }}
                  isDisabled={editUser.id == session?.user?.id}
                >削除</Button>
                }
                <span className="grow"></span>
                <Button variant="danger"
                  onPress={() => {
                    setEditUser(origUser)
                  }}
                >
                   クリア
                </Button>
                <Button variant="danger"
                  onPress={modalState.close}
                >
                   閉じる
                </Button>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>              
    </Modal>
  );  
}
