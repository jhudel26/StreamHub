import { auth } from "../auth";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function getAccessToken() {
  const session = await auth();
  return session?.accessToken;
}
