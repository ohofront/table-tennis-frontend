"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, json, list } from "@/lib/api";
export function useApi<T>(path: string, enabled = true) {
  return useQuery({
    queryKey: [path],
    queryFn: ({ signal }) => api<T>(path, { signal }),
    enabled,
  });
}
export function useList<T>(path: string, enabled = true) {
  return useQuery({
    queryKey: [path],
    queryFn: ({ signal }) => list<T>(path, signal),
    enabled,
  });
}
export function useWrite<T, V>(path: string, method = "POST") {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: V) => api<T>(path, json(method, body)),
    onSuccess: () => client.invalidateQueries(),
  });
}
