export type Role = "admin" | "user";

export interface UserData {
  id?: string;
  email: string;
  password: string;
  username: string;
  name: string;
  role: Role;
  banned?: boolean;
  banReason?: string;
  banExpires: number | null;
  newPassword?: string;
};

export interface UsersData {
  count: number;
  results: UserData[];
};

export const baseUserData: UserData = {
    name: "", email: "", role: "user" as Role, username: "", id: "",
    password: "", banned: false, banReason: "", banExpires: null, newPassword: ""
};
