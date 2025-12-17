'use client';

import NewGlossaryModal, { Glossary } from "@/components/BusinessGlossary/NewGlossaryModal";
import { useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT!;

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

export default function BusinessGlossary() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const createGlossaryMutation = useMutation({
    mutationFn: (glossary: Glossary) =>
      createGlossary(glossary),
    onSuccess: () => {
      // refetchGlossaries();
      setIsModalOpen(false);
      toast.success("Glossary created successfully!");
    },
    onError: (error) => {
      toast.error("Failed to create glossary");
      console.error('Failed to create glossary:', error);
    }
  });

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Glossary</h1>
          <p className="text-lg text-gray-600 mt-2">
            Classify your data assets and columns using data dictionaries
          </p>
        </div>
        <div>
          <button
            onClick={() => {
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow flex items-center gap-2"
          >
            <Plus size={16} />
            Create Glossary
          </button>
        </div>
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