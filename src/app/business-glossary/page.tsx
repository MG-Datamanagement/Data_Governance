'use client';

import NewGlossaryModal, { Glossary } from "@/components/BusinessGlossary/NewGlossaryModal";
import { GraphQLResponse } from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, BoxSelect, Bookmark } from "lucide-react";
import { MdOutlineBookmarks } from "react-icons/md";
import { useState } from "react";
import toast from "react-hot-toast";

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT_LOCAL!;

const CREATE_GLOSSARY_MUTATION = `
  mutation createGlossary($name: String!, $description: String!) {
    createGlossaryNode(
      input: {
        name: $name
        description: $description
      }
    )
  }
`;

const createGlossary = async (data: Glossary) => {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: CREATE_GLOSSARY_MUTATION,
      variables: {
        name: data.name,
        description: data.documentation,
      },
    }),
  });

  const json = await res.json();

  if (json.errors) {
    throw new Error(json.errors[0].message);
  }

  return json.data.createGlossaryNode;
};

const FETCH_GLOSSARYS_QUERY = `query ListGlossaryNodes {
  searchAcrossEntities(
    input: {
      types: [GLOSSARY_NODE]
      query: ""
      start: 0
      count: 100
    }
  ) {
    total
    searchResults {
      entity {
        ... on GlossaryNode {
          urn
          properties {
            name
            description
          }
        }
      }
    }
  }
}`;

async function gqlRequest<T>(query: string, variables: Record<string, any>, signal?: AbortSignal): Promise<T> {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables })
  })

  const json: GraphQLResponse<T> = await res.json();

  if (json?.errors && json?.errors?.length > 0) {
    console.error('GraphQL errors:', json?.errors);
    throw new Error(json?.errors?.[0]?.message);
  }

  if (!json?.data) {
    throw new Error('No data returned from GraphQL');
  }

  return json?.data;
}

async function fetchGlossary(page: number = 1, _search: string = ""): Promise<any> {
  const size = 20;
  const start = (page - 1) * size

  const data = await gqlRequest<any>(FETCH_GLOSSARYS_QUERY, { start, count: size });

  const searchResults = data?.searchAcrossEntities?.searchResults || [];

  const glossary = searchResults?.map((result: any) => {

    return {
      urn: result?.entity?.urn,
      name: result?.properties?.name,
      description: result?.properties?.description
    }
  })

  return {
    glossary,
    total: data?.searchAcrossEntities?.total || 0,
    page,
    size,
    has_next: start + size < (data?.search?.total || 0),
  };

}

const HEADER_COLORS = [
  "bg-neutral-600",
  "bg-cyan-600",
  "bg-rose-600",
  "bg-green-600",
  "bg-slate-600",
  "bg-sky-600",
  "bg-yellow-600",
  "bg-red-600",
  "bg-indigo-600",
  "bg-orange-600",
  "bg-blue-600",
  "bg-purple-600",
  "bg-stone-600",
  "bg-gray-600",
  "bg-fuchsia-600",
  "bg-lime-600",
  "bg-violet-600",
  "bg-amber-600",
  "bg-teal-600",
  "bg-zinc-600",
  "bg-pink-600",
];

const colorCache = new Map<string, string>();
const DEFAULT_COLOR = "bg-slate-500";

function getHeaderColor(urn: string, name?: string) {
  // if (!name) return DEFAULT_COLOR;

  if (!colorCache.has(urn)) {
    const color =
      HEADER_COLORS[Math.floor(Math.random() * HEADER_COLORS.length)];
    colorCache.set(urn, color);
  }

  return colorCache.get(urn)!;
}


export default function BusinessGlossary() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data: glossaryList, isFetching, refetch: refetchGlossary } = useQuery<any>({ queryKey: ['glossary', page], queryFn: () => fetchGlossary(page), retry: 2 })

  const createGlossaryMutation = useMutation({
    mutationFn: (glossary: Glossary) =>
      createGlossary(glossary),
    onSuccess: () => {
      refetchGlossary();
      setIsModalOpen(false);
      toast.success("Glossary created successfully!");
    },
    onError: (error) => {
      toast.error("Failed to create glossary");
      console.error('Failed to create glossary:', error);
    }
  });

  return (
    <div className="p-6 min-h-screen bg-gray dark:bg-gray-900 transition-colors space-y-4">
      <div className="flex justify-between items-end p-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Business Glossary</h1>
          <p className="text-base text-gray-600 dark:text-gray-300 mt-2">
            Classify your data assets and columns using data dictionaries
          </p>
        </div>
        {glossaryList?.glossary?.length && <div>
          <button
            onClick={() => {
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow flex items-center gap-2"
          >
            <Plus size={16} />
            Create Glossary
          </button>
        </div>}
      </div>

      <div className="bg-white shadow rounded-lg min-h-screen">
        {isFetching && (
          <div className="flex flex-wrap gap-4 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-44 h-48 rounded-xl border border-gray-200 bg-gray-100 animate-pulse"
              >
                <div className="h-16 bg-gray-200 rounded-t-xl" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-5/6 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!isFetching && !glossaryList?.glossary?.length && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <BoxSelect className="h-6 w-6 text-slate-400" />
            </div>

            <h4 className="text-lg font-semibold text-slate-800">
              Empty Glossary
            </h4>

            <p className="mt-2 max-w-md text-sm text-slate-500">
              Create your first business glossary to start classifying your data assets
              using a shared vocabulary.
            </p>

            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              <Plus size={16} />
              Create Glossary
            </button>
          </div>
        )}

        {/* LIST VIEW */}
        {!isFetching && glossaryList?.glossary?.length > 0 && (
          <div className="flex flex-wrap items-start gap-6 p-8">
            {([...(glossaryList.glossary || [])]).map((glossary: any) => {

              const headerColor = getHeaderColor(glossary?.urn, glossary?.name);

              return (
                <button
                  key={glossary.urn}
                  title={glossary.name}
                  className="w-40 h-auto cursor-pointer border border-gray-200 rounded-xl shadow-sm
                     transition-all hover:shadow-md hover:border-blue-400"
                >
                  <div className={`px-2 py-5 rounded-t-xl flex items-center gap-2 ${headerColor}`}>
                    <MdOutlineBookmarks className="w-5 h-5 text-white shrink-0" />
                    <span className="text-sm font-bold text-white truncate">
                      {glossary.name || "Unknown Name"}
                    </span>
                  </div>

                  <div className="flex flex-col justify-between flex-1 p-3">
                    <div className="text-sm text-gray-400 text-center line-clamp-2 h-12">
                      {glossary.description || "No description provided"}
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <div
                        className="flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-1 text-xs text-gray-500"
                        title="Contains term groups"
                      >
                        <MdOutlineBookmarks className="w-4 h-4" />
                      </div>

                      <div
                        className="flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-1 text-xs text-gray-500"
                        title="Contains terms"
                      >
                        <Bookmark className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <NewGlossaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(glossaryData: Glossary) => createGlossaryMutation.mutate(glossaryData)}
        isLoading={createGlossaryMutation.isPending}
      />
    </div>
  )
}