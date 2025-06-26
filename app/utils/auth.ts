// utils/auth.ts
import Cookies from "js-cookie";

interface UserInfo {
  user_id: string;
  token: string;
}

export const getUserInfo = (): UserInfo => {
  const userInfo = Cookies.get("userInfo");
  if (!userInfo) throw new Error("User not authenticated");
  return JSON.parse(userInfo) as UserInfo;
};

export const getUserId = (): string => {
  return getUserInfo().user_id;
};

export const getUserToken = (): string => {
  return getUserInfo().token;
};
