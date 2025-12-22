
const API_BASE_URL = "http://localhost:8080/api/graphql";

export async function gqlRequest<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();

  if (json.errors) {
    console.error(json.errors);
    throw new Error(json.errors[0].message);
  }

  return json.data;
}
