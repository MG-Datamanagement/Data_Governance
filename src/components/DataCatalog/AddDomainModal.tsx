import { gqlRequest } from "@/lib/graphqlClient"
import { DomainsDataResponse } from "@/services/DomainsDataResponse"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

type AddDomainModalProps = {
  open: boolean
  onClose: () => void
  entityUrn: string
}

const LIST_DOMAINS_QUERY = `
query listAllDomains {
      listDomains(input: { start: 0, count: 100 }) {
        total
        domains {
          urn
          id
          ownership {
            owners {
              owner {
                ...on CorpUser {
                  username
                }
              }
            }
          }
          properties {
            name
            description
            createdOn {
              time
            }
          }
        }
      }
    }
`;

const SET_DOMAIN_MUTATION = `
mutation SetDomain($entityUrn: String!, $domainUrn: String!) {
  setDomain(
    entityUrn: $entityUrn
    domainUrn: $domainUrn
  )
}
`;

export default function AddDomainModal({
  open,
  onClose,
  entityUrn,
}: AddDomainModalProps) {
  const [selectedDomainUrn, setSelectedDomainUrn] = useState<string | null>(null)
  const queryClient = useQueryClient()

  /* Fetch domains */
  const { data, isLoading } = useQuery({
    queryKey: ['listDomains'],
    queryFn: () => gqlRequest(LIST_DOMAINS_QUERY),
    enabled: open,
  })

  /* Set domain */
  const setDomainMutation = useMutation({
    mutationFn: (domainUrn: string) =>
      gqlRequest(SET_DOMAIN_MUTATION, {
        entityUrn,
        domainUrn,
      }),

    onSuccess: () => {
      toast.success('Domain added successfully')
      queryClient.invalidateQueries({ queryKey: ['dataset', entityUrn] })
      onClose()
    },

    onError: () => {
      toast.error('Failed to add domain')
    },
  })

  /* Lock background scroll */
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const domains = data?.listDomains?.domains ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Add Domain</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>

        {/* Domain List */}
        <div
          className="max-h-64 overflow-y-auto overscroll-contain space-y-2 px-4 py-3"
          onWheel={(e) => e.stopPropagation()}
        >
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading domains…</p>
          ) : domains.length === 0 ? (
            <p className="text-sm text-gray-500">No domains found</p>
          ) : (
            domains.map((domain: any) => (
              <label
                key={domain.urn}
                className="flex cursor-pointer items-center gap-3 rounded border px-3 py-2 hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="domain"
                  checked={selectedDomainUrn === domain.urn}
                  onChange={() => setSelectedDomainUrn(domain.urn)}
                />
                <span className="text-sm">
                  {domain.properties?.name}
                </span>
              </label>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <button
            onClick={onClose}
            className="rounded border px-4 py-2 text-sm"
          >
            Cancel
          </button>

          <button
            disabled={!selectedDomainUrn || setDomainMutation.isPending}
            onClick={() =>
              setDomainMutation.mutate(selectedDomainUrn!)
            }
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

