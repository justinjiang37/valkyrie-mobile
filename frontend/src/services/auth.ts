import { supabase } from "../lib/supabase";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
}

async function fetchProfile(userId: string): Promise<{ name: string }> {
  const { data } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", userId)
    .maybeSingle();
  return { name: data?.name ?? "" };
}

function userFromSession(
  sessionUser: { id: string; email?: string | null } | null,
  name: string
): User | null {
  if (!sessionUser) return null;
  return {
    id: sessionUser.id,
    email: sessionUser.email ?? "",
    name,
  };
}

export async function register(
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Registration failed");
  if (!data.session) {
    throw new Error("Check your email to confirm your account before signing in.");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: data.user.id, name });
  if (profileError) throw new Error(profileError.message);

  return {
    user: { id: data.user.id, email: data.user.email ?? email, name },
  };
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Login failed");

  const { name } = await fetchProfile(data.user.id);
  return {
    user: { id: data.user.id, email: data.user.email ?? email, name },
  };
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { name } = await fetchProfile(data.user.id);
  return userFromSession(data.user, name);
}

export async function updateProfile(updates: {
  name?: string;
  newPassword?: string;
}): Promise<User> {
  const { data: sessionData } = await supabase.auth.getUser();
  if (!sessionData.user) throw new Error("Not signed in");

  if (updates.name !== undefined) {
    const { error } = await supabase
      .from("profiles")
      .update({ name: updates.name })
      .eq("id", sessionData.user.id);
    if (error) throw new Error(error.message);
  }

  if (updates.newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: updates.newPassword,
    });
    if (error) throw new Error(error.message);
  }

  const { name } = await fetchProfile(sessionData.user.id);
  return {
    id: sessionData.user.id,
    email: sessionData.user.email ?? "",
    name,
  };
}

export async function isAuthenticated(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}
