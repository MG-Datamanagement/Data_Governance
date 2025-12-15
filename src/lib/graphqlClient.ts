
const API_BASE_URL = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT!;

export async function gqlRequest<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
